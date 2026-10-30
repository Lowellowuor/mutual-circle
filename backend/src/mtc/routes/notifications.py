"""Requester notifications — the Messages feed."""
import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException

from mtc.db.main import get_conn
from mtc.tokens.hmac import is_valid_token_format

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _require_token(x_token: str = Header(..., alias="X-Token")) -> str:
    if not is_valid_token_format(x_token):
        raise HTTPException(401, "Invalid token format")
    return x_token


@router.get("/mine")
async def my_notifications(
    token: str = Depends(_require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    rows = await conn.fetch(
        """SELECT id, request_id, template, content, status, created_at, sent_at
           FROM notifications
           WHERE token_hash = $1
           ORDER BY created_at DESC
           LIMIT 50""",
        token,
    )
    return {
        "notifications": [
            {
                "id": str(r["id"]),
                "request_id": str(r["request_id"]) if r["request_id"] else None,
                "template": r["template"],
                "content": r["content"],
                "status": r["status"],
                "created_at": r["created_at"].isoformat(),
                "sent_at": r["sent_at"].isoformat() if r["sent_at"] else None,
            }
            for r in rows
        ]
    }


@router.get("/unread_count")
async def unread_count(
    token: str = Depends(_require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    count = await conn.fetchval(
        "SELECT COUNT(*) FROM notifications WHERE token_hash = $1 AND sent_at IS NULL",
        token,
    )
    return {"unread_count": int(count or 0)}