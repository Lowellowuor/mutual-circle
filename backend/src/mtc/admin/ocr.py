"""OCR completion — the Audit role's privileged action for Tier 3.

A Tier 3 request arrives as 'pending_check' because the amount crossed the
threshold or the token has a repeat history. The audit role manually
confirms the bill photo via OCR — which in production is an automated
pipeline, but for the pilot is a human-in-the-loop check.

On completion: status → 'verified'. From there, Fulfilment can dispatch.
"""
import asyncpg

from mtc.audit.log import append_audit


class OcrConflict(Exception):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


async def complete_ocr(
    conn: asyncpg.Connection,
    *,
    request_id: str,
    staff_id: str,
) -> dict:
    async with conn.transaction():
        req = await conn.fetchrow(
            "SELECT * FROM requests WHERE id = $1 FOR UPDATE",
            request_id,
        )
        if req is None:
            raise LookupError(f"Request not found: {request_id}")
        if req["type"] != "pool":
            raise OcrConflict("OCR only applies to pool requests")
        if req["status"] != "pending_check":
            raise OcrConflict(f"Cannot complete OCR on request in status '{req['status']}'")

        await conn.execute(
            "UPDATE requests SET status = 'verified', updated_at = now() WHERE id = $1",
            request_id,
        )
        await append_audit(
            conn, actor_role="audit", actor_id=staff_id,
            action=f"Completed OCR for {request_id}",
            target_hash=req["hashed_object_id"],
            metadata={"amount_pence": req["amount_pence"], "tier": req["tier"]},
        )

    return {"request_id": request_id, "status": "verified"}


async def list_ocr_queue(conn: asyncpg.Connection) -> list[dict]:
    rows = await conn.fetch(
        """SELECT id, category, hashed_object_id, amount_pence, tier, created_at
           FROM requests
           WHERE status = 'pending_check' AND type = 'pool'
           ORDER BY created_at ASC"""
    )
    return [
        {
            "id": str(r["id"]),
            "category": r["category"],
            "hashed_object_id": r["hashed_object_id"],
            "amount_pence": r["amount_pence"],
            "tier": r["tier"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]