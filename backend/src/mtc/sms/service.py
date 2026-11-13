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
        raise RuntimeError("AT_API_KEY is not configured")
    if not settings.at_username:
        raise RuntimeError("AT_USERNAME is not configured")

    normalized_phone = _normalize_phone(phone)
    endpoint = _endpoint()

    form = {
        "username": settings.at_username,
        "to": normalized_phone,
        "message": message,
    }
    if settings.at_sender_id:
        form["from"] = settings.at_sender_id

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                endpoint,
                headers={
                    "apiKey": settings.at_api_key,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                },
                data=form,
            )
            response.raise_for_status()
            body = response.json()
    except (httpx.HTTPError, httpx.TimeoutException) as exc:
        logger.error("AT SMS transport failure: %s", exc)
        raise RuntimeError(f"AT SMS transport failure: {exc}") from exc
    except ValueError as exc:
        # .json() failed -- response wasn't JSON
        logger.error("AT SMS response was not JSON: %s", exc)
        raise RuntimeError(f"AT SMS response was not JSON: {exc}") from exc

    recipients = body.get("SMSMessageData", {}).get("Recipients") or []
    recipient = recipients[0] if recipients else {}

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
        "error": None if ok else (recipient.get("status") or "AT rejected"),
    }