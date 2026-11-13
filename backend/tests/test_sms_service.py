"""SMS service -- unit tests with mocked HTTP.

Guards against the 2026-11-13 regression where the entire HTTP call was
missing from send_sms, causing every SMS attempt to silently raise
NameError inside the caller's try/except (notifications/service.py:119).

These tests mock httpx.AsyncClient so no network is hit.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from mtc.config import settings
from mtc.sms.service import send_sms


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_response(status_code: int = 200, json_body: dict | None = None) -> MagicMock:
    """Build a MagicMock that behaves like httpx.Response."""
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    response.json.return_value = json_body or {}
    response.raise_for_status = MagicMock()
    if status_code >= 400:
        response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=response
        )
    return response


def _mock_client(response: MagicMock) -> MagicMock:
    """Build an AsyncClient context manager mock that returns `response`."""
    client = MagicMock()
    client.post = AsyncMock(return_value=response)
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    return client


SUCCESS_BODY = {
    "SMSMessageData": {
        "Message": "Sent to 1/1 Total Cost: KES 0.8000",
        "Recipients": [
            {
                "statusCode": 101,
                "number": "+254711000001",
                "cost": "KES 0.8000",
                "status": "Success",
                "messageId": "ATXid_test_msg_123",
            }
        ],
    }
}

FAILED_BODY = {
    "SMSMessageData": {
        "Message": "Invalid API Key",
        "Recipients": [],
    }
}


# ---------------------------------------------------------------------------
# Config guards
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_send_sms_raises_if_api_key_missing(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "", raising=False)
    with pytest.raises(RuntimeError, match="AT_API_KEY"):
        await send_sms(phone="+254711000001", message="hi")


@pytest.mark.asyncio
async def test_send_sms_raises_if_username_missing(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "some-key", raising=False)
    monkeypatch.setattr(settings, "at_username", "", raising=False)
    with pytest.raises(RuntimeError, match="AT_USERNAME"):
        await send_sms(phone="+254711000001", message="hi")


@pytest.mark.asyncio
async def test_send_sms_raises_on_bad_phone(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "k", raising=False)
    monkeypatch.setattr(settings, "at_username", "u", raising=False)
    with pytest.raises(ValueError, match="Cannot normalize"):
        await send_sms(phone="not-a-phone", message="hi")


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_send_sms_happy_path(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "test-key", raising=False)
    monkeypatch.setattr(settings, "at_username", "sandbox", raising=False)
    monkeypatch.setattr(settings, "at_environment", "sandbox", raising=False)

    response = _mock_response(200, SUCCESS_BODY)
    client = _mock_client(response)

    with patch("mtc.sms.service.httpx.AsyncClient", return_value=client):
        result = await send_sms(phone="0711000001", message="Your PIN is 1234")

    assert result["ok"] is True
    assert result["status_code"] == 101
    assert result["message_id"] == "ATXid_test_msg_123"
    assert result["status"] == "Success"
    assert result["error"] is None
    assert result["provider_response"] == SUCCESS_BODY

    # Verify the request was built correctly
    call = client.post.call_args
    assert call.kwargs["data"]["to"] == "+254711000001"
    assert call.kwargs["data"]["message"] == "Your PIN is 1234"
    assert call.kwargs["data"]["username"] == "sandbox"
    assert call.kwargs["headers"]["apiKey"] == "test-key"
    assert "sandbox.africastalking.com" in call.args[0]


@pytest.mark.asyncio
async def test_send_sms_production_endpoint(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "k", raising=False)
    monkeypatch.setattr(settings, "at_username", "u", raising=False)
    monkeypatch.setattr(settings, "at_environment", "production", raising=False)

    response = _mock_response(200, SUCCESS_BODY)
    client = _mock_client(response)

    with patch("mtc.sms.service.httpx.AsyncClient", return_value=client):
        await send_sms(phone="+254711000001", message="hi")

    endpoint = client.post.call_args.args[0]
    assert "api.africastalking.com" in endpoint
    assert "sandbox" not in endpoint


# ---------------------------------------------------------------------------
# AT-level rejection (not a transport error)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_send_sms_at_rejection_returns_ok_false(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "k", raising=False)
    monkeypatch.setattr(settings, "at_username", "u", raising=False)
    monkeypatch.setattr(settings, "at_environment", "sandbox", raising=False)

    response = _mock_response(200, FAILED_BODY)
    client = _mock_client(response)

    with patch("mtc.sms.service.httpx.AsyncClient", return_value=client):
        result = await send_sms(phone="+254711000001", message="hi")

    assert result["ok"] is False
    assert result["status_code"] is None
    assert result["error"] == "AT rejected"


# ---------------------------------------------------------------------------
# Transport errors
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_send_sms_raises_on_http_error(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "k", raising=False)
    monkeypatch.setattr(settings, "at_username", "u", raising=False)
    monkeypatch.setattr(settings, "at_environment", "sandbox", raising=False)

    response = _mock_response(500, {})
    client = _mock_client(response)

    with patch("mtc.sms.service.httpx.AsyncClient", return_value=client):
        with pytest.raises(RuntimeError, match="transport failure"):
            await send_sms(phone="+254711000001", message="hi")


@pytest.mark.asyncio
async def test_send_sms_raises_on_timeout(monkeypatch):
    monkeypatch.setattr(settings, "at_api_key", "k", raising=False)
    monkeypatch.setattr(settings, "at_username", "u", raising=False)
    monkeypatch.setattr(settings, "at_environment", "sandbox", raising=False)

    client = MagicMock()
    client.post = AsyncMock(side_effect=httpx.TimeoutException("timed out"))
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    with patch("mtc.sms.service.httpx.AsyncClient", return_value=client):
        with pytest.raises(RuntimeError, match="transport failure"):
            await send_sms(phone="+254711000001", message="hi")


# ---------------------------------------------------------------------------
# Integration with notifications/service.py
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_notification_service_swallows_send_sms_raise():
    """Confirms the notification layer catches send_sms failures.

    The whole reason the SMS bug was invisible: notifications/service.py
    wraps the call in try/except and only logs a warning. Callers still
    get their notification row (in-app), so nothing else breaks.
    """
    from pathlib import Path
    src = Path("src/mtc/notifications/service.py").read_text(encoding="utf-8")
    assert "except Exception as exc:" in src
    assert "SMS send raised" in src
