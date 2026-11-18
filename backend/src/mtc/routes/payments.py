"""Paystack webhook and payment verification.

POST /paystack/webhook
    Paystack -> us. Authenticated by ``x-paystack-signature``: the
    HMAC-SHA512 of the raw request body keyed with PAYSTACK_SECRET_KEY.
    Bad or missing signature -> 401. Only ``charge.success`` is acted
    on, and only after ``verify_transaction`` confirms reference,
    amount and currency. Unexpected errors -> 500 so Paystack retries.

GET /payments/verify/{reference}
    Frontend return page -> us (X-Donor-Hash). Also confirms with
    ``verify_transaction``; never trusts the query string Paystack
    appended to the redirect.

Logging rule: never log request bodies or verify responses. They carry
the customer's email and can carry phone and card details. Log the
reference and outcome only.
"""
import hashlib
import hmac
import json
import logging
import re
from typing import Any

import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from mtc.config import settings
from mtc.db.main import get_conn
from mtc.paystack.client import PaystackError, is_plausible_email, verify_transaction
from mtc.paystack.payments import TARGETS, apply_transaction, get_payment

logger = logging.getLogger(__name__)

router = APIRouter(tags=["payments"])

_REFERENCE_RE = re.compile(r"^[A-Za-z0-9.=-]{1,100}$")


class PaystackPayBody(BaseModel):
    """Body for POST /donations/{id}/pay and /pledges/{id}/pay. Optional.

    Without an email, a placeholder address is sent to Paystack. The
    email is passed through to Paystack only; it is never stored or logged.
    """
    email: str | None = Field(None, max_length=254)

    @field_validator("email")
    @classmethod
    def _plausible_email(cls, v: str | None) -> str | None:
        if v is None or v.strip() == "":
            return None
        v = v.strip()
        if not is_plausible_email(v):
            raise ValueError("email is not a valid address")
        return v


def _valid_signature(raw_body: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    expected = hmac.new(
        settings.paystack_secret_key.encode("utf-8"), raw_body, hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(expected, signature.strip().lower())


async def _signed_event(
    request: Request,
    x_paystack_signature: str | None = Header(None, alias="x-paystack-signature"),
) -> dict[str, Any]:
    """Verify the signature over the exact bytes received, then parse.

    Declared before ``get_conn`` on the route, so a forged request is
    rejected before a database connection is taken.
    """
    if not settings.paystack_secret_key:
        # Cannot tell real from forged. 500 so Paystack retries once fixed.
        logger.error("Paystack webhook received but PAYSTACK_SECRET_KEY is not configured")
        raise HTTPException(500, "Payment provider not configured")

    raw = await request.body()
    if not _valid_signature(raw, x_paystack_signature):
        logger.warning("Paystack webhook rejected: invalid or missing signature")
        raise HTTPException(401, "Invalid signature")

    try:
        event = json.loads(raw)
    except ValueError:
        logger.error("Paystack webhook: signed body is not valid JSON")
        raise HTTPException(400, "Body is not valid JSON")
    if not isinstance(event, dict):
        raise HTTPException(400, "Body is not a JSON object")
    return event


@router.post("/paystack/webhook")
async def paystack_webhook(
    event: dict[str, Any] = Depends(_signed_event),
    conn: asyncpg.Connection = Depends(get_conn),
):
    name = event.get("event")
    data = event.get("data") if isinstance(event.get("data"), dict) else {}
    reference = data.get("reference")

    if name != "charge.success":
        logger.info("Paystack webhook: ignoring event %r", str(name)[:60])
        return {"status": "ignored"}
    if not isinstance(reference, str) or not _REFERENCE_RE.match(reference):
        logger.warning("Paystack webhook: charge.success without a usable reference")
        return {"status": "ignored"}

    try:
        payment = await get_payment(conn, reference)
        if payment is None:
            # Not ours (e.g. another integration on the same Paystack
            # account). Retrying will not change that.
            logger.warning("Paystack webhook: unknown reference=%s", reference)
            return {"status": "unknown_reference"}
        if payment["status"] == "paid":
            logger.info("Paystack webhook: duplicate for paid reference=%s", reference)
            return {"status": "duplicate"}

        tx = await verify_transaction(reference)
        outcome = await apply_transaction(conn, payment, tx, record_failure=False)
        logger.info("Paystack webhook: reference=%s outcome=%s", reference, outcome)
        return {"status": outcome}
    except Exception as exc:
        logger.error(
            "Paystack webhook: processing failed for reference=%s (%s); returning 500 so Paystack retries",
            reference, type(exc).__name__,
        )
        raise HTTPException(500, "Webhook processing failed") from exc


@router.get("/payments/verify/{reference}")
async def verify_payment(
    reference: str,
    x_donor_hash: str = Header(..., alias="X-Donor-Hash"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    if not _REFERENCE_RE.match(reference):
        raise HTTPException(404, "Payment not found")

    payment = await get_payment(conn, reference)
    if payment is None or not hmac.compare_digest(
        str(payment["donor_hash"]).encode(), x_donor_hash.encode()
    ):
        raise HTTPException(404, "Payment not found")

    if payment["status"] != "paid":
        try:
            tx = await verify_transaction(reference)
        except PaystackError as exc:
            logger.warning("Paystack verify failed for reference=%s: %s", reference, exc)
            raise HTTPException(503, "Could not reach Paystack to confirm this payment. Try again shortly.")
        outcome = await apply_transaction(conn, payment, tx, record_failure=True)
        logger.info("Payment verify: reference=%s outcome=%s", reference, outcome)
        payment = await get_payment(conn, reference)

    return {
        "reference": payment["reference"],
        "status": payment["status"],
        "kind": TARGETS[payment["target_table"]][2],
        "target_id": str(payment["target_id"]),
        "amount_pence": payment["amount_pence"],
        "currency": payment["currency"],
    }
