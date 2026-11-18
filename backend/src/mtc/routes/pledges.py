"""Pledges — donor side of The Match."""
import logging
import uuid

import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field

from mtc import idempotency
from mtc.db.main import get_conn
from mtc.paystack.client import PaystackError
from mtc.paystack.payments import PaymentConflict, start_payment
from mtc.rate_limit.counter import check_ip_rate_limit, RateLimitExceeded
from mtc.routes.payments import PaystackPayBody

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pledges", tags=["pledges"])


def _require_donor(x_donor_hash: str = Header(..., alias="X-Donor-Hash")) -> str:
    return x_donor_hash


class PledgeBody(BaseModel):
    type: str = Field(..., pattern="^(goods|service_credit)$")
    description: str = Field(..., min_length=1, max_length=200)
    locality: str = Field(..., min_length=1, max_length=100)
    max_value_pence: int | None = Field(None, gt=0)


@router.post("")
async def create_pledge(
    body: PledgeBody,
    donor_hash: str = Depends(_require_donor),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        """INSERT INTO pledges (donor_hash, type, description, max_value_pence, locality)
           VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at""",
        donor_hash, body.type, body.description, body.max_value_pence, body.locality,
    )
    return {
        "id": str(row["id"]),
        "type": body.type,
        "description": body.description,
        "locality": body.locality,
        "max_value_pence": body.max_value_pence,
        "status": "awaiting_match",
        "payment_status": "unpaid",
        "created_at": row["created_at"].isoformat(),
    }


@router.get("/mine")
async def my_pledges(
    donor_hash: str = Depends(_require_donor),
    conn: asyncpg.Connection = Depends(get_conn),
):
    rows = await conn.fetch(
        """SELECT p.*, r.id AS linked_request_id
           FROM pledges p
           LEFT JOIN requests r ON r.pledge_id = p.id
           WHERE p.donor_hash = $1
           ORDER BY p.created_at DESC LIMIT 50""",
        donor_hash,
    )
    return {"pledges": [_row_to_dict(r) for r in rows]}


def _row_to_dict(r):
    d = {
        "id": str(r["id"]),
        "type": r["type"],
        "description": r["description"],
        "locality": r["locality"],
        "max_value_pence": r["max_value_pence"],
        "status": r["status"],
        "payment_status": r.get("payment_status", "unpaid") if hasattr(r, "get") else (r["payment_status"] if "payment_status" in r.keys() else "unpaid"),
        "created_at": r["created_at"].isoformat(),
    }
    if "linked_request_id" in r.keys():
        lid = r["linked_request_id"]
        d["linked_request_id"] = str(lid) if lid else None
    return d


@router.post("/{pledge_id}/pay")
async def pay_pledge(
    pledge_id: str,
    request: Request,
    body: PaystackPayBody | None = None,
    donor_hash: str = Depends(_require_donor),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Open a Paystack checkout for a pledge's cash value (max_value_pence).

    Payment only touches ``payment_status``; the match ``status``
    (awaiting_match -> matched -> settled) is never written here.
    """
    try:
        pledge_uuid = uuid.UUID(pledge_id)
    except ValueError:
        raise HTTPException(404, "Pledge not found")

    try:
        await check_ip_rate_limit(conn, ip_address=request.client.host, endpoint="pay")
    except RateLimitExceeded as e:
        raise HTTPException(429, detail=e.reason)

    cached = await idempotency.check_or_claim(conn, idempotency_key, "pledge_pay", donor_hash)
    if cached is not None:
        return cached

    try:
        row = await conn.fetchrow(
            "SELECT id, max_value_pence, status, payment_status FROM pledges WHERE id = $1 AND donor_hash = $2",
            pledge_uuid, donor_hash,
        )
        if not row:
            raise HTTPException(404, "Pledge not found")
        if row["payment_status"] == "paid":
            raise HTTPException(409, "Pledge already paid")
        if not row["max_value_pence"] or row["max_value_pence"] <= 0:
            raise HTTPException(400, "Pledge does not have a cash value to pay")

        checkout = await start_payment(
            conn,
            target_table="pledges",
            target_id=row["id"],
            donor_hash=donor_hash,
            amount_pence=row["max_value_pence"],
            email=body.email if body else None,
        )
        response = {"ok": True, **checkout}
        await idempotency.complete(conn, idempotency_key, "pledge_pay", donor_hash, response)
        return response
    except PaymentConflict as e:
        await idempotency.release(conn, idempotency_key, "pledge_pay", donor_hash)
        raise HTTPException(409, str(e))
    except PaystackError as e:
        logger.warning("Pledge %s: Paystack initialize failed: %s", pledge_id, e)
        await idempotency.release(conn, idempotency_key, "pledge_pay", donor_hash)
        raise HTTPException(503, "Payment provider unavailable. Please try again.")
    except HTTPException:
        await idempotency.release(conn, idempotency_key, "pledge_pay", donor_hash)
        raise
    except Exception:
        logger.exception("Pledge %s: payment initiation failed", pledge_id)
        await idempotency.release(conn, idempotency_key, "pledge_pay", donor_hash)
        raise HTTPException(500, "Payment initiation failed")
