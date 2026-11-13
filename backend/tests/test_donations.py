"""Donor contributions — payment state is honest.

Payments review #2 regression suite. Before the fix, donor_contributions.status
defaulted to 'paid', so creating a donation and then trying to pay it always
returned 409 "already paid". These tests guard against that ever returning.
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
            "TRUNCATE donor_contributions, mpesa_transactions, idempotency_keys, "
            "rate_counters RESTART IDENTITY CASCADE"
        )
    yield


DONOR = {"X-Donor-Hash": "test-donor-donations-hash"}


async def _create(client, amount=1000):
    r = await client.post(
        "/donations",
        headers=DONOR,
        json={"amount_pence": amount, "is_anonymous": True, "opt_in_ledger": False},
    )
    assert r.status_code == 200, r.text
    return r.json()


async def test_create_donation_defaults_unpaid(client, clean_db):
    body = await _create(client)
    assert body["status"] == "unpaid"
    assert body["amount_pence"] == 1000


async def test_create_donation_persists_unpaid(client, clean_db):
    body = await _create(client)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT status, mpesa_receipt FROM donor_contributions WHERE id = $1",
            body["id"],
        )
    assert row["status"] == "unpaid"
    assert row["mpesa_receipt"] is None


async def test_pay_after_create_is_not_409(client, clean_db):
    """THE regression test for payments review #2.

    Before: create -> default status='paid' -> /pay -> 409 "already paid".
    After:  create -> status='unpaid'        -> /pay -> 200 STK sent.
    """
    body = await _create(client)
    donation_id = body["id"]

    with patch("mtc.routes.donors.initiate_stk_push", new_callable=AsyncMock) as stk:
        stk.return_value = {
            "checkout_request_id": "ws_CO_test_DON_001",
            "customer_message": "Enter PIN",
            "phone": "254712345678",
        }
        r = await client.post(
            f"/donations/{donation_id}/pay",
            headers=DONOR,
            json={"phone": "+254712345678"},
        )
    assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"
    assert "checkout_request_id" in r.json()

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT status FROM donor_contributions WHERE id = $1", donation_id,
        )
    assert row["status"] == "pending_payment"


async def test_pay_rejects_paid(client, clean_db):
    body = await _create(client)
    donation_id = body["id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE donor_contributions SET status = \'paid\', mpesa_receipt = \'SGR7XN2K9P\' WHERE id = $1",
            donation_id,
        )
    r = await client.post(
        f"/donations/{donation_id}/pay",
        headers=DONOR,
        json={"phone": "+254712345678"},
    )
    assert r.status_code == 409


async def test_pay_rejects_pending(client, clean_db):
    body = await _create(client)
    donation_id = body["id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE donor_contributions SET status = \'pending_payment\' WHERE id = $1",
            donation_id,
        )
    r = await client.post(
        f"/donations/{donation_id}/pay",
        headers=DONOR,
        json={"phone": "+254712345678"},
    )
    assert r.status_code == 409


async def test_my_donations_returns_status(client, clean_db):
    body = await _create(client)
    r = await client.get("/donations/mine", headers=DONOR)
    assert r.status_code == 200
    donations = r.json()["donations"]
    assert len(donations) == 1
    assert donations[0]["status"] == "unpaid"
    assert donations[0]["mpesa_receipt"] is None
