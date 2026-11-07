"""M-PESA Daraja client — STK Push initiation and callback parsing.

Reads credentials from ``mtc.config.settings``. ``MPESA_ENVIRONMENT``
selects sandbox vs production endpoints.

Public API:
    initiate_stk_push(phone, amount_pence, account_ref, description) -> dict
    parse_stk_callback(body) -> dict | None

Amounts are passed in pence (internal unit). Daraja requires whole KES;
``_pence_to_kes`` enforces this and raises on fractional shillings.

Phone numbers are normalized to ``2547XXXXXXXX`` (no leading +).
"""
import asyncio
import base64
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from mtc.config import settings

logger = logging.getLogger(__name__)

_SANDBOX_BASE = "https://sandbox.safaricom.co.ke"
_PRODUCTION_BASE = "https://api.safaricom.co.ke"


def _base_url() -> str:
    env = settings.mpesa_environment.lower()
    if env == "production":
        return _PRODUCTION_BASE
    if env == "sandbox":
        return _SANDBOX_BASE
    raise ValueError(f"MPESA_ENVIRONMENT must be 'sandbox' or 'production', got {env!r}")


_token_lock = asyncio.Lock()
_token_cache: dict[str, Any] = {"token": None, "expires_at": 0.0}


async def _get_access_token() -> str:
    now = time.monotonic()
    async with _token_lock:
        if _token_cache["token"] and now < _token_cache["expires_at"]:
            return _token_cache["token"]

        if not settings.mpesa_consumer_key or not settings.mpesa_consumer_secret:
            raise RuntimeError("MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET not configured")

        creds = f"{settings.mpesa_consumer_key}:{settings.mpesa_consumer_secret}"
        auth = base64.b64encode(creds.encode()).decode()

        url = f"{_base_url()}/oauth/v1/generate"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                url,
                params={"grant_type": "client_credentials"},
                headers={"Authorization": f"Basic {auth}"},
            )

        if resp.status_code != 200:
            raise RuntimeError(f"Daraja OAuth HTTP {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        token = data.get("access_token")
        if not token:
            raise RuntimeError(f"Daraja OAuth response missing access_token: {data!r}")

        try:
            expires_in = int(data.get("expires_in", "3599"))
        except (TypeError, ValueError):
            expires_in = 3599

        _token_cache["token"] = token
        _token_cache["expires_at"] = now + max(expires_in - 60, 60)
        logger.info("Daraja OAuth token refreshed (ttl %ds)", expires_in)
        return token


def _reset_token_cache_for_tests() -> None:
    _token_cache["token"] = None
    _token_cache["expires_at"] = 0.0


def _normalize_phone(phone: str) -> str:
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
        raise ValueError(f"Cannot normalize phone {phone!r} to 2547XXXXXXXX (got {p!r})")
    return p


def _pence_to_kes(amount_pence: int) -> int:
    if amount_pence <= 0:
        raise ValueError(f"amount_pence must be > 0, got {amount_pence}")
    if amount_pence % 100 != 0:
        raise ValueError(
            f"amount_pence {amount_pence} is not a whole number of KES; "
            f"Daraja STK rejects fractional shillings"
        )
    return amount_pence // 100


def _timestamp() -> str:
    """Daraja expects YYYYMMDDHHMMSS in Africa/Nairobi (UTC+3)."""
    eat = datetime.now(timezone.utc) + timedelta(hours=3)
    return eat.strftime("%Y%m%d%H%M%S")


def _password(shortcode: str, passkey: str, ts: str) -> str:
    return base64.b64encode(f"{shortcode}{passkey}{ts}".encode()).decode()


async def initiate_stk_push(
    *,
    phone: str,
    amount_pence: int,
    account_ref: str,
    description: str,
) -> dict[str, Any]:
    """Trigger an STK prompt on the customer's phone.

    Callers must persist ``checkout_request_id`` — it is the only way to
    match the callback back to the request row.
    """
    if not settings.mpesa_shortcode or not settings.mpesa_passkey or not settings.mpesa_callback_url:
        raise RuntimeError(
            "MPESA_SHORTCODE / MPESA_PASSKEY / MPESA_CALLBACK_URL not configured"
        )

    normalized = _normalize_phone(phone)
    amount_kes = _pence_to_kes(amount_pence)
    ts = _timestamp()
    pw = _password(settings.mpesa_shortcode, settings.mpesa_passkey, ts)
    token = await _get_access_token()

    body = {
        "BusinessShortCode": settings.mpesa_shortcode,
        "Password": pw,
        "Timestamp": ts,
        "TransactionType": settings.mpesa_transaction_type,
        "Amount": amount_kes,
        "PartyA": normalized,
        "PartyB": settings.mpesa_shortcode,
        "PhoneNumber": normalized,
        "CallBackURL": settings.mpesa_callback_url,
        "AccountReference": account_ref[:12],
        "TransactionDesc": description[:13],
    }

    url = f"{_base_url()}/mpesa/stkpush/v1/processrequest"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            url,
            json=body,
            headers={"Authorization": f"Bearer {token}"},
        )

    if resp.status_code != 200:
        logger.error("Daraja STK HTTP %d: %s", resp.status_code, resp.text[:400])

    try:
        data = resp.json()
    except Exception:
        raise RuntimeError(f"Daraja STK non-JSON (HTTP {resp.status_code}): {resp.text[:300]}")

    if data.get("ResponseCode") != "0":
        raise RuntimeError(
            f"Daraja STK rejected: "
            f"{data.get('errorMessage') or data.get('ResponseDescription') or data}"
        )

    return {
        "checkout_request_id": data["CheckoutRequestID"],
        "merchant_request_id": data.get("MerchantRequestID"),
        "response_code": data["ResponseCode"],
        "response_description": data.get("ResponseDescription"),
        "customer_message": data.get("CustomerMessage"),
    }


def parse_stk_callback(body: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize a Safaricom STK callback. Returns ``None`` on malformed input."""
    try:
        stk = body["Body"]["stkCallback"]
    except (KeyError, TypeError):
        logger.warning("STK callback missing Body.stkCallback")
        return None

    checkout_id = stk.get("CheckoutRequestID")
    if not checkout_id:
        logger.warning("STK callback missing CheckoutRequestID")
        return None

    try:
        result_code = int(stk.get("ResultCode", -1))
    except (TypeError, ValueError):
        result_code = -1

    parsed: dict[str, Any] = {
        "checkout_request_id": checkout_id,
        "merchant_request_id": stk.get("MerchantRequestID"),
        "result_code": result_code,
        "result_desc": stk.get("ResultDesc"),
        "success": result_code == 0,
        "receipt": None,
        "amount_pence": None,
        "phone": None,
        "transaction_date": None,
    }

    if result_code != 0:
        return parsed

    try:
        items = stk["CallbackMetadata"]["Item"]
    except (KeyError, TypeError):
        logger.warning("STK success callback missing CallbackMetadata.Item")
        return parsed

    for item in items:
        name = item.get("Name")
        value = item.get("Value")
        if name == "MpesaReceiptNumber":
            parsed["receipt"] = value
        elif name == "Amount":
            try:
                parsed["amount_pence"] = int(round(float(value) * 100))
            except (TypeError, ValueError):
                pass
        elif name == "PhoneNumber":
            try:
                parsed["phone"] = _normalize_phone(str(value))
            except ValueError:
                parsed["phone"] = str(value)
        elif name == "TransactionDate":
            parsed["transaction_date"] = str(value)

    return parsed