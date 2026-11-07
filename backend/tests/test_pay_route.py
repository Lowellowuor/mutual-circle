"""Tests for POST /requests/{id}/pay — no live DB, no live Daraja.

Uses httpx.ASGITransport + dependency_overrides to inject a mocked
asyncpg.Connection and a fixed token, and unittest.mock.patch to stub
initiate_stk_push. Every branch of the route is exercised without a
real payment.
"""
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from mtc.db.main import get_conn
from mtc.main import app
from mtc.routes.requester import require_token

_TEST_TOKEN = "test-token-hash-12345"
_REQ_ID = "00000000-0000-0000-0000-000000000001"


def _row(payment_status: str = "n/a", amount_pence: int = 100000,
         token_hash: str = _TEST_TOKEN) -> dict:
    return {
        "id": _REQ_ID,
        "amount_pence": amount_pence,
        "payment_status": payment_status,
        "token_hash": token_hash,
    }


@pytest.fixture
def mock_conn():
    return AsyncMock()


@pytest.fixture
async def client(mock_conn):
    app.dependency_overrides[get_conn] = lambda: mock_conn
    app.dependency_overrides[require_token] = lambda: _TEST_TOKEN
    transport = ASGITransport(app=app)
    # Every POST sends an Idempotency-Key. idempotency.check_or_claim and
    # .release both short-circuit to "no-op" when key is falsy (see
    # mtc/idempotency.py:46 and :110), so without this header the cache
    # branches are dead and the tests would silently miss the real code.
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Idempotency-Key": "test-idem-key-12345"},
    ) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def stk_success():
    with patch("mtc.routes.requester.initiate_stk_push", new_callable=AsyncMock) as m:
        m.return_value = {
            "checkout_request_id": "ws_CO_TEST123",
            "merchant_request_id": "M-1",
            "response_code": "0",
            "response_description": "Success",
            "customer_message": "STK prompt sent",
        }
        yield m


async def test_pay_happy_path(client, mock_conn, stk_success):
    mock_conn.fetchval.return_value = True       # claim won
    mock_conn.fetchrow.return_value = _row()
    mock_conn.execute.return_value = "UPDATE 1"

    resp = await client.post(
        f"/requests/{_REQ_ID}/pay",
        json={"phone": "+254113661960"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["ok"] is True
    assert body["checkout_request_id"] == "ws_CO_TEST123"

    stk_success.assert_awaited_once()
    kwargs = stk_success.await_args.kwargs
    assert kwargs["amount_pence"] == 100000  # from the request row, not the body
    assert kwargs["phone"] == "+254113661960"

    exec_joined = " | ".join(str(c.args[0]) for c in mock_conn.execute.call_args_list if c.args)
    assert "payment_status = 'pending_payment'" in exec_joined
    assert "mpesa_checkout_request_id = $1" in exec_joined


async def test_pay_not_found(client, mock_conn, stk_success):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = None

    resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "+254113661960"})
    assert resp.status_code == 404
    stk_success.assert_not_awaited()


async def test_pay_wrong_owner(client, mock_conn, stk_success):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = _row(token_hash="someone-else")

    resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "+254113661960"})
    assert resp.status_code == 404
    stk_success.assert_not_awaited()


async def test_pay_already_paid(client, mock_conn, stk_success):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = _row(payment_status="paid")

    resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "+254113661960"})
    assert resp.status_code == 409
    assert "paid" in resp.text.lower()
    stk_success.assert_not_awaited()


async def test_pay_pending(client, mock_conn, stk_success):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = _row(payment_status="pending_payment")

    resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "+254113661960"})
    assert resp.status_code == 409
    assert "progress" in resp.text.lower()
    stk_success.assert_not_awaited()


async def test_pay_retry_from_payment_failed(client, mock_conn, stk_success):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = _row(payment_status="payment_failed")
    mock_conn.execute.return_value = "UPDATE 1"

    resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "+254113661960"})
    assert resp.status_code == 200
    stk_success.assert_awaited_once()


async def test_pay_stk_fails(client, mock_conn):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = _row()
    mock_conn.execute.return_value = "DELETE 1"

    with patch("mtc.routes.requester.initiate_stk_push", new_callable=AsyncMock) as m:
        m.side_effect = RuntimeError("Daraja rejected STK")
        resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "+254113661960"})

    assert resp.status_code == 503
    exec_joined = " | ".join(str(c.args[0]) for c in mock_conn.execute.call_args_list if c.args)
    # No UPDATE ran; only the release (DELETE) from idempotency
    assert "payment_status = 'pending_payment'" not in exec_joined
    assert "DELETE FROM idempotency_keys" in exec_joined


async def test_pay_bad_phone(client, mock_conn):
    mock_conn.fetchval.return_value = True
    mock_conn.fetchrow.return_value = _row()
    mock_conn.execute.return_value = "DELETE 1"

    with patch("mtc.routes.requester.initiate_stk_push", new_callable=AsyncMock) as m:
        m.side_effect = ValueError("Cannot normalize phone")
        resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "123"})

    assert resp.status_code in (400, 422)  # 422 if Pydantic min_length rejects


async def test_pay_idempotent_duplicate(client, mock_conn):
    mock_conn.fetchval.return_value = None       # claim failed — key exists
    mock_conn.fetchrow.return_value = {
        "response_body": {
            "ok": True,
            "checkout_request_id": "ws_CO_PREVIOUS",
            "message": "STK push sent",
        },
        "created_at": "2026-11-07T14:37:00Z",
    }

    with patch("mtc.routes.requester.initiate_stk_push", new_callable=AsyncMock) as m:
        resp = await client.post(f"/requests/{_REQ_ID}/pay", json={"phone": "+254113661960"})
        m.assert_not_awaited()

    assert resp.status_code == 200
    assert resp.json()["checkout_request_id"] == "ws_CO_PREVIOUS"