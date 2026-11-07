"""Donor contributions — blind pooled giving, leaderboard, profile."""
import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from mtc import idempotency
from mtc.db.main import get_conn
from mtc.mpesa.client import initiate_stk_push
from pydantic import BaseModel
from mtc.rate_limit.counter import check_ip_rate_limit, RateLimitExceeded
from fastapi import Request

router = APIRouter(prefix="/donations", tags=["donors"])


def _require_token(x_donor_hash: str = Header(..., alias="X-Donor-Hash")) -> str:
    if not x_donor_hash or len(x_donor_hash) < 4:
        raise HTTPException(401, "Invalid donor hash")
    return x_donor_hash


class DonateBody(BaseModel):
    amount_pence: int = Field(..., gt=0, le=100_000_000)
    is_anonymous: bool = True
    opt_in_ledger: bool = False


class ProfileBody(BaseModel):
    display_name: str = Field(default="", max_length=60)
    opt_in_ledger: bool = False


@router.post("")
async def create_donation(
    body: DonateBody,
    donor_hash: str = Depends(_require_token),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    cached = await idempotency.check_or_claim(conn, idempotency_key, "donation", donor_hash)
    if cached is not None:
        return cached

    try:
        row = await conn.fetchrow(
            """INSERT INTO donor_contributions (donor_hash, amount_pence, is_anonymous, opt_in_ledger)
               VALUES ($1, $2, $3, $4) RETURNING id, created_at""",
            donor_hash, body.amount_pence, body.is_anonymous, body.opt_in_ledger,
        )
        response = {
            "id": str(row["id"]),
            "amount_pence": body.amount_pence,
            "is_anonymous": body.is_anonymous,
            "opt_in_ledger": body.opt_in_ledger,
            "created_at": row["created_at"].isoformat(),
        }
        await idempotency.complete(conn, idempotency_key, "donation", donor_hash, response)
        return response
    except Exception:
        await idempotency.release(conn, idempotency_key, "donation", donor_hash)
        raise


@router.get("/mine")
async def my_donations(
    donor_hash: str = Depends(_require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    rows = await conn.fetch(
        "SELECT * FROM donor_contributions WHERE donor_hash = $1 ORDER BY created_at DESC LIMIT 50",
        donor_hash,
    )
    return {
        "donations": [
            {
                "id": str(r["id"]),
                "amount_pence": r["amount_pence"],
                "is_anonymous": r["is_anonymous"],
                "opt_in_ledger": r["opt_in_ledger"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in rows
        ]
    }


@router.get("/leaderboard")
async def leaderboard(
    limit: int = 20,
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Public leaderboard — opt-in donors only, aggregate totals only.

    Per R.U.T.H 4.6, the recognition ledger must be aggregate and non-
    identifying. We show display name (or 'Anonymous Contributor') plus
    total given and number of gifts. No category breakdown, no recipient
    linkage, no per-donation timestamps.
    """
    limit = max(1, min(limit, 100))
    rows = await conn.fetch(
        """
        SELECT
            CASE
                WHEN dp.display_name IS NULL OR dp.display_name = '' THEN 'Anonymous Contributor'
                ELSE dp.display_name
            END AS display_name,
            SUM(dc.amount_pence) AS total_pence,
            COUNT(dc.id) AS gift_count
        FROM donor_contributions dc
        JOIN donor_profiles dp ON dp.donor_hash = dc.donor_hash
        WHERE dp.opt_in_ledger = TRUE
        GROUP BY dc.donor_hash, dp.display_name
        ORDER BY total_pence DESC, display_name ASC
        LIMIT $1
        """,
        limit,
    )
    return {
        "leaderboard": [
            {
                "display_name": r["display_name"],
                "total_pence": r["total_pence"],
                "gift_count": r["gift_count"],
            }
            for r in rows
        ]
    }


@router.get("/profile")
async def get_profile(
    donor_hash: str = Depends(_require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        "SELECT display_name, opt_in_ledger FROM donor_profiles WHERE donor_hash = $1",
        donor_hash,
    )
    if row is None:
        return {"display_name": "", "opt_in_ledger": False, "has_profile": False}
    return {
        "display_name": row["display_name"] or "",
        "opt_in_ledger": row["opt_in_ledger"],
        "has_profile": True,
    }


@router.post("/profile")
async def update_profile(
    body: ProfileBody,
    donor_hash: str = Depends(_require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        """
        INSERT INTO donor_profiles (donor_hash, display_name, opt_in_ledger)
        VALUES ($1, $2, $3)
        ON CONFLICT (donor_hash) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            opt_in_ledger = EXCLUDED.opt_in_ledger,
            updated_at = now()
        RETURNING display_name, opt_in_ledger
        """,
        donor_hash, body.display_name.strip(), body.opt_in_ledger,
    )
    return {
        "display_name": row["display_name"] or "",
        "opt_in_ledger": row["opt_in_ledger"],
    }

class DonationPayBody(BaseModel):
    phone: str = Field(..., min_length=9, max_length=15)

@router.post("/{donation_id}/pay")
async def pay_donation(
    donation_id: str,
    body: DonationPayBody,
    request: Request,
    donor_hash: str = Depends(_require_token),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        await check_ip_rate_limit(conn, ip_address=request.client.host, endpoint="pay")
    except RateLimitExceeded as e:
        raise HTTPException(429, detail=e.reason)

    cached = await idempotency.check_or_claim(conn, idempotency_key, "donation_pay", donor_hash)
    if cached is not None:
        return cached

    try:
        row = await conn.fetchrow(
            "SELECT id, amount_pence, status FROM donor_contributions WHERE id = $1 AND donor_hash = $2",
            donation_id, donor_hash
        )
        if not row:
            raise HTTPException(404, "Donation not found")
        if row["status"] == "paid":
            raise HTTPException(409, "Donation already paid")
        if row["status"] == "pending_payment":
            raise HTTPException(409, "Payment is already in progress. Please check your phone.")

        account_ref = "DON-" + str(row["id"])[:8].upper()
        stk = await initiate_stk_push(
            phone=body.phone,
            amount_pence=row["amount_pence"],
            account_ref=account_ref,
            description="Mutual Circle Donation",
        )
        checkout_id = stk["checkout_request_id"]

        await conn.execute(
            """INSERT INTO mpesa_transactions (checkout_request_id, amount_pence, target_table, target_id)
               VALUES ($1, $2, 'donor_contributions', $3)""",
            checkout_id, row["amount_pence"], row["id"]
        )
        await conn.execute(
            "UPDATE donor_contributions SET status = 'pending_payment' WHERE id = $1",
            row["id"]
        )

        response = {"ok": True, "checkout_request_id": checkout_id, "message": stk.get("customer_message")}
        await idempotency.complete(conn, idempotency_key, "donation_pay", donor_hash, response)
        return response
    except HTTPException:
        await idempotency.release(conn, idempotency_key, "donation_pay", donor_hash)
        raise
    except Exception as e:
        logger.error(f"Donation pay failed: {e}")
        await idempotency.release(conn, idempotency_key, "donation_pay", donor_hash)
        raise HTTPException(500, "Payment initiation failed")
