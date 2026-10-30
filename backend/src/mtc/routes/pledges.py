"""Pledges — donor side of The Match."""
import asyncpg
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field

from mtc.db.main import get_conn

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
        "SELECT * FROM pledges WHERE donor_hash = $1 ORDER BY created_at DESC LIMIT 50",
        donor_hash,
    )
    return {"pledges": [_row_to_dict(r) for r in rows]}


def _row_to_dict(r):
    return {
        "id": str(r["id"]),
        "type": r["type"],
        "description": r["description"],
        "locality": r["locality"],
        "max_value_pence": r["max_value_pence"],
        "status": r["status"],
        "created_at": r["created_at"].isoformat(),
    }
