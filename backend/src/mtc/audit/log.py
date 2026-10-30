"""Audit log — every privileged action appends here.

R.U.T.H Section 4.8: "every privileged action is logged."

The audit_log table is append-only by convention. The application never
issues UPDATE or DELETE against it. In production this would be enforced
by a separate role that has INSERT-only on this table.
"""
import json
import logging

import asyncpg

logger = logging.getLogger(__name__)


async def append_audit(
    conn: asyncpg.Connection,
    *,
    actor_role: str,
    actor_id: str | None,
    action: str,
    target_hash: str | None = None,
    metadata: dict | None = None,
) -> str:
    """Insert one audit row. Returns the new row id."""
    if actor_role not in ("enrolment", "fulfilment", "audit", "system"):
        raise ValueError(f"Invalid actor_role: {actor_role}")
    meta_json = json.dumps(metadata) if metadata is not None else None
    row = await conn.fetchrow(
        """INSERT INTO audit_log (actor_role, actor_id, action, target_hash, metadata)
           VALUES ($1, $2, $3, $4, $5::jsonb)
           RETURNING id""",
        actor_role, actor_id, action, target_hash, meta_json,
    )
    logger.info("audit: %s %s — %s", actor_role, actor_id, action)
    return str(row["id"])


async def list_audit(conn: asyncpg.Connection, *, limit: int = 100) -> list[dict]:
    rows = await conn.fetch(
        """SELECT id, actor_role, actor_id, action, target_hash, metadata, created_at
           FROM audit_log
           ORDER BY created_at DESC
           LIMIT $1""",
        limit,
    )
    return [
        {
            "id": str(r["id"]),
            "actor_role": r["actor_role"],
            "actor_id": r["actor_id"],
            "action": r["action"],
            "target_hash": r["target_hash"],
            "metadata": r["metadata"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]