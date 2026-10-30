"""Donor contributions — blind pooled giving, leaderboard, profile."""
import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from mtc.db.main import get_conn

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
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        """INSERT INTO donor_contributions (donor_hash, amount_pence, is_anonymous, opt_in_ledger)
           VALUES ($1, $2, $3, $4) RETURNING id, created_at""",
        donor_hash, body.amount_pence, body.is_anonymous, body.opt_in_ledger,
    )
    return {
        "id": str(row["id"]),
        "amount_pence": body.amount_pence,
        "is_anonymous": body.is_anonymous,
        "opt_in_ledger": body.opt_in_ledger,
        "created_at": row["created_at"].isoformat(),
    }


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