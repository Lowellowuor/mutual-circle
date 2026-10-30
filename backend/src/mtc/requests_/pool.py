"""Pool request creation.

The Pool is object-level: the requester supplies a hashed object ID
(meter / admission / invoice) and an amount. Tier assignment depends on
the amount and category — see mtc.requests_.tiers.
"""
import asyncpg

from mtc.notifications.service import notify
from mtc.requests_.tiers import assign_tier, initial_status


async def create_pool(
    conn: asyncpg.Connection,
    *,
    token_hash: str,
    category: str,
    hashed_object_id: str,
    amount_pence: int,
) -> dict:
    tier = assign_tier(category, amount_pence)
    status = initial_status(tier)
    row = await conn.fetchrow(
        """
        INSERT INTO requests (token_hash, type, category, amount_pence, hashed_object_id, tier, status)
        VALUES ($1, 'pool', $2, $3, $4, $5, $6)
        RETURNING id, created_at, tier, status
        """,
        token_hash, category, amount_pence, hashed_object_id, tier, status,
    )
    pool_template = "pool_pending" if status == "pending_check" else "pool_submitted"
    await notify(
        conn, token_hash, str(row["id"]), pool_template,
        {"ref": hashed_object_id},
    )

    return {
        "id": str(row["id"]),
        "type": "pool",
        "category": category,
        "hashed_object_id": hashed_object_id,
        "amount_pence": amount_pence,
        "tier": row["tier"],
        "status": row["status"],
        "created_at": row["created_at"].isoformat(),
    }