"""Institutional payment flow tests.

Guards payments review #2 (no requester-pays) and the new admin-only
KPLC payment confirmation flow.
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
            "TRUNCATE institutional_payments, institutions, requesters, requests, "
            "mpesa_transactions, idempotency_keys, rate_counters, staff_sessions, "
            "ledger_entries, audit_log RESTART IDENTITY CASCADE"
        )
    yield


async def _staff_token(client):
    r = await client.post(
        "/staff/login",
        json={"role": "fulfilment", "staff_id": "FULF-08", "pin": "7355"},
    )
    assert r.status_code == 200, r.text
    return r.json()["session_token"]


async def _create_request(client, phone="+254799000111", amount=50_000):
    """Create a request AND register the requester's phone."""
    tok = (await client.post("/tokens", json={"phone": phone})).json()["token"]
    r = await client.post(
        "/requests/pool",
        headers={"X-Token": tok},
        json={
            "category": "utility",
            "hashed_object_id": "99998888",
            "amount_pence": amount,
        },
    )
    assert r.status_code == 200, r.text
    rid = r.json()["id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE requests SET status = 'verified' WHERE id = $1", rid,
        )
    return rid


async def _create_institution(client, token):
    r = await client.post(
        "/admin/institutions",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "KPLC Prepaid",
            "type": "utility",
            "paybill_number": "888880",
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


# ───────────────────────────────────────────────────────────────────────────

async def test_create_institution(client, clean_db):
    tok = await _staff_token(client)
    inst_id = await _create_institution(client, tok)
    assert inst_id


async def test_list_institutions(client, clean_db):
    tok = await _staff_token(client)
    await _create_institution(client, tok)
    r = await client.get(
        "/admin/institutions",
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 200
    assert len(r.json()["institutions"]) == 1
    assert r.json()["institutions"][0]["name"] == "KPLC Prepaid"


async def test_institutional_queue_shows_verified_utility(client, clean_db):
    tok = await _staff_token(client)
    await _create_institution(client, tok)
    rid = await _create_request(client)
    r = await client.get(
        "/admin/institutional-payments/queue",
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 200
    assert len(r.json()["pending"]) == 1
    assert r.json()["pending"][0]["request_id"] == rid


async def test_confirm_payment_sends_sms_and_fulfils(client, clean_db):
    tok = await _staff_token(client)
    await _create_institution(client, tok)
    rid = await _create_request(client)

    with patch(
        "mtc.routes.institutional.send_sms", new_callable=AsyncMock
    ) as sms_mock:
        sms_mock.return_value = {"ok": True, "message_id": "ATXid_test_1"}

        r = await client.post(
            f"/admin/institutional-payments/{rid}/confirm",
            headers={"Authorization": f"Bearer {tok}"},
            json={
                "bank_transaction_ref": "BANK-REF-123",
                "kplc_token": "1234-5678-9012",
            },
        )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["sms_delivered"] is True
    assert body["bank_transaction_ref"] == "BANK-REF-123"

    # SMS was called with the KPLC token in the message
    call_args = sms_mock.call_args
    assert "1234-5678-9012" in call_args.kwargs["message"]

    # Request is now fulfilled
    pool = await get_pool()
    async with pool.acquire() as conn:
        req = await conn.fetchrow("SELECT status FROM requests WHERE id = $1", rid)
        assert req["status"] == "fulfilled"

        payment = await conn.fetchrow(
            "SELECT status, bank_transaction_ref, kplc_token FROM institutional_payments WHERE request_id = $1",
            rid,
        )
        assert payment["status"] == "paid"
        assert payment["bank_transaction_ref"] == "BANK-REF-123"
        assert payment["kplc_token"] == "1234-5678-9012"


async def test_confirm_payment_blocks_non_utility(client, clean_db):
    tok = await _staff_token(client)
    await _create_institution(client, tok)
    # Create a SWAP request (category is not utility)
    r = (await client.post("/tokens", json={"phone": "+254799000222"})).json()
    tok_user = r["token"]
    r = await client.post(
        "/requests/swap",
        headers={"X-Token": tok_user},
        json={"bundle_category": "Standard Pantry", "locker_location": "Kibera Hub"},
    )
    rid = r.json()["id"]

    r = await client.post(
        f"/admin/institutional-payments/{rid}/confirm",
        headers={"Authorization": f"Bearer {tok}"},
        json={"bank_transaction_ref": "BANK-REF-TEST", "kplc_token": "9999"},
    )
    assert r.status_code == 400
    assert "utility" in r.text.lower()


async def test_confirm_payment_blocks_unverified(client, clean_db):
    tok = await _staff_token(client)
    await _create_institution(client, tok)
    rid = await _create_request(client)
    # Revert status to pending_evidence
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE requests SET status = 'pending_evidence' WHERE id = $1", rid,
        )

    r = await client.post(
        f"/admin/institutional-payments/{rid}/confirm",
        headers={"Authorization": f"Bearer {tok}"},
        json={"bank_transaction_ref": "BANK-REF-TEST", "kplc_token": "9999"},
    )
    assert r.status_code == 409


async def test_confirm_payment_requires_phone_on_file(client, clean_db):
    """If the requester never saved a phone, we can't SMS them. 409."""
    tok = await _staff_token(client)
    await _create_institution(client, tok)

    # Create a request WITHOUT hitting /tokens first (no phone saved)
    r = (await client.post("/tokens", json={"phone": "+254799000333"})).json()
    tok_user = r["token"]
    r = await client.post(
        "/requests/pool",
        headers={"X-Token": tok_user},
        json={
            "category": "utility",
            "hashed_object_id": "99997777",
            "amount_pence": 50_000,
        },
    )
    rid = r.json()["id"]

    # Delete the requester row to simulate missing phone
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM requesters WHERE token_hash = $1", tok_user)
        await conn.execute("UPDATE requests SET status = 'verified' WHERE id = $1", rid)

    r = await client.post(
        f"/admin/institutional-payments/{rid}/confirm",
        headers={"Authorization": f"Bearer {tok}"},
        json={"bank_transaction_ref": "BANK-REF-TEST", "kplc_token": "9999"},
    )
    assert r.status_code == 409
    assert "phone" in r.text.lower()


async def test_confirm_payment_sms_failure_does_not_rollback(client, clean_db):
    """If SMS fails, payment is still recorded and request fulfilled."""
    tok = await _staff_token(client)
    await _create_institution(client, tok)
    rid = await _create_request(client)

    with patch(
        "mtc.routes.institutional.send_sms", new_callable=AsyncMock
    ) as sms_mock:
        sms_mock.side_effect = RuntimeError("AT is down")

        r = await client.post(
            f"/admin/institutional-payments/{rid}/confirm",
            headers={"Authorization": f"Bearer {tok}"},
            json={"bank_transaction_ref": "BANK-X", "kplc_token": "9999"},
        )
    assert r.status_code == 200
    assert r.json()["sms_delivered"] is False
    assert "AT is down" in r.json()["sms_error"]

    pool = await get_pool()
    async with pool.acquire() as conn:
        req = await conn.fetchrow("SELECT status FROM requests WHERE id = $1", rid)
        assert req["status"] == "fulfilled"
        payment = await conn.fetchrow(
            "SELECT status FROM institutional_payments WHERE request_id = $1", rid,
        )
        assert payment["status"] == "paid"
