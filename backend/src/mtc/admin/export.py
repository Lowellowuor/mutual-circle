"""CSV export for AML / POCAMLA compliance.

R.U.T.H Section 6: the shortcode holder is a reporting entity under POCAMLA.
The audit log is the raw material for that reporting. This endpoint turns it
into CSV.

The export is itself a privileged action and appends to the audit log before
returning the data.
"""
import csv
import io

import asyncpg

from mtc.audit.log import append_audit, list_audit


async def export_audit_csv(
    conn: asyncpg.Connection,
    *,
    staff_id: str,
    limit: int = 1000,
) -> str:
    rows = await list_audit(conn, limit=limit)
    await append_audit(
        conn, actor_role="audit", actor_id=staff_id,
        action=f"Exported compliance CSV ({len(rows)} rows)",
        target_hash="system",
        metadata={"exported_rows": len(rows)},
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["created_at", "actor_role", "actor_id", "action", "target_hash"])
    for r in rows:
        writer.writerow([
            r["created_at"],
            r["actor_role"],
            r["actor_id"] or "",
            r["action"],
            r["target_hash"] or "",
        ])
    return buf.getvalue()