"""Requester routes Ã¢â‚¬â€ token-authenticated via X-Token header."""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field

import asyncpg

from mtc import idempotency
from mtc.db.main import get_conn
from mtc.rate_limit.counter import RateLimitExceeded, consume_quota
from mtc.requests_.lifecycle import WithdrawNotAllowed, list_requests, withdraw_request
from mtc.requests_.pool import create_pool
from mtc.requests_.swap import create_swap
from mtc.tokens.hmac import is_valid_token_format

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

# --- Household declaration (used to size bundles) ---

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

# ============================================================
# Collection confirmation (Phase 2a)
# Requester confirms physical collection of a swap request.
# ============================================================
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

    # Ownership — token_hash column confirmed via schema
    if req_dict["token_hash"] != token:
        raise HTTPException(403, "Not your request")

    # Only swap requests have PINs and physical collection
    if req_dict["type"] != "swap":
        raise HTTPException(400, "Only swap requests can be collected")

    # Status: reject only terminal states (permissive — swap can be
    # verified, pending_check, reserved, dispatched, etc.)
    status = req_dict["status"]
    if status == "collected":
        raise HTTPException(409, "Already collected")
    if status in ("withdrawn", "rejected"):
        raise HTTPException(409, f"Cannot collect in status {status!r}")

    # PIN verification — prefer pin_hash (bcrypt), fall back to pin
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

    # Update + notify
    await conn.execute(
        "UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1",
        request_id,
    )
    await notify(conn, token, request_id, "collected")

    return {"id": request_id, "status": "collected"}

# ============================================================
# PIN-only collection (for SMS/USSD/WhatsApp that don't persist
# the request_id across sessions)
# ============================================================
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

    await conn.execute(
        "UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1",
        str(matching["id"]),
    )
    await notify(conn, token, str(matching["id"]), "collected")

    return {"id": str(matching["id"]), "status": "collected"}