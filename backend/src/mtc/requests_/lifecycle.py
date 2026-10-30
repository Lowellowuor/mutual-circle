"""Request lifecycle helpers — withdraw, list.

Enforces transitions:
  - withdraw: allowed only from 'verified' or 'pending_check'
  - dispatch: allowed only from 'verified' (implemented in Day 4)
  - everything else: read-only
"""
import asyncpg

from mtc.notifications.service import notify


class WithdrawNotAllowed(Exception):
    def __init__(self, current_status: str):
        super().__init__(f"Cannot withdraw from status '{current_status}'")
        self.current_status = current_status


async def withdraw_request(
    conn: asyncpg.Connection,
    *,
    request_id: str,
    token_hash: str,
) -> dict:
    row = await conn.fetchrow(
        "SELECT id, status, token_hash FROM requests WHERE id = $1",
        request_id,
    )
    if row is None:
        raise LookupError(f"Request not found: {request_id}")
    if row["token_hash"] != token_hash:
        raise PermissionError("Token does not own this request")
    if row["status"] not in ("verified", "pending_check"):
        raise WithdrawNotAllowed(row["status"])

    updated = await conn.fetchrow(
        """
        UPDATE requests
        SET status = 'withdrawn', updated_at = now()
        WHERE id = $1
        RETURNING id, status, updated_at
        """,
        request_id,
    )
    await notify(
        conn, token_hash, request_id, "withdrawn",
        {"ref": row["id"]},
    )

    return {
        "id": str(updated["id"]),
        "status": updated["status"],
        "updated_at": updated["updated_at"].isoformat(),
    }


async def list_requests(
    conn: asyncpg.Connection,
    *,
    token_hash: str,
    limit: int = 30,
) -> list[dict]:
    rows = await conn.fetch(
        """
        SELECT id, type, category, amount_pence, hashed_object_id, metadata,
               tier, status, created_at
        FROM requests
        WHERE token_hash = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        token_hash, limit,
    )
    return [
        {
            "id": str(r["id"]),
            "type": r["type"],
            "category": r["category"],
            "amount_pence": r["amount_pence"],
            "hashed_object_id": r["hashed_object_id"],
            "metadata": r["metadata"],
            "tier": r["tier"],
            "status": r["status"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]