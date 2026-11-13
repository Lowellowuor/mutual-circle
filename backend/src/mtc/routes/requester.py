"""Requester routes — token-authenticated via X-Token header."""
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from fastapi.responses import FileResponse
from pathlib import Path
import re

from pydantic import BaseModel, Field, model_validator

import logging

import asyncpg

from mtc import idempotency
from mtc.config import settings
from mtc.mpesa.client import initiate_stk_push
from mtc.db.main import get_conn
from mtc.rate_limit.counter import RateLimitExceeded, consume_quota, check_ip_rate_limit
from fastapi import Request
from mtc.requests_.lifecycle import WithdrawNotAllowed, list_requests, withdraw_request
from mtc.requests_.pool import create_pool
from mtc.requests_.swap import create_swap
from mtc.tokens.hmac import is_valid_token_format

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/requests", tags=["requests"])


async def require_token(x_token: str = Header(..., alias="X-Token")) -> str:
    if not is_valid_token_format(x_token):
        raise HTTPException(401, "Invalid token format")
    return x_token


class SwapBody(BaseModel):
    bundle_category: str = Field(..., min_length=1, max_length=80)
    locker_location: str = Field(..., min_length=1, max_length=80)


class PoolBody(BaseModel):
    category: str = Field(..., pattern="^(utility|school_fee|hospital_invoice)$")
    hashed_object_id: str = Field(..., min_length=4, max_length=64)
    amount_pence: int = Field(..., gt=0, le=100_000_000)

    @model_validator(mode='after')
    def _validate_object_format(self):
        # R.U.T.H 4.3: object-level verification. Format check per
        # category so a client can't submit 'hello' as a meter number.
        # Real existence + unpaid + amount match is a downstream check
        # (spec 8 item 2 — external lookup unconfirmed; fallback is
        # photo + automated plausibility).
        patterns = {
            'utility':          r'^\d{8,12}$',
            'school_fee':       r'^[A-Z0-9]{6,10}$',
            'hospital_invoice': r'^[A-Z0-9-]{4,12}$',
        }
        pattern = patterns[self.category]
        if not re.fullmatch(pattern, self.hashed_object_id):
            raise ValueError(
                f"Invalid object ID format for {self.category}. "
                f"Expected pattern: {pattern}"
            )
        return self


class PayBody(BaseModel):
    phone: str = Field(..., min_length=9, max_length=15,
                       description="Kenyan phone (07XX or +2547XX). Amount is taken from the request, not the body.")


@router.post("/swap")
async def create_swap_route(
    body: SwapBody,
    token: str = Depends(require_token),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    cached = await idempotency.check_or_claim(conn, idempotency_key, "swap", token)
    if cached is not None:
        return cached

    try:
        try:
            await consume_quota(conn, token_hash=token, value_pence=0)
        except RateLimitExceeded as e:
            raise HTTPException(429, detail={"reason": e.reason, "count": e.count, "value_pence": e.value_pence})
        hh = await conn.fetchval(
            "SELECT household_size FROM household_declarations WHERE token_hash = $1",
            token,
        )
        response = await create_swap(
            conn,
            token_hash=token,
            bundle_category=body.bundle_category,
            locker_location=body.locker_location,
            household_size=hh,
        )
        await idempotency.complete(conn, idempotency_key, "swap", token, response)
        return response
    except HTTPException:
        await idempotency.release(conn, idempotency_key, "swap", token)
        raise
    except Exception:
        await idempotency.release(conn, idempotency_key, "swap", token)
        raise


@router.post("/pool")
async def create_pool_route(
    body: PoolBody,
    token: str = Depends(require_token),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    cached = await idempotency.check_or_claim(conn, idempotency_key, "pool", token)
    if cached is not None:
        return cached

    try:
        try:
            await consume_quota(conn, token_hash=token, value_pence=body.amount_pence)
        except RateLimitExceeded as e:
            raise HTTPException(429, detail={"reason": e.reason, "count": e.count, "value_pence": e.value_pence})
        response = await create_pool(
            conn,
            token_hash=token,
            category=body.category,
            hashed_object_id=body.hashed_object_id,
            amount_pence=body.amount_pence,
        )
        await idempotency.complete(conn, idempotency_key, "pool", token, response)
        return response
    except HTTPException:
        await idempotency.release(conn, idempotency_key, "pool", token)
        raise
    except Exception:
        await idempotency.release(conn, idempotency_key, "pool", token)
        raise


@router.post("/{request_id}/pay")
async def pay_route(
    request_id: str,
    body: PayBody,
    request: Request,
    token: str = Depends(require_token),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Trigger STK Push for a pool request.

    The amount is taken from requests.amount_pence, NOT the request body
    — a caller cannot specify a smaller amount than the request's locked
    amount. Account reference is REF-<request_id[:8]>, matching the
    format already used in notifications.

    Status flow:
      n/a             -> pending_payment   STK sent, awaiting callback
      payment_failed  -> pending_payment   retry allowed (new STK)
      pending_payment -> 409               STK already in flight
      paid            -> 409               already paid
      other states    -> 409               request not payable

    Idempotency scope is "pool_pay" (distinct from "pool" for create),
    so a retry with the same Idempotency-Key returns the cached
    checkout_request_id rather than triggering a second STK.

    Failure modes:
      - Bad phone format         -> 400 (ValueError from client._normalize_phone)
      - Daraja config missing /
        Daraja-side rejection    -> 503 (RuntimeError from initiate_stk_push)
      - DB write fails after STK -> logged with checkout_id; the payment
        went through on Daraja's side, reconciliation required
    """
    try:
        await check_ip_rate_limit(conn, ip_address=request.client.host, endpoint="pay")
    except RateLimitExceeded as e:
        raise HTTPException(429, detail=e.reason)

    cached = await idempotency.check_or_claim(conn, idempotency_key, "pool_pay", token)
    if cached is not None:
        return cached

    try:
        row = await conn.fetchrow(
            """SELECT id, amount_pence, payment_status, token_hash
               FROM requests WHERE id = $1""",
            request_id,
        )
        if row is None or row["token_hash"] != token:
            raise HTTPException(404, "Request not found")

        if row["amount_pence"] is None:
            raise HTTPException(409, "Request has no fixed amount; payment not applicable")

        current = row["payment_status"]
        if current == "paid":
            raise HTTPException(409, "Request already paid")
        if current == "pending_payment":
            raise HTTPException(409, "Payment already in progress")

        account_ref = "REF-" + str(row["id"])[:8].upper()

        try:
            stk = await initiate_stk_push(
                phone=body.phone,
                amount_pence=row["amount_pence"],
                account_ref=account_ref,
                description="Mutual Circle pool",
            )
        except ValueError as exc:
            raise HTTPException(400, f"Invalid phone number: {exc}") from exc
        except RuntimeError as exc:
            logger.error(
                "STK push failed for request %s (amount_pence=%s): %s",
                request_id, row["amount_pence"], exc,
            )
            raise HTTPException(503, f"Payment initiation failed: {exc}") from exc

        checkout_id = stk["checkout_request_id"]
        logger.info(
            "STK sent for request %s, checkout_id=%s amount_pence=%s",
            request_id, checkout_id, row["amount_pence"],
        )

        # R.U.T.H 4.8 / payments review issue #3:
        # STK has already fired. The INSERT into mpesa_transactions is the
        # critical write. If it fails, log at CRITICAL and tell caller NOT
        # to retry (a retry would fire a second STK prompt and double-charge).
        try:
            await conn.execute(
                """INSERT INTO mpesa_transactions (checkout_request_id, amount_pence, target_table, target_id, expected_phone)
                   VALUES ($1, $2, 'requests', $3, $4)""",
                checkout_id, row["amount_pence"], row["id"], stk["phone"],
            )
        except Exception as exc:
            logger.critical(
                "PAYMENT_LOST: STK fired but save failed. "
                "checkout_id=%s request_id=%s amount_pence=%s phone=%s error=%r",
                checkout_id, request_id, row["amount_pence"], stk.get("phone"), exc,
            )
            raise HTTPException(
                503,
                "M-PESA was initiated but the transaction could not be recorded. "
                f"Reference: {checkout_id}. Do not retry — contact support with this reference.",
            ) from exc

        # Non-critical second write. If it fails, the mpesa_transactions row
        # still exists in 'pending' state and the callback will still fire.
        try:
            await conn.execute(
                "UPDATE requests SET payment_status = 'pending_payment', updated_at = now() WHERE id = $1",
                row["id"],
            )
        except Exception as exc:
            logger.error(
                "Non-critical UPDATE failed for request %s (checkout_id=%s): %r",
                request_id, checkout_id, exc,
            )

        response = {
            "ok": True,
            "checkout_request_id": checkout_id,
            "message": stk.get("customer_message") or "STK push sent",
        }
        await idempotency.complete(conn, idempotency_key, "pool_pay", token, response)
        return response
    except HTTPException:
        await idempotency.release(conn, idempotency_key, "pool_pay", token)
        raise
    except Exception:
        logger.exception("Unexpected error in pay_route for request %s", request_id)
        await idempotency.release(conn, idempotency_key, "pool_pay", token)
        raise


@router.get("/mine")
async def list_mine(
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"requests": await list_requests(conn, token_hash=token)}


@router.post("/{request_id}/withdraw")
async def withdraw_route(
    request_id: str,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await withdraw_request(conn, request_id=request_id, token_hash=token)
    except LookupError:
        raise HTTPException(404, "Request not found")
    except PermissionError:
        raise HTTPException(403, "Token does not own this request")
    except WithdrawNotAllowed as e:
        raise HTTPException(409, f"Cannot withdraw from status '{e.current_status}'")

@router.get("/vouchers/mine", tags=["vouchers"])
async def list_my_vouchers(
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    from mtc.vouchers.issue import list_vouchers_for_token
    return {"vouchers": await list_vouchers_for_token(conn, token_hash=token)}

class MatchInterestBody(BaseModel):
    opportunity_id: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=200)


@router.post("/match/{request_id}/interest")
async def express_interest(
    request_id: str, body: MatchInterestBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Express interest in an opportunity (The Match). Requires opt-in disclosure."""
    row = await conn.fetchrow(
        """INSERT INTO match_interests (opportunity_id, title, token_hash, status)
           VALUES ($1, $2, $3, 'pending') RETURNING id, created_at""",
        body.opportunity_id, body.title, token,
    )
    return {
        "id": str(row["id"]),
        "opportunity_id": body.opportunity_id,
        "title": body.title,
        "status": "pending",
        "created_at": row["created_at"].isoformat(),
    }


class HouseholdBody(BaseModel):
    household_size: int = Field(..., ge=1, le=20)


@router.post("/household")
async def set_household(
    body: HouseholdBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        """INSERT INTO household_declarations (token_hash, household_size)
           VALUES ($1, $2)
           ON CONFLICT (token_hash) DO UPDATE
           SET household_size = EXCLUDED.household_size,
               updated_at = now()
           RETURNING household_size, declared_at, updated_at""",
        token, body.household_size,
    )
    return {
        "household_size": row["household_size"],
        "declared_at": row["declared_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


@router.get("/household")
async def get_household(
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        "SELECT household_size, declared_at FROM household_declarations WHERE token_hash = $1",
        token,
    )
    if row is None:
        return {"household_size": None, "declared": False}
    return {
        "household_size": row["household_size"],
        "declared": True,
        "declared_at": row["declared_at"].isoformat(),
    }

from pydantic import BaseModel as _BaseModel

class CollectBody(_BaseModel):
    pin: str

@router.post("/{request_id}/collect")
async def collect_route(
    request_id: str,
    body: CollectBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Verify ownership + PIN, mark collected, notify, return."""
    import json as _json
    from mtc.notifications.service import notify

    req = await conn.fetchrow("SELECT * FROM requests WHERE id = $1", request_id)
    if req is None:
        raise HTTPException(404, "Request not found")

    req_dict = dict(req)

    if req_dict["token_hash"] != token:
        raise HTTPException(403, "Not your request")

    if req_dict["type"] != "swap":
        raise HTTPException(400, "Only swap requests can be collected")

    status = req_dict["status"]
    if status == "collected":
        raise HTTPException(409, "Already collected")
    if status in ("withdrawn", "rejected"):
        raise HTTPException(409, f"Cannot collect in status {status!r}")

    import bcrypt
    metadata = req_dict["metadata"]
    if isinstance(metadata, str):
        try:
            metadata = _json.loads(metadata)
        except Exception:
            metadata = {}
    if not isinstance(metadata, dict):
        raise HTTPException(500, "Metadata corrupted")
    stored_hash = metadata.get("pin_hash")
    stored_plain = metadata.get("pin")
    if not stored_hash and not stored_plain:
        raise HTTPException(500, "No PIN recorded on this request")
    if stored_hash:
        try:
            ok = bcrypt.checkpw(body.pin.encode("utf-8"), stored_hash.encode("utf-8"))
        except Exception:
            raise HTTPException(500, "PIN hash corrupted")
        if not ok:
            raise HTTPException(403, "Invalid PIN")
    elif stored_plain != body.pin:
        raise HTTPException(403, "Invalid PIN")

    async with conn.transaction():
        await conn.execute(
            "UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1",
            request_id,
        )
        await _settle_pledge_for_request(conn, request_id)
    await notify(conn, token, request_id, "collected")

    return {"id": request_id, "status": "collected"}

class CollectByPinBody(_BaseModel):
    pin: str

@router.post("/collect")
async def collect_by_pin_route(
    body: CollectByPinBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Confirm collection using PIN only. Finds most recent matching swap."""
    import json as _json
    from mtc.notifications.service import notify

    rows = await conn.fetch(
        """SELECT id, metadata, status FROM requests
           WHERE token_hash = $1 AND type = 'swap'
           ORDER BY created_at DESC LIMIT 30""",
        token,
    )

    import bcrypt
    matching = None
    for r in rows:
        md = r["metadata"]
        if isinstance(md, str):
            try: md = _json.loads(md)
            except Exception: md = {}
        if not isinstance(md, dict):
            continue
        ph = md.get("pin_hash")
        pp = md.get("pin")
        matched = False
        if ph:
            try:
                matched = bcrypt.checkpw(body.pin.encode("utf-8"), ph.encode("utf-8"))
            except Exception:
                matched = False
        elif pp:
            matched = (pp == body.pin)
        if matched:
            matching = r
            break

    if matching is None:
        raise HTTPException(404, "No swap found with that PIN")

    status = matching["status"]
    if status == "collected":
        raise HTTPException(409, "Already collected")
    if status in ("withdrawn", "rejected"):
        raise HTTPException(409, f"Cannot collect in status '{status}'")

    async with conn.transaction():
        await conn.execute(
            "UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1",
            str(matching["id"]),
        )
        await _settle_pledge_for_request(conn, str(matching["id"]))
    await notify(conn, token, str(matching["id"]), "collected")

    return {"id": str(matching["id"]), "status": "collected"}


async def _settle_pledge_for_request(conn: asyncpg.Connection, request_id: str) -> None:
    """After a request is collected, mark its linked pledge as settled.

    Payments review #8 defence-in-depth: if a service_credit pledge was
    matched before payment confirmed, do NOT settle it — that would hide
    a silent money loss. Log CRITICAL and leave the pledge in 'matched'
    for manual reconciliation. The match_pledge route blocks this at the
    front door, so this should only fire on legacy data or a bug.
    """
    pledge_id = await conn.fetchval(
        "SELECT pledge_id FROM requests WHERE id = $1",
        request_id,
    )
    if not pledge_id:
        return
    pledge = await conn.fetchrow(
        "SELECT type, status, payment_status FROM pledges WHERE id = $1",
        str(pledge_id),
    )
    if pledge is None:
        return
    if pledge["type"] == "service_credit" and pledge["payment_status"] != "paid":
        logger.critical(
            "PLEDGE_SETTLE_UNPAID: request=%s pledge=%s payment_status=%s. "
            "Not settling — pledge must be paid first. Manual review required.",
            request_id, pledge_id, pledge["payment_status"],
        )
        return
    await conn.execute(
        "UPDATE pledges SET status = 'settled' WHERE id = $1 AND status = 'matched'",
        str(pledge_id),
    )

# ═══════════════════════════════════════════════════════════════════════════
# Tier 2 photo evidence (R.U.T.H §4.3 fallback path)
# ═══════════════════════════════════════════════════════════════════════════

_ALLOWED_EVIDENCE_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
}

# Storage root: backend/uploads/evidence
# Path math: this file → mtc/routes/requester.py → parent.parent.parent.parent → backend/
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_EVIDENCE_DIR = _BACKEND_ROOT / settings.evidence_storage_dir


@router.post("/pool/{request_id}/evidence")
async def upload_pool_evidence(
    request_id: str,
    file: UploadFile = File(...),
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Upload bill photo evidence for a Tier 2 pool request.

    R.U.T.H §4.3: external object lookup is unconfirmed (§8 item 2),
    so photo evidence is the current fallback for existence
    verification. Only Tier 2 requests in status='pending_evidence'
    accept a photo. On success, status moves to 'pending_check' for
    staff review in Console.
    """
    row = await conn.fetchrow(
        "SELECT id, token_hash, tier, status, type FROM requests WHERE id = $1",
        request_id,
    )
    if row is None:
        raise HTTPException(404, "Request not found")
    if row["token_hash"] != token:
        raise HTTPException(403, "Not your request")
    if row["type"] != "pool":
        raise HTTPException(400, "Only pool requests accept evidence")
    if row["tier"] != 2:
        raise HTTPException(400, "Only Tier 2 requests require photo evidence")
    if row["status"] != "pending_evidence":
        raise HTTPException(
            409,
            f"Request is in status '{row['status']}', not awaiting evidence",
        )

    mime = (file.content_type or "").lower()
    if mime not in _ALLOWED_EVIDENCE_MIME:
        raise HTTPException(
            415,
            f"Unsupported file type '{mime}'. Allowed: jpeg, png, pdf.",
        )
    ext = _ALLOWED_EVIDENCE_MIME[mime]

    contents = await file.read()
    max_bytes = settings.evidence_max_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            413,
            f"File too large ({len(contents)} bytes). Max {max_bytes} bytes "
            f"({settings.evidence_max_size_mb} MB).",
        )
    if len(contents) < 1024:
        raise HTTPException(400, "File too small — likely empty or corrupt")

    _EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{request_id}{ext}"
    full_path = _EVIDENCE_DIR / filename
    full_path.write_bytes(contents)

    await conn.execute(
        "UPDATE requests "
        "SET evidence_photo_path = $1, evidence_submitted_at = now(), "
        "    status = 'pending_check', updated_at = now() "
        "WHERE id = $2",
        filename, request_id,
    )

    logger.info(
        "Tier 2 evidence uploaded for request %s: %s (%d bytes, %s)",
        request_id, filename, len(contents), mime,
    )

    return {
        "ok": True,
        "request_id": request_id,
        "status": "pending_check",
        "filename": filename,
    }


@router.get("/pool/{request_id}/evidence")
async def get_pool_evidence(
    request_id: str,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Serve the evidence photo back to the requester who uploaded it."""
    row = await conn.fetchrow(
        "SELECT token_hash, evidence_photo_path FROM requests WHERE id = $1",
        request_id,
    )
    if row is None:
        raise HTTPException(404, "Request not found")
    if row["token_hash"] != token:
        raise HTTPException(403, "Not your request")
    if not row["evidence_photo_path"]:
        raise HTTPException(404, "No evidence uploaded for this request")

    full_path = _EVIDENCE_DIR / row["evidence_photo_path"]
    if not full_path.exists():
        raise HTTPException(404, "Evidence file missing on disk")

    return FileResponse(full_path)