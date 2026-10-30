"""Swap request creation — includes PIN, QR, and household-aware bundle sizing."""
import json
import secrets
from datetime import datetime, timezone

import asyncpg

from mtc.requests_.tiers import assign_tier, initial_status


def _bundle_size_for_household(size: int | None) -> str:
    """Map household size to bundle variant.

    Provisional thresholds — subject to sociologist review. Each bundle is
    designed as roughly one week of staples for that household size.
    """
    if size is None or size <= 1:
        return "small"
    if size <= 3:
        return "standard"
    if size <= 6:
        return "large"
    return "family"


async def create_swap(
    conn: asyncpg.Connection,
    *,
    token_hash: str,
    bundle_category: str,
    locker_location: str,
    household_size: int | None = None,
) -> dict:
    tier = assign_tier("swap_bundle", 0)
    status = initial_status(tier)

    pin = f"{secrets.randbelow(10000):04d}"
    qr_payload = f"MTC-LK-{locker_location[:3].upper()}-{int(datetime.now(timezone.utc).timestamp())}"
    bundle_variant = _bundle_size_for_household(household_size)

    metadata = {
        "bundle": bundle_category,
        "location": locker_location,
        "pin": pin,
        "qr": qr_payload,
        "household_size": household_size,
        "bundle_variant": bundle_variant,
    }

    row = await conn.fetchrow(
        """
        INSERT INTO requests (token_hash, type, category, metadata, tier, status)
        VALUES ($1, 'swap', 'swap_bundle', $2::jsonb, $3, $4)
        RETURNING id, created_at, tier, status
        """,
        token_hash, json.dumps(metadata), tier, status,
    )
    return {
        "id": str(row["id"]),
        "type": "swap",
        "bundle_category": bundle_category,
        "locker_location": locker_location,
        "bundle_variant": bundle_variant,
        "household_size": household_size,
        "pin": pin,
        "qr_payload": qr_payload,
        "tier": row["tier"],
        "status": row["status"],
        "created_at": row["created_at"].isoformat(),
    }