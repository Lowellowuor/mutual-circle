"""M-PESA Daraja STK callback handler with 4-layer verification.

Safaricom POSTs to POST /mpesa/stk/callback after STK Push resolves.
The callback has no authentication — Safaricom does not sign payloads,
and their egress IP ranges change. The only verification is:

  1. The CheckoutRequestID must match a transaction we initiated
  2. The amount in the callback must equal what we requested
  3. The phone in the callback must equal the one we sent STK to
  4. The M-PESA receipt must be a plausible format (10 alnum uppercase)

Any of these failing marks the transaction as `callback_rejected`
in `mpesa_transactions`, does NOT mark the target row as paid, logs
at ERROR level, and returns HTTP 200 with a rejection body. Safaricom
is satisfied (no retry); the payment is not settled; the audit trail
has the anomaly.

Layers 2-4 were added after the initial implementation (R.U.T.H §4.8
audit). Without them, an attacker with a leaked CheckoutRequestID
could POST a fake success callback and mark a request as paid with
no money moving.

Callback contract with Safaricom:
- HTTP 200 = received, do not retry
- Any other status = retry on Safaricom's schedule

We ALWAYS return 200. Rationale: every failure this handler can hit
is either permanent (unknown CheckoutRequestID, malformed body,
verification failure) or already-handled-by-idempotency (duplicate,
in-flight). Retries do not make any of these succeed.

Unknown CheckoutRequestID policy (option A): log ERROR, complete
idempotency with {"status": "unknown_checkout_id"}, return 200.
Write-then-call means unknown IDs are permanent.
"""
import logging
import re

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

from mtc import idempotency
from mtc.db.main import get_conn
from mtc.mpesa.client import parse_stk_callback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mpesa", tags=["mpesa"])

_SCOPE = "mpesa_callback"
_CALLER = "safaricom"

# M-PESA receipts are 10 alphanumeric uppercase characters, e.g. "SGR7XN2K9P"
_RECEIPT_RE = re.compile(r"^[A-Z0-9]{10}$")


def _norm_phone(p) -> str | None:
    """Normalize to 2547XXXXXXXX (no + prefix) for comparison.

    Tolerant of +254..., 07..., 7..., and spaces/dashes.
    """
    if p is None:
        return None
    s = str(p).strip().replace(" ", "").replace("-", "")
    if s.startswith("+"):
        s = s[1:]
    if s.startswith("0"):
        s = "254" + s[1:]
    elif s.startswith("7") or s.startswith("1"):
        s = "254" + s
    return s


def _ack(detail: dict | None = None) -> dict:
    """Acknowledge to Safaricom. HTTP 200 is what matters; body is informational."""
    body = {"ResultCode": 0, "ResultDesc": "Accepted"}
    if detail:
        body["detail"] = detail
    return body


def _verify_callback(parsed: dict, tx: asyncpg.Record) -> str | None:
    """Return None if callback is verified. Return a reason string on failure.

    Only runs verification on successful callbacks — failed callbacks
    (ResultCode != 0) don't need amount/phone/receipt checks because we
    can't pay out on them anyway.
    """
    if not parsed["success"]:
        return None  # Failed payment — nothing to verify, no payout risk

    # Layer 1: amount must match exactly what we requested
    if parsed.get("amount_pence") is None:
        return "callback_missing_amount"
    if parsed["amount_pence"] != tx["amount_pence"]:
        return f"amount_mismatch (expected={tx['amount_pence']}p, got={parsed['amount_pence']}p)"

    # Layer 2: phone must match the one we sent STK to.
    # Fail-closed if expected_phone is NULL (old rows before this check)
    expected_phone = tx["expected_phone"]
    if not expected_phone:
        return "expected_phone_missing (transaction predates callback verification; re-initiate payment)"
    if _norm_phone(parsed.get("phone")) != _norm_phone(expected_phone):
        return f"phone_mismatch (expected={expected_phone}, got={parsed.get('phone')})"

    # Layer 3: receipt format
    receipt = parsed.get("receipt") or ""
    if not _RECEIPT_RE.match(receipt):
        return f"invalid_receipt_format (got={receipt!r})"

    return None  # All checks passed


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
            "SELECT target_table, target_id, amount_pence, expected_phone "
            "FROM mpesa_transactions WHERE checkout_request_id = $1",
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

        # ─── R.U.T.H §4.8: verify callback before any state mutation ───
        rejection = _verify_callback(parsed, tx)
        if rejection is not None:
            logger.error(
                "M-PESA callback REJECTED: %s for checkout_id=%s payload=%r",
                rejection, checkout_id, body,
            )
            await conn.execute(
                "UPDATE mpesa_transactions SET status = 'callback_rejected', updated_at = now() "
                "WHERE checkout_request_id = $1",
                checkout_id,
            )
            response = {"status": "rejected", "reason": rejection}
            await idempotency.complete(conn, checkout_id, _SCOPE, _CALLER, response)
            return _ack(response)

        # ─── Verification passed — proceed with normal flow ───
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
        elif target_table == "pledges":
            # Payments review #8: write payment_status, NOT status.
            # The match state machine (awaiting_match -> matched -> settled)
            # is independent of payment state. Overwriting status here was
            # destroying the match state on every payment callback.
            await conn.execute(
                "UPDATE pledges SET payment_status = $1 WHERE id = $2",
                new_status, target_id,
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