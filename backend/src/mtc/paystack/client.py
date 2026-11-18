"""Paystack REST client: initialize and verify transactions.

Reads the secret key from ``settings.paystack_secret_key`` (backend/.env).

Public API:
    initialize_transaction(email, amount_minor, reference, callback_url) -> dict
    verify_transaction(reference) -> dict
    placeholder_email(donor_id) -> str

Amounts are in the currency's lowest unit (cents for KES), which is
exactly what the ``*_pence`` columns already store. No conversion here.

Never log response bodies: verify responses carry the customer's email,
and can carry phone and card details.
"""
import logging
import re
from typing import Any
from urllib.parse import quote

import httpx

from mtc.config import settings

logger = logging.getLogger(__name__)

PAYSTACK_BASE_URL = "https://api.paystack.co"
_TIMEOUT = httpx.Timeout(20.0, connect=10.0)
PLACEHOLDER_EMAIL_DOMAIN = "example.com"

# Test seam: tests set this to an httpx.MockTransport. None = real network.
_transport: httpx.AsyncBaseTransport | None = None

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class PaystackError(RuntimeError):
    """Paystack was unreachable, rejected the call, or replied with garbage."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def placeholder_email(donor_id: str) -> str:
    """Paystack requires an email. Donors are anonymous, so mint one."""
    safe = re.sub(r"[^a-z0-9-]", "", donor_id.lower())[:48] or "anonymous"
    return f"donor-{safe}@{PLACEHOLDER_EMAIL_DOMAIN}"


def is_plausible_email(value: str | None) -> bool:
    return bool(value) and len(value) <= 254 and bool(_EMAIL_RE.match(value))


def _headers() -> dict[str, str]:
    if not settings.paystack_secret_key:
        raise PaystackError("PAYSTACK_SECRET_KEY is not configured")
    return {
        "Authorization": f"Bearer {settings.paystack_secret_key}",
        "Content-Type": "application/json",
    }


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=PAYSTACK_BASE_URL, timeout=_TIMEOUT, transport=_transport)


def _unwrap(resp: httpx.Response, action: str) -> dict[str, Any]:
    """Return ``data`` from a Paystack envelope, or raise PaystackError.

    Paystack replies ``{"status": bool, "message": str, "data": {...}}``.
    Only ``message`` is ever put into errors or logs.
    """
    try:
        body = resp.json()
    except ValueError:
        raise PaystackError(f"Paystack {action}: non-JSON reply (HTTP {resp.status_code})", resp.status_code)

    if not isinstance(body, dict):
        raise PaystackError(f"Paystack {action}: unexpected reply shape", resp.status_code)

    message = str(body.get("message") or "")[:200]
    if resp.status_code != 200 or body.get("status") is not True:
        raise PaystackError(f"Paystack {action} failed (HTTP {resp.status_code}): {message}", resp.status_code)

    data = body.get("data")
    if not isinstance(data, dict):
        raise PaystackError(f"Paystack {action}: reply has no data object", resp.status_code)
    return data


async def initialize_transaction(
    *,
    email: str,
    amount_minor: int,
    reference: str,
    callback_url: str,
    currency: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Start a hosted checkout. Returns authorization_url, access_code, reference.

    The caller must have saved ``reference`` before calling this, so a
    crash after Paystack accepts the call can still be reconciled.
    """
    if amount_minor <= 0:
        raise ValueError(f"amount_minor must be > 0, got {amount_minor}")

    payload: dict[str, Any] = {
        "email": email,
        "amount": amount_minor,
        "currency": (currency or settings.paystack_currency).upper(),
        "reference": reference,
        "callback_url": callback_url,
    }
    if metadata:
        payload["metadata"] = metadata
    try:
        async with _client() as client:
            resp = await client.post("/transaction/initialize", json=payload, headers=_headers())
    except httpx.HTTPError as exc:
        raise PaystackError(f"Paystack initialize: network error ({type(exc).__name__})") from exc

    data = _unwrap(resp, "initialize")
    url = data.get("authorization_url")
    if not isinstance(url, str) or not url.startswith("https://"):
        raise PaystackError("Paystack initialize: reply has no https authorization_url", resp.status_code)
    if data.get("reference") not in (None, reference):
        raise PaystackError("Paystack initialize: reply reference does not match request", resp.status_code)

    return {
        "authorization_url": url,
        "access_code": data.get("access_code"),
        "reference": reference,
    }


async def verify_transaction(reference: str) -> dict[str, Any]:
    """Fetch a transaction's authoritative state from Paystack.

    Returns the ``data`` object as-is (status, reference, amount,
    currency, id, channel, paid_at, customer, ...). Callers check the
    fields they care about; this function does not judge success.
    """
    if not reference:
        raise ValueError("reference is empty")
    try:
        async with _client() as client:
            resp = await client.get(f"/transaction/verify/{quote(reference, safe='')}", headers=_headers())
    except httpx.HTTPError as exc:
        raise PaystackError(f"Paystack verify: network error ({type(exc).__name__})") from exc
    return _unwrap(resp, "verify")
