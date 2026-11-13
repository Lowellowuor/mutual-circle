"""Pledge state machine — payment_status is separate from match status.

Fixes payments review #8: paying a pledge must not overwrite its match
status. Before the fix, the STK init wrote status='pending_payment' and
the M-PESA callback wrote status='paid', both destroying the
awaiting_match -> matched -> settled match state machine.

After the fix:
  status:         awaiting_match -> matched -> settled
  payment_status: unpaid -> pending_payment -> paid | payment_failed
These are independent. Payment events only touch payment_status.
"""
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from mtc.db.main import get_pool
from mtc.main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def clean_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "TRUNCATE pledges, requests, mpesa_transactions, idempotency_keys, "
            "rate_counters, staff_sessions, audit_log RESTART IDENTITY CASCADE"
        )
    yield


DONOR_HASH = "test-donor-pledge-hash"


def _donor():
    return {"X-Donor-Hash": DONOR_HASH}


async def _create(client, type_="service_credit", value=50000):
    r = await client.post(
        "/pledges",
        headers=_donor(),
        json={
            "type": type_,
            "description": "Test pledge",
            "locality": "Kibera",
            "max_value_pence": value,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


async def _fulf_token(client):
    r = await client.post(
        "/staff/login",
        json={"role": "fulfilment", "staff_id": "FULF-08", "pin": "7355"},
    )
    return r.json()["session_token"]


async def test_create_pledge_defaults(client, clean_db):
    body = await _create(client)
    assert body["status"] == "awaiting_match"
    assert body["payment_status"] == "unpaid"


async def test_pay_pledge_preserves_match_status(client, clean_db):
    """THE regression test for payments review #8.

    Before: POST /pledges/{id}/pay wrote status='pending_payment',
    destroying awaiting_match. After: writes payment_status, leaves
    status alone.
    """
    body = await _create(client)
    pledge_id = body["id"]

    with patch("mtc.routes.pledges.initiate_stk_push", new_callable=AsyncMock) as stk:
        stk.return_value = {
            "checkout_request_id": "ws_CO_test_PLEDGE_001",
            "customer_message": "Enter PIN",
            "phone": "254712345678",
        }
        r = await client.post(
            f"/pledges/{pledge_id}/pay",
            headers=_donor(),
            json={"phone": "+254712345678"},
        )
    assert r.status_code == 200, r.text

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT status, payment_status FROM pledges WHERE id = $1", pledge_id,
        )
    assert row["status"] == "awaiting_match", f"match status destroyed: {row['status']}"
    assert row["payment_status"] == "pending_payment"


async def test_pay_pledge_no_value_returns_400(client, clean_db):
    body = await _create(client, type_="goods", value=None)
    r = await client.post(
        f"/pledges/{body['id']}/pay",
        headers=_donor(),
        json={"phone": "+254712345678"},
    )
    assert r.status_code == 400


async def test_pay_pledge_already_paid_returns_409(client, clean_db):
    body = await _create(client)
    pledge_id = body["id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE pledges SET payment_status = 'paid' WHERE id = $1", pledge_id,
        )
    r = await client.post(
        f"/pledges/{pledge_id}/pay",
        headers=_donor(),
        json={"phone": "+254712345678"},
    )
    assert r.status_code == 409


async def test_pay_pledge_already_pending_returns_409(client, clean_db):
    body = await _create(client)
    pledge_id = body["id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE pledges SET payment_status = 'pending_payment' WHERE id = $1",
            pledge_id,
        )
    r = await client.post(
        f"/pledges/{pledge_id}/pay",
        headers=_donor(),
        json={"phone": "+254712345678"},
    )
    assert r.status_code == 409


async def test_match_rejects_unpaid_service_credit(client, clean_db):
    body = await _create(client, type_="service_credit")
    pledge_id = body["id"]
    tok = await _fulf_token(client)
    r = await client.post(
        f"/fulfilment/pledges/{pledge_id}/match",
        headers={"Authorization": f"Bearer {tok}"},
        json={},
    )
    assert r.status_code == 409
    assert "paid" in r.text.lower()


async def test_match_allows_paid_service_credit(client, clean_db):
    body = await _create(client, type_="service_credit")
    pledge_id = body["id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE pledges SET payment_status = 'paid' WHERE id = $1", pledge_id,
        )
    tok = await _fulf_token(client)
    r = await client.post(
        f"/fulfilment/pledges/{pledge_id}/match",
        headers={"Authorization": f"Bearer {tok}"},
        json={},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "matched"


async def test_match_allows_unpaid_goods(client, clean_db):
    """Goods pledges are non-monetary — match is allowed without payment."""
    body = await _create(client, type_="goods", value=None)
    pledge_id = body["id"]
    tok = await _fulf_token(client)
    r = await client.post(
        f"/fulfilment/pledges/{pledge_id}/match",
        headers={"Authorization": f"Bearer {tok}"},
        json={},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "matched"
