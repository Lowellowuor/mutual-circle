"""Tests for POST /mpesa/stk/callback — no live DB, no live Safaricom.

Uses httpx.ASGITransport + dependency_overrides to inject a mocked
asyncpg.Connection. The route handler never sees the real DB or the
real provider, but every branch of its control flow is exercised.
"""
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from mtc.db.main import get_conn
from mtc.main import app


def _success_payload(checkout_id: str = "ws_CO_123", receipt: str = "RCPT123") -> dict:
    return {
        "Body": {"stkCallback": {
            "MerchantRequestID": "M-1",
            "CheckoutRequestID": checkout_id,
            "ResultCode": 0,
            "ResultDesc": "The service request is processed successfully.",
            "CallbackMetadata": {"Item": [
                {"Name": "Amount", "Value": 50.0},
                {"Name": "MpesaReceiptNumber", "Value": receipt},
                {"Name": "TransactionDate", "Value": 20261107143700},
                {"Name": "PhoneNumber", "Value": 254113661960},
            ]},
        }}
    }


def _fail_payload(checkout_id: str = "ws_CO_123", code: int = 1032) -> dict:
    return {"Body": {"stkCallback": {
        "MerchantRequestID": "M-1",
        "CheckoutRequestID": checkout_id,
        "ResultCode": code,
        "ResultDesc": "Request cancelled by user",
    }}}


@pytest.fixture
def mock_conn():
    return AsyncMock()


@pytest.fixture
async def client(mock_conn):
    app.dependency_overrides[get_conn] = lambda: mock_conn
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def test_success_marks_request_paid(client, mock_conn):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = {"id": "req-uuid-1", "payment_status": "pending_payment"}
    mock_conn.execute.return_value = "UPDATE 1"

    resp = await client.post("/mpesa/stk/callback", json=_success_payload())
    assert resp.status_code == 200
    assert resp.json()["ResultCode"] == 0
    assert resp.json()["detail"]["status"] == "paid"
    assert resp.json()["detail"]["receipt"] == "RCPT123"

    all_exec = " | ".join(str(c.args[0]) for c in mock_conn.execute.call_args_list if c.args)
    assert "payment_status = 'paid'" in all_exec
    assert "mpesa_receipt = $1" in all_exec


async def test_failure_marks_payment_failed(client, mock_conn):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = {"id": "req-uuid-1", "payment_status": "pending_payment"}
    mock_conn.execute.return_value = "UPDATE 1"

    resp = await client.post("/mpesa/stk/callback", json=_fail_payload())
    assert resp.status_code == 200
    assert resp.json()["detail"]["status"] == "payment_failed"
    assert resp.json()["detail"]["result_code"] == 1032

    all_exec = " | ".join(str(c.args[0]) for c in mock_conn.execute.call_args_list if c.args)
    assert "payment_status = 'payment_failed'" in all_exec


async def test_malformed_body_returns_200(client, mock_conn):
    resp = await client.post(
        "/mpesa/stk/callback",
        content=b"not json at all",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json()["ResultCode"] == 0
    mock_conn.fetchval.assert_not_called()
    mock_conn.fetchrow.assert_not_called()


async def test_missing_body_returns_200(client, mock_conn):
    resp = await client.post("/mpesa/stk/callback", json={})
    assert resp.status_code == 200
    assert resp.json()["ResultCode"] == 0


async def test_unknown_checkout_id_returns_200_and_completes(client, mock_conn):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = None
    mock_conn.execute.return_value = "UPDATE 1"

    resp = await client.post("/mpesa/stk/callback", json=_success_payload(checkout_id="ws_UNKNOWN"))
    assert resp.status_code == 200
    assert resp.json()["detail"]["status"] == "unknown_checkout_id"

    all_exec = " | ".join(str(c.args[0]) for c in mock_conn.execute.call_args_list if c.args)
    assert "UPDATE idempotency_keys" in all_exec


async def test_duplicate_returns_cached(client, mock_conn):
    mock_conn.fetchval.return_value = None
    mock_conn.fetchrow.return_value = {
        "response_body": {"status": "paid", "receipt": "RCPT123", "amount_pence": 5000},
        "created_at": "2026-11-07T14:37:00Z",
    }

    resp = await client.post("/mpesa/stk/callback", json=_success_payload())
    assert resp.status_code == 200
    assert resp.json()["detail"]["status"] == "paid"


async def test_in_flight_409_returns_200(client, mock_conn):
    mock_conn.fetchval.return_value = None
    mock_conn.fetchrow.return_value = {
        "response_body": None,
        "created_at": "2026-11-07T14:37:00Z",
    }

    resp = await client.post("/mpesa/stk/callback", json=_success_payload())
    assert resp.status_code == 200
    assert resp.json()["ResultCode"] == 0


async def test_db_error_returns_200_and_releases(client, mock_conn):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.side_effect = Exception("simulated db error")
    mock_conn.execute.return_value = "DELETE 1"

    resp = await client.post("/mpesa/stk/callback", json=_success_payload())
    assert resp.status_code == 200
    assert resp.json()["ResultCode"] == 0

    all_exec = " | ".join(str(c.args[0]) for c in mock_conn.execute.call_args_list if c.args)
    assert "DELETE FROM idempotency_keys" in all_exec