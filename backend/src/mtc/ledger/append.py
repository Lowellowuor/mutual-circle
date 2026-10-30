"""Ledger append — the core write path.

Enforces R.U.T.H Section 4.7:
  - Records: object_hash (keyed), category, amount, settled_by_hash, timestamps
  - Never records: name, address, phone, clinical data
  - Deduplicates on object_hash via UNIQUE constraint
  - Builds a hash chain so tampering is detectable
"""
import hashlib
import hmac
import logging

import asyncpg

from mtc.config import settings

logger = logging.getLogger(__name__)


class DuplicateObjectError(Exception):
    """Raised when the same object_hash is submitted twice."""

    def __init__(self, object_hash: str):
        super().__init__(f"Object already settled: {object_hash}")
        self.object_hash = object_hash


def compute_entry_hash(prev: str, obj: str, cat: str, amt: int, by: str) -> str:
    """HMAC-SHA256 of the entry's content + previous hash.

    Uses a keyed hash (not plain SHA-256) so that an attacker who can read
    the database still cannot forge a plausible chain — they'd need the key.
    See R.U.T.H Section 4.1 [Rec].
    """
    key = settings.ledger_hmac_key.encode()
    if not key:
        raise RuntimeError("LEDGER_HMAC_KEY is not configured")
    msg = f"{prev}|{obj}|{cat}|{amt}|{by}".encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


async def append_entry(
    conn: asyncpg.Connection,
    *,
    object_hash: str,
    category: str,
    amount_pence: int,
    settled_by_hash: str,
) -> dict:
    """Append one entry to the ledger, atomically.

    Returns: {"entry_id", "entry_hash", "previous_hash"}
    Raises: DuplicateObjectError if object_hash already exists.
    """
    async with conn.transaction():
        prev_row = await conn.fetchrow(
            "SELECT entry_hash FROM ledger_entries "
            "ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE"
        )
        prev = prev_row["entry_hash"] if prev_row else "GENESIS"
        entry_hash = compute_entry_hash(prev, object_hash, category, amount_pence, settled_by_hash)

        try:
            row = await conn.fetchrow(
                """INSERT INTO ledger_entries
                   (object_hash, category, amount_pence, settled_by_hash,
                    previous_entry_hash, entry_hash)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   RETURNING id""",
                object_hash, category, amount_pence, settled_by_hash, prev, entry_hash,
            )
        except asyncpg.UniqueViolationError as exc:
            raise DuplicateObjectError(object_hash) from exc

        return {"entry_id": str(row["id"]), "entry_hash": entry_hash, "previous_hash": prev}