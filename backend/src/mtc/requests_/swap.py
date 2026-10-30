"""Swap request creation.

The Swap is Tier 1 by design — self-declared bundle, protected by rate limits
and periodic audit, not by object-level verification (there's no object to
verify for a food parcel).
"""
import asyncpg

from mtc.requests_.tiers import assign_tier, initial_status


async def create_swap(
    conn: asyncpg.Connection,
    *,
    token_hash: str,
    bundle_category: str,
    locker_location: str,
) -> dict:
    tier = assign_tier("swap_bundle", 0)
    status = initial_status(tier)
    row = await conn.fetchrow(
        """
        INSERT INTO requests (token_hash, type, category, metadata, tier, status)
        VALUES ($1, 'swap', 'swap_bundle', $2::jsonb, $3, $4)
        RETURNING id, created_at, tier, status
        """,
        token_hash,
        f'{{"bundle": "{bundle_category}", "location": "{locker_location}"}}',
        tier,
        status,
    )
    return {
        "id": str(row["id"]),
        "type": "swap",
        "bundle_category": bundle_category,
        "locker_location": locker_location,
        "tier": row["tier"],
        "status": row["status"],
        "created_at": row["created_at"].isoformat(),
    }