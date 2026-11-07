"""Partner till — redemption endpoint.

Auth: X-Partner-Key header (signed: <key>.<hmac>). Signature verified
server-side; the partner identity used for voucher scoping comes from
the authenticated key, not the request body.

BEFORE this commit: no auth on any endpoint in this file. Anyone could
POST a redemption attempt or read the full cross-partner redemption
list. Audit item A3.

Console Till no longer uses this endpoint — staff redemptions go
through POST /fulfilment/redeem (Bearer JWT). This file is for actual
external partner POS terminals only.
"""
import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from mtc.auth.partner_signing import verify_partner_key
from mtc.rate_limit.counter import check_ip_rate_limit, RateLimitExceeded
from fastapi import Request
from mtc.db.main import get_conn
from mtc.vouchers.redeem import redeem_voucher

router = APIRouter(prefix="/partner", tags=["partner"])


async def require_partner_signed(
    x_partner_key: str = Header(..., alias="X-Partner-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    """Verify the signed X-Partner-Key and return the partner row.

    Signed format: <raw-key>.<hex-sig>. If the client sends an unsigned
    key in development (with no PARTNER_HMAC_KEY set), the raw key is
    accepted — matching the pre-A3 demo behavior. In production, signing
    is required (enforced here + at startup by _validate_secrets).
    """
    raw_key = verify_partner_key(x_partner_key)
    if raw_key is None:
        raise HTTPException(401, "Invalid partner key signature")
    row = await conn.fetchrow(
        "SELECT * FROM partners WHERE api_key = $1 AND active = TRUE",
        raw_key,
    )
    if row is None:
        raise HTTPException(401, "Unknown partner key")
    return {
        "id": row["id"],
        "name": row["name"],
        "type": row["type"],
        "contact_email": row["contact_email"],
    }


class RedeemBody(BaseModel):
    pin: str = Field(..., min_length=6, max_length=6)
    amount_pence: int = Field(..., gt=0, le=10_000_000)


@router.post("/redeem")
async def redeem(
    body: RedeemBody,
    request: Request,
    partner: dict = Depends(require_partner_signed),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Redeem a voucher PIN at this partner's till.

    Note: partner_name is taken from the authenticated key, NOT from
    the request body. A caller cannot claim to be a different partner
    by changing a JSON field.
    """
    try:
        await check_ip_rate_limit(conn, ip_address=request.client.host, endpoint="redeem")
    except RateLimitExceeded as e:
        raise HTTPException(429, detail=e.reason)

    return await redeem_voucher(
        conn,
        pin=body.pin,
        partner_name=partner["name"],
        amount_pence=body.amount_pence,
    )


@router.get("/redemptions")
async def list_redemptions(
    partner: dict = Depends(require_partner_signed),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """This partner's redemptions only.

    BEFORE: returned all redemptions across all partners. Now scoped to
    the authenticated partner_id.
    """
    rows = await conn.fetch(
        """SELECT id, voucher_id, partner_name, amount_pence, status, created_at
           FROM voucher_redemptions
           WHERE partner_name = $1
           ORDER BY created_at DESC LIMIT 100""",
        partner["name"],
    )
    return {"redemptions": [
        {"id": str(r["id"]), "voucherId": str(r["voucher_id"]),
         "partnerName": r["partner_name"], "amount_pence": r["amount_pence"],
         "status": r["status"], "timestamp": r["created_at"].isoformat()}
        for r in rows
    ]}
