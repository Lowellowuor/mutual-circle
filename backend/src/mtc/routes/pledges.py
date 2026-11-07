"""Pledges — donor side of The Match."""
import asyncpg
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field

from mtc.db.main import get_conn
from mtc.mpesa.client import initiate_stk_push
from mtc.rate_limit.counter import check_ip_rate_limit, RateLimitExceeded
from fastapi import HTTPException, Request

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
        "created_at": r["created_at"].isoformat(),
    }
    if "linked_request_id" in r.keys():
        lid = r["linked_request_id"]
        d["linked_request_id"] = str(lid) if lid else None
    return d


from pydantic import BaseModel

class PledgePayBody(BaseModel):
    phone: str

@router.post("/{pledge_id}/pay")
async def pay_pledge(
    pledge_id: str,
    body: PledgePayBody,
    request: Request,
    donor_hash: str = Depends(_require_donor),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        await check_ip_rate_limit(conn, ip_address=request.client.host, endpoint="pay")
    except RateLimitExceeded as e:
        raise HTTPException(429, detail=e.reason)

    row = await conn.fetchrow(
        "SELECT id, max_value_pence, status FROM pledges WHERE id = $1 AND donor_hash = $2",
        pledge_id, donor_hash
    )
    if not row:
        raise HTTPException(404, "Pledge not found")
    if row["status"] == "paid":
        raise HTTPException(409, "Pledge already paid")
    if not row["max_value_pence"] or row["max_value_pence"] <= 0:
        raise HTTPException(400, "Pledge does not have a cash value to pay")

    account_ref = "PLG-" + str(row["id"])[:8].upper()
    try:
        stk = await initiate_stk_push(
            phone=body.phone,
            amount_pence=row["max_value_pence"],
            account_ref=account_ref,
            description="Mutual Circle Pledge",
        )
    except Exception as e:
        raise HTTPException(503, f"Payment initiation failed: {e}")

    checkout_id = stk["checkout_request_id"]

    await conn.execute(
        """INSERT INTO mpesa_transactions (checkout_request_id, amount_pence, target_table, target_id)
           VALUES ($1, $2, 'pledges', $3)""",
        checkout_id, row["max_value_pence"], row["id"]
    )
    await conn.execute("UPDATE pledges SET status = 'pending_payment' WHERE id = $1", row["id"])

    return {"ok": True, "checkout_request_id": checkout_id, "message": stk.get("customer_message")}
