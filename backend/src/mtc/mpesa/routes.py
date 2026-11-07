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
        # 409 = another callback is in flight for this ID, OR the key
        # exists with a different (scope, caller_id) — the latter is
        # impossible in practice because CheckoutRequestIDs are unique.
        # Either way: do not trigger Safaricom retry.
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
        row = await conn.fetchrow(
            "SELECT id, payment_status FROM requests WHERE mpesa_checkout_request_id = $1",
            checkout_id,
        )

        if row is None:
            logger.error(
                "M-PESA callback: unknown CheckoutRequestID=%s. "
                "result_code=%s receipt=%s",
                checkout_id, parsed["result_code"], parsed["receipt"],
            )
            response = {"status": "unknown_checkout_id"}
            await idempotency.complete(conn, checkout_id, _SCOPE, _CALLER, response)
            return _ack(response)

        if parsed["success"]:
            await conn.execute(
                """UPDATE requests
                   SET payment_status = 'paid',
                       mpesa_receipt = $1,
                       updated_at = now()
                   WHERE id = $2""",
                parsed["receipt"], row["id"],
            )
            response = {
                "status": "paid",
                "receipt": parsed["receipt"],
                "amount_pence": parsed["amount_pence"],
            }
            logger.info(
                "M-PESA callback: request %s paid, receipt=%s",
                row["id"], parsed["receipt"],
            )
        else:
            await conn.execute(
                """UPDATE requests
                   SET payment_status = 'payment_failed',
                       updated_at = now()
                   WHERE id = $1""",
                row["id"],
            )
            response = {
                "status": "payment_failed",
                "result_code": parsed["result_code"],
                "result_desc": parsed["result_desc"],
            }
            logger.warning(
                "M-PESA callback: request %s failed: %s — %s",
                row["id"], parsed["result_code"], parsed["result_desc"],
            )

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