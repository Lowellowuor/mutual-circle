"""The Match — opportunities surfaced to requester tokens."""
import asyncpg
from fastapi import APIRouter, Depends

from mtc.db.main import get_conn

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("")
async def list_opportunities(conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch(
        "SELECT id, type, title, description, locality, commit_text, posted_at FROM opportunities WHERE active = TRUE ORDER BY posted_at DESC"
    )
    return {
        "opportunities": [
            {
                "id": str(r["id"]),
                "type": r["type"],
                "title": r["title"],
                "description": r["description"],
                "locality": r["locality"],
                "commit": r["commit_text"],
                "posted_at": r["posted_at"].isoformat(),
            }
            for r in rows
        ]
    }
