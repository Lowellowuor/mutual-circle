"""Verified helpline numbers — Section 4.9 requires programme-team verification."""
import asyncpg
from fastapi import APIRouter, Depends

from mtc.db.main import get_conn

router = APIRouter(prefix="/helplines", tags=["helplines"])


@router.get("")
async def list_helplines(conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch(
        "SELECT id, name, number, sub, category FROM helplines WHERE active = TRUE ORDER BY display_order ASC, name ASC"
    )
    return {
        "helplines": [
            {
                "id": str(r["id"]),
                "name": r["name"],
                "number": r["number"],
                "sub": r["sub"],
                "category": r["category"],
            }
            for r in rows
        ]
    }
