"""Ledger verification — the external audit path.

Walks the hash chain from oldest to newest. For each row:
  1. previous_entry_hash must equal the entry_hash of the row before it
  2. entry_hash must equal HMAC(key, previous | object | category | amount | settled_by)

Any mismatch means either tampering or a bug. Both must be treated as failures.
"""
import logging

import asyncpg

from mtc.ledger.append import compute_entry_hash

logger = logging.getLogger(__name__)


async def verify_chain(conn: asyncpg.Connection) -> dict:
    rows = await conn.fetch(
        "SELECT * FROM ledger_entries ORDER BY created_at ASC, id ASC"
    )
    expected_prev = "GENESIS"
    for i, r in enumerate(rows):
        if r["previous_entry_hash"] != expected_prev:
            return {
                "ok": False,
                "entries": len(rows),
                "index": i,
                "reason": "chain break",
                "brokenAt": str(r["id"]),
            }
        recomputed = compute_entry_hash(
            r["previous_entry_hash"], r["object_hash"], r["category"],
            r["amount_pence"], r["settled_by_hash"],
        )
        if recomputed != r["entry_hash"]:
            return {
                "ok": False,
                "entries": len(rows),
                "index": i,
                "reason": "tamper detected",
                "brokenAt": str(r["id"]),
            }
        expected_prev = r["entry_hash"]
    return {"ok": True, "entries": len(rows)}