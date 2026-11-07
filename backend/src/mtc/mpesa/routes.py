"""M-PESA Daraja STK callback handler.

Safaricom POSTs to POST /mpesa/stk/callback after STK Push resolves.
The callback has no authentication — Safaricom does not sign payloads,
and their egress IP ranges change. The only verification is that the
CheckoutRequestID matches a request we initiated (write-then-call
contract in /pool/{id}/pay).

Callback contract with Safaricom:
- HTTP 200 = received, do not retry
- Any other status = retry on Safaricom's schedule

We ALWAYS return 200. Rationale: every failure this handler can hit is
either permanent (unknown CheckoutRequestID, malformed body) or
already-handled-by-idempotency (duplicate, in-flight). Retries do not
make any of these succeed. Logs capture payloads for manual
reconciliation if a permanent failure indicates a real bug.

Unknown CheckoutRequestID policy (option A): log ERROR, complete
idempotency with {"status": "unknown_checkout_id"}, return 200.
Write-then-call means unknown IDs are permanent. If /pool/{id}/pay
ever changes to call-then-write, revisit this policy.
"""
import logging

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

from mtc import idempotency
from mtc.db.main import get_conn
from mtc.mpesa.client import parse_stk_callback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mpesa", tags=["mpesa"])

_SCOPE = "mpesa_callback"
_CALLER = "safaricom"


def _ack(detail: dict | None = None) -> dict:
    """Acknowledge to Safaricom. HTTP 200 is what matters; body is informational."""
    body = {"ResultCode": 0, "ResultDesc": "Accepted"}
    if detail:
        body["detail"] = detail
    return body


@router.post("/stk/callback")
async def stk_callback(
    request: Request,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        body = await request.json()
    except Exception:
        logger.error("M-PESA callback: body was not valid JSON")
        return _ack()

    parsed = parse_stk_callback(body)
    if parsed is None:
        logger.error("M-PESA callback: parse returned None. body=%r", body)
        return _ack()

    checkout_id = parsed["checkout_request_id"]

    try:
        cached = await idempotency.check_or_claim(conn, checkout_id, _SCOPE, _CALLER)
    except HTTPException as exc:
        logger.warning(
            "M-PESA callback: idempotency HTTP %s for checkout_id=%s: %s",
            exc.status_code, checkout_id, exc.detail,
        )
        return _ack()

    if cached is not None:
        logger.info(
            "M-PESA callback: duplicate checkout_id=%s, returning cached",
            checkout_id,
        )
        return _ack(cached)

    try:
        tx = await conn.fetchrow(
            "SELECT target_table, target_id FROM mpesa_transactions WHERE checkout_request_id = $1",
            checkout_id,
        )

        if tx is None:
            logger.error(
                "M-PESA callback: unknown CheckoutRequestID=%s. "
                "result_code=%s receipt=%s",
                checkout_id, parsed["result_code"], parsed["receipt"],
            )
            response = {"status": "unknown_checkout_id"}
            await idempotency.complete(conn, checkout_id, _SCOPE, _CALLER, response)
            return _ack(response)

        target_table = tx["target_table"]
        target_id = tx["target_id"]
        new_status = "paid" if parsed["success"] else "payment_failed"

        await conn.execute(
            """UPDATE mpesa_transactions
               SET status = $1, mpesa_receipt = $2, updated_at = now()
               WHERE checkout_request_id = $3""",
            new_status, parsed["receipt"], checkout_id,
        )

        if target_table == "requests":
            await conn.execute(
                "UPDATE requests SET payment_status = $1, mpesa_receipt = $2, updated_at = now() WHERE id = $3",
                new_status, parsed["receipt"], target_id,
            )
        elif target_table == "donor_contributions":
            await conn.execute(
                "UPDATE donor_contributions SET status = $1, mpesa_receipt = $2 WHERE id = $3",
                new_status, parsed["receipt"], target_id,
            )
        else:
            logger.error("Unknown target_table '%s' for checkout_id %s", target_table, checkout_id)

        response = {
            "status": new_status,
            "target_table": target_table,
            "target_id": str(target_id),
        }
        if parsed["success"]:
            response["receipt"] = parsed["receipt"]
            logger.info("M-PESA callback: %s %s paid, receipt=%s", target_table, target_id, parsed["receipt"])
        else:
            response["result_code"] = parsed["result_code"]
            response["result_desc"] = parsed["result_desc"]
            logger.warning("M-PESA callback: %s %s failed: %s", target_table, target_id, parsed["result_desc"])

        await idempotency.complete(conn, checkout_id, _SCOPE, _CALLER, response)
        return _ack(response)

    except Exception:
        logger.exception(
            "M-PESA callback: unhandled error for checkout_id=%s payload=%r",
            checkout_id, body,
        )
        try:
            await idempotency.release(conn, checkout_id, _SCOPE, _CALLER)
        except Exception:
            logger.exception("M-PESA callback: release also failed")
        return _ack()