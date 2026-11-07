"""Africa's Talking SMS service — async, httpx-based.

This module sends an SMS and returns a structured result. It does NOT
persist the phone number. The caller decides what to do with it.

Sandbox note: AT sandbox does NOT deliver to real handsets. Messages go
to the browser simulator at:
    https://simulator.africastalking.com:1517/simulator
A sandbox "success" is HTTP 200 with statusCode 101 and a messageId.
Real delivery requires a live account + registered Sender ID.
"""
import logging
from typing import Any

import httpx

from mtc.config import settings

logger = logging.getLogger(__name__)

_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging"
_PRODUCTION_URL = "https://api.africastalking.com/version1/messaging"


def _endpoint() -> str:
    env = settings.at_environment.lower()
    if env == "production":
        return _PRODUCTION_URL
    if env == "sandbox":
        return _SANDBOX_URL
    raise ValueError(f"AT_ENVIRONMENT must be 'sandbox' or 'production', got {env!r}")


def _normalize_phone(phone: str) -> str:
    """Return ``+2547XXXXXXXX`` (AT wants the leading +)."""
    if not phone:
        raise ValueError("phone is empty")
    p = phone.strip().replace(" ", "").replace("-", "")
    if p.startswith("+"):
        p = p[1:]
    if p.startswith("0"):
        p = "254" + p[1:]
    if p.startswith("7") or p.startswith("1"):
        p = "254" + p
    if not (p.startswith("254") and len(p) == 12 and p.isdigit()):
        raise ValueError(f"Cannot normalize phone {phone!r}")
    return "+" + p


async def send_sms(*, phone: str, message: str) -> dict[str, Any]:
    """Send one SMS.

    Result keys:
      ok, message_id, status, status_code, cost, provider_response, error

    Raises RuntimeError only on config or transport failure, so callers
    can distinguish "AT said no" (ok=False) from "we couldn't reach AT"
    (raise). Never raises on AT-level rejection.
    """
    if not settings.at_api_key:
        raise RuntimeError("AT_API_KEY not configured")
    if not settings.at_username:
        raise RuntimeError("AT_USERNAME not configured")
    if not message:
        raise ValueError("message is empty")
    if len(message) > 160:
        raise ValueError(f"message is {len(message)} chars; AT limit is 160 (single part)")

    normalized = _normalize_phone(phone)

    form = {
        "username": settings.at_username,
        "to": normalized,
        "message": message,
    }
    if settings.at_sender_id:
        form["from"] = settings.at_sender_id

    headers = {
        "apiKey": settings.at_api_key,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(_endpoint(), data=form, headers=headers)

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"AT SMS HTTP {resp.status_code}: {resp.text[:300]}")

    try:
        body = resp.json()
    except Exception:
        raise RuntimeError(f"AT SMS non-JSON response: {resp.text[:300]}")

    try:
        recipient = body["SMSMessageData"]["Recipients"][0]
    except (KeyError, IndexError, TypeError):
        logger.error("AT SMS unexpected body: %r", body)
        return {
            "ok": False,
            "message_id": None,
            "status": "UnexpectedResponse",
            "status_code": None,
            "cost": None,
            "provider_response": body,
            "error": "AT response missing Recipients[0]",
        }

    status_code = recipient.get("statusCode")
    ok = status_code == 101

    if not ok:
        logger.warning(
            "AT SMS non-success: code=%r status=%r",
            status_code, recipient.get("status"),
        )

    return {
        "ok": ok,
        "message_id": recipient.get("messageId"),
        "status": recipient.get("status"),
        "status_code": status_code,
        "cost": recipient.get("cost"),
        "provider_response": body,
        "error": None,
    }