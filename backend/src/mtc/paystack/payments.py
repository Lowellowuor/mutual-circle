"""Paystack payment lifecycle for donations and pledges.

State lives in ``paystack_payments`` (migration 023), one row per
checkout attempt, keyed by our own unique ``reference``:

    pending -> paid                 (Paystack verify says success, and
                                     reference, amount, currency match)
    pending -> failed | abandoned   (Paystack says it did not complete,
                                     or initialize itself failed)
    failed | abandoned -> paid      (a late success always wins)

Rules this module enforces:

* Write-then-call: the pending row is committed BEFORE Paystack is
  called, so every reference Paystack knows about is in our table.
* One live checkout per target: a partial unique index allows only one
  ``pending`` row per (target_table, target_id). Stale pending rows
  (older than ``STALE_AFTER_MINUTES``) are re-checked with Paystack
  before a new attempt is allowed.
* Only ``verify_transaction`` is trusted. Webhook bodies are used only
  to learn which reference to verify.
* Idempotent: ``paid`` is reached through ``UPDATE ... WHERE status <>
  'paid'``, so duplicates are no-ops. Nothing a failed or forged event
  does can stop a later genuine success from marking the row paid.

Target status columns (unchanged state machines):
    donor_contributions.status  unpaid -> pending_payment -> paid | payment_failed
    pledges.payment_status      unpaid -> pending_payment -> paid | payment_failed
"""
import hashlib
import logging
import secrets
from typing import Any
from urllib.parse import urlencode

import asyncpg

from mtc.config import settings
from mtc.paystack.client import (
    PaystackError,
    initialize_transaction,
    is_plausible_email,
    placeholder_email,
    verify_transaction,
)

logger = logging.getLogger(__name__)

STALE_AFTER_MINUTES = 30

# target_table -> (status column, reference prefix, public kind)
TARGETS: dict[str, tuple[str, str, str]] = {
    "donor_contributions": ("status", "don", "donation"),
    "pledges": ("payment_status", "plg", "pledge"),
}

_PAYMENT_COLUMNS = (
    "reference, target_table, target_id, donor_hash, amount_pence, currency, status"
)


class PaymentConflict(Exception):
    """The target cannot start a new payment right now (paid or in progress)."""


def new_reference(target_table: str) -> str:
    """Unique, unguessable. Paystack allows only alphanumerics, '-', '.', '='."""
    prefix = TARGETS[target_table][1]
    return f"mc-{prefix}-{secrets.token_hex(12)}"


def checkout_email(donor_hash: str, email: str | None) -> str:
    """The donor's email if they gave one, else a placeholder.

    The placeholder id is a one-way hash of the donor hash, so the
    X-Donor-Hash credential itself is never sent to Paystack.
    """
    if email and is_plausible_email(email):
        return email
    donor_id = hashlib.sha256(donor_hash.encode("utf-8")).hexdigest()[:16]
    return placeholder_email(donor_id)


async def get_payment(conn: asyncpg.Connection, reference: str) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"SELECT {_PAYMENT_COLUMNS} FROM paystack_payments WHERE reference = $1",
        reference,
    )


def mismatch_reason(payment: Any, tx: dict[str, Any]) -> str | None:
    """None if Paystack's record matches what we asked for, else why not."""
    if tx.get("reference") != payment["reference"]:
        return "reference_mismatch"
    amount = tx.get("amount")
    if isinstance(amount, bool) or not isinstance(amount, int):
        return "amount_invalid"
    if amount != payment["amount_pence"]:
        return "amount_mismatch"
    if str(tx.get("currency") or "").upper() != str(payment["currency"]).upper():
        return "currency_mismatch"
    return None


async def mark_paid(conn: asyncpg.Connection, payment: Any, tx: dict[str, Any]) -> bool:
    """Mark the payment and its target paid. False if it was already paid."""
    tx_id = tx.get("id") if isinstance(tx.get("id"), int) else None
    channel = tx.get("channel") if isinstance(tx.get("channel"), str) else None

    async with conn.transaction():
        row = await conn.fetchrow(
            """UPDATE paystack_payments
               SET status = 'paid', paystack_transaction_id = $2, channel = $3,
                   paid_at = now(), updated_at = now()
               WHERE reference = $1 AND status <> 'paid'
               RETURNING target_table, target_id""",
            payment["reference"], tx_id, channel,
        )
        if row is None:
            return False

        table = row["target_table"]
        if table not in TARGETS:
            raise RuntimeError(f"Unknown target_table {table!r} on {payment['reference']}")
        col = TARGETS[table][0]
        result = await conn.execute(
            f"UPDATE {table} SET {col} = 'paid' WHERE id = $1 AND {col} <> 'paid'",
            row["target_id"],
        )

    if result == "UPDATE 0":
        # Money moved twice for one target (e.g. a stale checkout was
        # completed after a newer one). Needs a manual refund.
        logger.critical(
            "PAYSTACK_DOUBLE_PAYMENT: reference=%s paid but %s %s was already paid. "
            "Refund required.",
            payment["reference"], table, row["target_id"],
        )
    else:
        logger.info("Paystack: %s %s paid (reference=%s)", table, row["target_id"], payment["reference"])
    return True


async def mark_unsuccessful(conn: asyncpg.Connection, reference: str, new_status: str) -> None:
    """Close a pending payment as failed/abandoned. Never touches a paid row."""
    if new_status not in ("failed", "abandoned"):
        raise ValueError(new_status)
    async with conn.transaction():
        row = await conn.fetchrow(
            """UPDATE paystack_payments SET status = $2, updated_at = now()
               WHERE reference = $1 AND status = 'pending'
               RETURNING target_table, target_id""",
            reference, new_status,
        )
        if row is None:
            return
        table = row["target_table"]
        col = TARGETS[table][0]
        # Only flip the target back if no other checkout is still live for it.
        await conn.execute(
            f"""UPDATE {table} SET {col} = 'payment_failed'
                WHERE id = $1 AND {col} = 'pending_payment'
                  AND NOT EXISTS (
                      SELECT 1 FROM paystack_payments
                      WHERE target_table = $2 AND target_id = $1 AND status = 'pending'
                  )""",
            row["target_id"], table,
        )


async def apply_transaction(
    conn: asyncpg.Connection,
    payment: Any,
    tx: dict[str, Any],
    *,
    record_failure: bool,
) -> str:
    """Record a ``verify_transaction`` result against our payment row.

    Returns one of: paid, duplicate, rejected, failed, abandoned, pending.

    ``record_failure`` is False for the webhook, which only acts on
    success. The verify endpoint passes True so a donor who failed or
    cancelled can retry straight away.
    """
    status = str(tx.get("status") or "").lower()
    reference = payment["reference"]

    if status == "success":
        reason = mismatch_reason(payment, tx)
        if reason is not None:
            logger.error("Paystack: NOT marking paid, %s (reference=%s)", reason, reference)
            return "rejected"
        return "paid" if await mark_paid(conn, payment, tx) else "duplicate"

    if record_failure and status in ("failed", "reversed", "abandoned"):
        new_status = "abandoned" if status == "abandoned" else "failed"
        await mark_unsuccessful(conn, reference, new_status)
        return new_status

    return "pending"


async def start_payment(
    conn: asyncpg.Connection,
    *,
    target_table: str,
    target_id: Any,
    donor_hash: str,
    amount_pence: int,
    email: str | None = None,
) -> dict[str, str]:
    """Save a pending payment, then open a Paystack checkout for it.

    Raises PaymentConflict (-> 409) or PaystackError (-> 503).
    """
    if target_table not in TARGETS:
        raise ValueError(target_table)
    col = TARGETS[target_table][0]

    existing = await conn.fetchrow(
        f"""SELECT {_PAYMENT_COLUMNS},
                   created_at < now() - make_interval(mins => $3) AS stale
            FROM paystack_payments
            WHERE target_table = $1 AND target_id = $2 AND status = 'pending'""",
        target_table, target_id, STALE_AFTER_MINUTES,
    )
    if existing is not None:
        if not existing["stale"]:
            raise PaymentConflict(
                "A payment is already in progress. Finish it on the Paystack page, "
                f"or try again after {STALE_AFTER_MINUTES} minutes."
            )
        await _settle_stale(conn, existing)

    reference = new_reference(target_table)
    currency = settings.paystack_currency.upper()
    try:
        async with conn.transaction():
            await conn.execute(
                """INSERT INTO paystack_payments
                       (reference, target_table, target_id, donor_hash, amount_pence, currency)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                reference, target_table, target_id, donor_hash, amount_pence, currency,
            )
            await conn.execute(
                f"UPDATE {target_table} SET {col} = 'pending_payment' WHERE id = $1 AND {col} <> 'paid'",
                target_id,
            )
    except asyncpg.UniqueViolationError as exc:
        # Lost a race with a concurrent pay call for the same target.
        raise PaymentConflict("A payment is already in progress.") from exc

    callback_url = settings.paystack_callback_url
    sep = "&" if "?" in callback_url else "?"
    try:
        init = await initialize_transaction(
            email=checkout_email(donor_hash, email),
            amount_minor=amount_pence,
            reference=reference,
            callback_url=callback_url,
            currency=currency,
            # Paystack sends a cancelled checkout here; the return page
            # then verifies it, sees 'abandoned', and lets the donor retry.
            metadata={"cancel_action": f"{callback_url}{sep}{urlencode({'reference': reference})}"},
        )
    except (PaystackError, ValueError):
        logger.warning("Paystack initialize failed; closing reference=%s as failed", reference)
        await mark_unsuccessful(conn, reference, "failed")
        raise

    return {"reference": reference, "authorization_url": init["authorization_url"]}


async def _settle_stale(conn: asyncpg.Connection, payment: Any) -> None:
    """Ask Paystack what happened to an old pending checkout before replacing it."""
    try:
        tx = await verify_transaction(payment["reference"])
    except PaystackError as exc:
        if exc.status_code in (400, 404):
            # Paystack never saw this reference (initialize never completed).
            await mark_unsuccessful(conn, payment["reference"], "abandoned")
            return
        raise

    outcome = await apply_transaction(conn, payment, tx, record_failure=True)
    if outcome in ("paid", "duplicate"):
        raise PaymentConflict("Already paid")
    if outcome == "pending":
        # Still processing at Paystack, or a mismatch that needs review.
        raise PaymentConflict("A previous payment is still being processed. Try again later.")
    # failed / abandoned: free to start a new checkout
