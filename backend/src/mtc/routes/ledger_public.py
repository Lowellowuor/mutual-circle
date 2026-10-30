"""Public ledger verification — no auth, proves the trust claim.

This is the entire differentiator: anyone can verify that the pooled amount
is real and the chain is unbroken. If we can't offer this, the tamper-evidence
claim is invisible.
"""
import csv
import io
from typing import Sequence

import asyncpg
from fastapi import APIRouter, Depends, Query, Response

from mtc.db.main import get_conn
from mtc.ledger.append import compute_entry_hash

router = APIRouter(prefix="/ledger", tags=["ledger-public"])


@router.get("/public")
async def public_ledger(
    limit: int = Query(20, ge=1, le=100),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Return aggregate stats + recent entries + live chain integrity check."""
    total_pence = await conn.fetchval(
        "SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries"
    ) or 0
    entry_count = await conn.fetchval("SELECT COUNT(*) FROM ledger_entries") or 0

    rows = await conn.fetch(
        """SELECT id, object_hash, category, amount_pence, settled_by_hash,
                  previous_entry_hash, entry_hash, created_at
           FROM ledger_entries
           ORDER BY created_at DESC, id DESC
           LIMIT $1""",
        limit,
    )

    # Full chain verification
    all_rows = await conn.fetch(
        "SELECT * FROM ledger_entries ORDER BY created_at ASC, id ASC"
    )
    chain_ok = True
    broken_at = None
    expected_prev = "GENESIS"
    for i, r in enumerate(all_rows):
        if r["previous_entry_hash"] != expected_prev:
            chain_ok = False
            broken_at = {"index": i, "reason": "chain break", "id": str(r["id"])}
            break
        try:
            recomputed = compute_entry_hash(
                r["previous_entry_hash"], r["object_hash"], r["category"],
                r["amount_pence"], r["settled_by_hash"],
            )
            if recomputed != r["entry_hash"]:
                chain_ok = False
                broken_at = {"index": i, "reason": "tamper detected", "id": str(r["id"])}
                break
        except Exception as exc:
            chain_ok = False
            broken_at = {"index": i, "reason": f"verify error: {exc}"}
            break
        expected_prev = r["entry_hash"]

    return {
        "total_pooled_pence": int(total_pence),
        "entry_count": int(entry_count),
        "chain_ok": chain_ok,
        "broken_at": broken_at,
        "last_entries": [
            {
                "id": str(r["id"]),
                "object_hash": r["object_hash"],
                "category": r["category"],
                "amount_pence": r["amount_pence"],
                "entry_hash_prefix": r["entry_hash"][:12] + "…",
                "previous_hash_prefix": r["previous_entry_hash"][:12] + "…"
                    if r["previous_entry_hash"] != "GENESIS" else "GENESIS",
                "created_at": r["created_at"].isoformat(),
            }
            for r in rows
        ],
    }


@router.get("/public.csv")
async def public_ledger_csv(conn: asyncpg.Connection = Depends(get_conn)):
    """Download the full ledger as CSV. No auth — it's public."""
    rows = await conn.fetch(
        "SELECT id, object_hash, category, amount_pence, settled_by_hash, "
        "previous_entry_hash, entry_hash, created_at "
        "FROM ledger_entries ORDER BY created_at ASC, id ASC"
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "object_hash", "category", "amount_pence",
        "settled_by_hash", "previous_entry_hash", "entry_hash", "created_at",
    ])
    for r in rows:
        writer.writerow([
            str(r["id"]),
            r["object_hash"],
            r["category"],
            r["amount_pence"],
            r["settled_by_hash"],
            r["previous_entry_hash"],
            r["entry_hash"],
            r["created_at"].isoformat(),
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="mutual-circle-ledger.csv"'},
    )