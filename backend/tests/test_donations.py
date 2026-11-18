"""Donor contributions — payment state is honest (real DB).

Payments review #2 regression suite. Before the fix, donor_contributions.status
defaulted to 'paid', so creating a donation and then trying to pay it always
returned 409 "already paid". These tests guard against that ever returning.

The Paystack section runs the whole flow against real SQL (Paystack's
HTTP API is patched): pay -> signed webhook -> verify -> paid, including
duplicate deliveries and mismatched amounts.
"""
import hashlib
import hmac
import json
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from mtc.config import settings
from mtc.db.main import get_pool
from mtc.main import app
from mtc.paystack.client import PaystackError

CHECKOUT_URL = "https://checkout.paystack.com/test-access-code"
TEST_SECRET = "sk_test_" + "f" * 40


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
            "TRUNCATE donor_contributions, paystack_payments, idempotency_keys, "
            "rate_counters RESTART IDENTITY CASCADE"
        )
    yield


@pytest.fixture(autouse=True)
def _paystack_settings(monkeypatch):
    monkeypatch.setattr(settings, "paystack_secret_key", TEST_SECRET)
    monkeypatch.setattr(settings, "paystack_currency", "KES")


@pytest.fixture
def paystack_init():
    async def fake(**kw):
        return {"authorization_url": CHECKOUT_URL, "access_code": "ac", "reference": kw["reference"]}
    with patch("mtc.paystack.payments.initialize_transaction", new_callable=AsyncMock) as m:
        m.side_effect = fake
        yield m


@pytest.fixture
def paystack_verify():
    with patch("mtc.routes.payments.verify_transaction", new_callable=AsyncMock) as m:
        yield m


DONOR = {"X-Donor-Hash": "test-donor-donations-hash"}


async def _create(client, amount=1000):
    r = await client.post(
        "/donations",
        headers=DONOR,
        json={"amount_pence": amount, "is_anonymous": True, "opt_in_ledger": False},
    )
    assert r.status_code == 200, r.text
    return r.json()


async def _db_row(sql, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(sql, *args)


def _tx(reference, *, amount=1000, status="success", currency="KES"):
    return {"id": 123, "status": status, "reference": reference, "amount": amount,
            "currency": currency, "channel": "card"}


async def _webhook(client, reference, amount=1000):
    raw = json.dumps({"event": "charge.success", "data": {"reference": reference, "amount": amount}}).encode()
    sig = hmac.new(TEST_SECRET.encode(), raw, hashlib.sha512).hexdigest()
    return await client.post(
        "/paystack/webhook", content=raw,
        headers={"x-paystack-signature": sig, "Content-Type": "application/json"},
    )


async def _pay(client, donation_id):
    return await client.post(f"/donations/{donation_id}/pay", headers=DONOR, json={})


async def test_create_donation_defaults_unpaid(client, clean_db):
    body = await _create(client)
    assert body["status"] == "unpaid"
    assert body["amount_pence"] == 1000


async def test_create_donation_persists_unpaid(client, clean_db):
    body = await _create(client)
    row = await _db_row(
        "SELECT status, mpesa_receipt FROM donor_contributions WHERE id = $1", body["id"],
    )
    assert row["status"] == "unpaid"
    assert row["mpesa_receipt"] is None


async def test_pay_after_create_is_not_409(client, clean_db, paystack_init):
    """THE regression test for payments review #2.

    Before: create -> default status='paid' -> /pay -> 409 "already paid".
    After:  create -> status='unpaid'        -> /pay -> 200 checkout opened.
    """
    body = await _create(client)
    donation_id = body["id"]

    r = await _pay(client, donation_id)
    assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"
    out = r.json()
    assert out["authorization_url"] == CHECKOUT_URL
    reference = out["reference"]

    donation = await _db_row("SELECT status FROM donor_contributions WHERE id = $1", donation_id)
    assert donation["status"] == "pending_payment"

    payment = await _db_row(
        "SELECT target_table, target_id::text AS target_id, amount_pence, currency, status, donor_hash "
        "FROM paystack_payments WHERE reference = $1", reference,
    )
    assert payment is not None, "pending payment must be saved"
    assert payment["target_table"] == "donor_contributions"
    assert payment["target_id"] == donation_id
    assert payment["amount_pence"] == 1000
    assert payment["currency"] == "KES"
    assert payment["status"] == "pending"
    assert paystack_init.await_args.kwargs["reference"] == reference


async def test_pay_rejects_paid(client, clean_db, paystack_init):
    body = await _create(client)
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE donor_contributions SET status = 'paid' WHERE id = $1", body["id"],
        )
    r = await _pay(client, body["id"])
    assert r.status_code == 409
    paystack_init.assert_not_awaited()


async def test_second_payment_blocked_while_first_in_progress(client, clean_db, paystack_init):
    body = await _create(client)
    first = await _pay(client, body["id"])
    assert first.status_code == 200, first.text

    second = await _pay(client, body["id"])
    assert second.status_code == 409
    assert paystack_init.await_count == 1


async def test_one_pending_row_per_target_enforced_by_db(client, clean_db, paystack_init):
    """Even bypassing the route's check, the partial unique index refuses."""
    import asyncpg

    body = await _create(client)
    first = await _pay(client, body["id"])
    assert first.status_code == 200
    pool = await get_pool()
    async with pool.acquire() as conn:
        with pytest.raises(asyncpg.UniqueViolationError):
            await conn.execute(
                "INSERT INTO paystack_payments (reference, target_table, target_id, donor_hash, "
                "amount_pence, currency) VALUES ('mc-don-dupe', 'donor_contributions', $1, 'x', 1000, 'KES')",
                body["id"],
            )


async def test_paystack_failure_lets_donor_retry(client, clean_db, paystack_init):
    body = await _create(client)
    paystack_init.side_effect = PaystackError("Paystack initialize failed (HTTP 503): down", 503)
    r = await _pay(client, body["id"])
    assert r.status_code == 503

    donation = await _db_row("SELECT status FROM donor_contributions WHERE id = $1", body["id"])
    assert donation["status"] == "payment_failed"
    payment = await _db_row("SELECT status FROM paystack_payments WHERE target_id = $1", body["id"])
    assert payment["status"] == "failed"

    async def ok(**kw):
        return {"authorization_url": CHECKOUT_URL, "reference": kw["reference"]}
    paystack_init.side_effect = ok
    retry = await _pay(client, body["id"])
    assert retry.status_code == 200, retry.text


async def test_webhook_marks_donation_paid_once(client, clean_db, paystack_init, paystack_verify):
    body = await _create(client)
    reference = (await _pay(client, body["id"])).json()["reference"]
    paystack_verify.return_value = _tx(reference)

    r = await _webhook(client, reference)
    assert r.status_code == 200, r.text
    assert r.json() == {"status": "paid"}

    donation = await _db_row("SELECT status FROM donor_contributions WHERE id = $1", body["id"])
    assert donation["status"] == "paid"
    payment = await _db_row(
        "SELECT status, paystack_transaction_id, channel, paid_at FROM paystack_payments WHERE reference = $1",
        reference,
    )
    assert payment["status"] == "paid"
    assert payment["paystack_transaction_id"] == 123
    assert payment["channel"] == "card"
    paid_at = payment["paid_at"]

    # duplicate delivery: no Paystack call, no state change
    dup = await _webhook(client, reference)
    assert dup.json() == {"status": "duplicate"}
    assert paystack_verify.await_count == 1
    again = await _db_row("SELECT paid_at FROM paystack_payments WHERE reference = $1", reference)
    assert again["paid_at"] == paid_at

    # and the donation can't be paid again
    assert (await _pay(client, body["id"])).status_code == 409


async def test_webhook_amount_mismatch_then_real_payment(client, clean_db, paystack_init, paystack_verify):
    body = await _create(client)
    reference = (await _pay(client, body["id"])).json()["reference"]

    paystack_verify.return_value = _tx(reference, amount=1)
    r = await _webhook(client, reference)
    assert r.json() == {"status": "rejected"}
    donation = await _db_row("SELECT status FROM donor_contributions WHERE id = $1", body["id"])
    assert donation["status"] == "pending_payment"

    paystack_verify.return_value = _tx(reference)
    r = await _webhook(client, reference)
    assert r.json() == {"status": "paid"}
    donation = await _db_row("SELECT status FROM donor_contributions WHERE id = $1", body["id"])
    assert donation["status"] == "paid"


async def test_webhook_bad_signature_changes_nothing(client, clean_db, paystack_init, paystack_verify):
    body = await _create(client)
    reference = (await _pay(client, body["id"])).json()["reference"]
    raw = json.dumps({"event": "charge.success", "data": {"reference": reference}}).encode()
    r = await client.post("/paystack/webhook", content=raw, headers={"x-paystack-signature": "0" * 128})
    assert r.status_code == 401
    paystack_verify.assert_not_awaited()
    payment = await _db_row("SELECT status FROM paystack_payments WHERE reference = $1", reference)
    assert payment["status"] == "pending"


async def test_verify_endpoint_marks_paid(client, clean_db, paystack_init, paystack_verify):
    body = await _create(client)
    reference = (await _pay(client, body["id"])).json()["reference"]
    paystack_verify.return_value = _tx(reference)

    r = await client.get(f"/payments/verify/{reference}", headers=DONOR)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "paid"
    assert r.json()["kind"] == "donation"
    donation = await _db_row("SELECT status FROM donor_contributions WHERE id = $1", body["id"])
    assert donation["status"] == "paid"


async def test_verify_endpoint_other_donor_404(client, clean_db, paystack_init, paystack_verify):
    body = await _create(client)
    reference = (await _pay(client, body["id"])).json()["reference"]
    r = await client.get(f"/payments/verify/{reference}", headers={"X-Donor-Hash": "someone-else"})
    assert r.status_code == 404
    paystack_verify.assert_not_awaited()


async def test_cancelled_checkout_allows_retry_and_late_success_still_wins(
    client, clean_db, paystack_init, paystack_verify,
):
    body = await _create(client)
    first_ref = (await _pay(client, body["id"])).json()["reference"]

    paystack_verify.return_value = _tx(first_ref, status="abandoned")
    r = await client.get(f"/payments/verify/{first_ref}", headers=DONOR)
    assert r.json()["status"] == "abandoned"

    second = await _pay(client, body["id"])
    assert second.status_code == 200, second.text

    # The abandoned checkout completes late anyway: it is still recorded.
    paystack_verify.return_value = _tx(first_ref)
    r = await _webhook(client, first_ref)
    assert r.json() == {"status": "paid"}
    donation = await _db_row("SELECT status FROM donor_contributions WHERE id = $1", body["id"])
    assert donation["status"] == "paid"


async def test_my_donations_returns_status(client, clean_db):
    body = await _create(client)
    r = await client.get("/donations/mine", headers=DONOR)
    assert r.status_code == 200
    donations = r.json()["donations"]
    assert len(donations) == 1
    assert donations[0]["status"] == "unpaid"
    assert donations[0]["mpesa_receipt"] is None
