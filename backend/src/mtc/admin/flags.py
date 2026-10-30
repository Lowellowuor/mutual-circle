"""Flag routing — the Audit role's review action.

Section 4.8: flags route to Tier 4 (independent panel) or clear as false
positive. The audit staff_id is recorded on the row and in the audit log.
"""
import asyncpg

from mtc.audit.log import append_audit


class FlagConflict(Exception):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


async def list_flags(conn: asyncpg.Connection, *, status: str | None = None) -> list[dict]:
    if status:
        rows = await conn.fetch(
            "SELECT * FROM risk_flags WHERE status = $1 ORDER BY created_at DESC",
            status,
        )
    else:
        rows = await conn.fetch("SELECT * FROM risk_flags ORDER BY created_at DESC")
    return [
        {
            "id": str(r["id"]),
            "target_hash": r["target_hash"],
            "severity": r["severity"],
            "title": r["title"],
            "description": r["description"],
            "status": r["status"],
            "investigation_notes": r["investigation_notes"],
            "routed_by": r["routed_by"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


async def route_to_tier4(conn: asyncpg.Connection, *, flag_id: str, staff_id: str) -> dict:
    async with conn.transaction():
        flag = await conn.fetchrow("SELECT * FROM risk_flags WHERE id = $1 FOR UPDATE", flag_id)
        if flag is None:
            raise LookupError(f"Flag not found: {flag_id}")
        if flag["status"] != "pending":
            raise FlagConflict(f"Flag is already in status '{flag['status']}'")
        await conn.execute(
            "UPDATE risk_flags SET status = 'routed_tier4', routed_by = $1, updated_at = now() WHERE id = $2",
            staff_id, flag_id,
        )
        await append_audit(
            conn, actor_role="audit", actor_id=staff_id,
            action=f"Routed flag {flag_id} to Tier 4",
            target_hash=flag["target_hash"],
            metadata={"severity": flag["severity"]},
        )
    return {"id": flag_id, "status": "routed_tier4"}


async def clear_false_positive(
    conn: asyncpg.Connection, *, flag_id: str, staff_id: str, note: str,
) -> dict:
    async with conn.transaction():
        flag = await conn.fetchrow("SELECT * FROM risk_flags WHERE id = $1 FOR UPDATE", flag_id)
        if flag is None:
            raise LookupError(f"Flag not found: {flag_id}")
        if flag["status"] != "pending":
            raise FlagConflict(f"Flag is already in status '{flag['status']}'")
        await conn.execute(
            """UPDATE risk_flags
               SET status = 'cleared_false_positive',
                   investigation_notes = $1,
                   routed_by = $2,
                   updated_at = now()
               WHERE id = $3""",
            note, staff_id, flag_id,
        )
        await append_audit(
            conn, actor_role="audit", actor_id=staff_id,
            action=f"Cleared flag {flag_id} as false positive",
            target_hash=flag["target_hash"],
            metadata={"note": note},
        )
    return {"id": flag_id, "status": "cleared_false_positive"}