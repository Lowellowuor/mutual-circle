"""Dispatch — the Fulfilment role's privileged action.

On dispatch of a pool request:
  1. Row locked with FOR UPDATE (prevents racing dispatches)
  2. Status must be 'verified' (not 'pending_check' — that's audit's job)
  3. Append to the ledger (UNIQUE constraint prevents double-payment)
  4. Update request status to 'submitted_to_partner' with M-Pesa receipt
  5. Audit log entry captures staff_id + role

All of this happens inside one transaction. If the ledger append fails
because the object is already settled, the whole dispatch rolls back.
"""
import json
import secrets

import asyncpg

from mtc.audit.log import append_audit
from mtc.ledger.append import DuplicateObjectError, append_entry
from mtc.notifications.service import notify


class DispatchConflict(Exception):
    """Raised when the request is not dispatchable (wrong status, wrong type)."""
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


async def dispatch_pool_request(
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
            raise DispatchConflict("Only pool requests can be dispatched to a payment partner")
        if req["status"] != "verified":
            raise DispatchConflict(f"Cannot dispatch a request in status '{req['status']}'")

        receipt = "MPESA-" + secrets.token_hex(4).upper()

        try:
            await append_entry(
                conn,
                object_hash=req["hashed_object_id"],
                category=req["category"],
                amount_pence=req["amount_pence"],
                settled_by_hash=staff_id,
            )
        except DuplicateObjectError:
            raise DispatchConflict(
                f"Object '{req['hashed_object_id']}' is already settled in the ledger"
            )

        await conn.execute(
            """UPDATE requests
               SET status = 'submitted_to_partner',
                   metadata = metadata || $2::jsonb,
                   updated_at = now()
               WHERE id = $1""",
            request_id,
            json.dumps({"receipt": receipt}),
        )

        await append_audit(
            conn, actor_role="fulfilment", actor_id=staff_id,
            action=f"Dispatched {request_id} (receipt {receipt})",
            target_hash=req["hashed_object_id"],
            metadata={"receipt": receipt, "amount_pence": req["amount_pence"]},
        )

    await notify(
        conn, req["token_hash"], request_id, "dispatched",
        {"ref": req["hashed_object_id"]},
    )

    return {
        "request_id": request_id,
        "receipt": receipt,
        "status": "submitted_to_partner",
    }


async def list_fulfilment_queue(conn: asyncpg.Connection) -> dict:
    """Pending pool requests plus swap requests that are reserved (not yet collected)."""
    pool = await conn.fetch(
        """SELECT id, category, hashed_object_id, amount_pence, tier, status, created_at
           FROM requests
           WHERE type = 'pool' AND status IN ('verified', 'pending_check')
           ORDER BY created_at ASC"""
    )
    swap = await conn.fetch(
        """SELECT id, category, metadata, tier, status, created_at
           FROM requests
           WHERE type = 'swap' AND status IN ('verified')
           ORDER BY created_at ASC"""
    )
    return {
        "pool": [
            {
                "id": str(r["id"]),
                "category": r["category"],
                "hashed_object_id": r["hashed_object_id"],
                "amount_pence": r["amount_pence"],
                "tier": r["tier"],
                "status": r["status"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in pool
        ],
        "swap": [
            {
                "id": str(r["id"]),
                "category": r["category"],
                "metadata": r["metadata"],
                "tier": r["tier"],
                "status": r["status"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in swap
        ],
    }