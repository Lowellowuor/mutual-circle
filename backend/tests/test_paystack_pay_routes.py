"""POST /donations/{id}/pay and POST /pledges/{id}/pay — no DB, no network.

The connection is a FakeConn (tests/paystack_fakes.py) and Paystack's
initialize/verify are patched where mtc.paystack.payments uses them.
"""
from unittest.mock import AsyncMock, patch

import asyncpg
import pytest
from httpx import ASGITransport, AsyncClient

from mtc.config import settings
from mtc.db.main import get_conn
from mtc.main import app
from mtc.paystack.client import PaystackError

from tests.paystack_fakes import (
    CHECKOUT_URL, DONATION_ID, DONOR, PLEDGE_ID, TEST_SECRET, FakeConn, payment_row, paystack_tx,
)

HEADERS = {"X-Donor-Hash": DONOR}

DONATION_ROW = {"id": DONATION_ID, "amount_pence": 250_000, "status": "unpaid"}
PLEDGE_ROW = {"id": PLEDGE_ID, "max_value_pence": 500_000, "status": "awaiting_match", "payment_status": "unpaid"}

SELECT_DONATION = "FROM donor_contributions WHERE id = $1 AND donor_hash"
SELECT_PLEDGE = "FROM pledges WHERE id = $1 AND donor_hash"
SELECT_PENDING = "AS stale"
INSERT_PAYMENT = "INSERT INTO paystack_payments"
CLOSE_PAYMENT = "UPDATE paystack_payments SET status = $2"


@pytest.fixture(autouse=True)
def _settings(monkeypatch):
    monkeypatch.setattr(settings, "paystack_secret_key", TEST_SECRET)
    monkeypatch.setattr(settings, "paystack_currency", "KES")
    monkeypatch.setattr(
        settings, "paystack_callback_url", "http://localhost:3000/mutual-circle/donor/payment-return",
    )


@pytest.fixture(autouse=True)
def _no_rate_limit():
    with patch("mtc.routes.donors.check_ip_rate_limit", new_callable=AsyncMock), \
         patch("mtc.routes.pledges.check_ip_rate_limit", new_callable=AsyncMock):
        yield


@pytest.fixture
def conn():
    return FakeConn()


@pytest.fixture
async def client(conn):
    app.dependency_overrides[get_conn] = lambda: conn
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def init(conn):
    """Patched initialize_transaction that logs into conn.log, to check ordering."""
    async def fake(**kw):
        conn.log.append(("paystack.initialize", "", (kw["reference"],)))
        return {"authorization_url": CHECKOUT_URL, "access_code": "ac", "reference": kw["reference"]}

    with patch("mtc.paystack.payments.initialize_transaction", new_callable=AsyncMock) as m:
        m.side_effect = fake
        yield m


def _happy(conn, *, target_select=SELECT_DONATION, target_row=DONATION_ROW):
    conn.fetchrow_map.update({target_select: target_row, SELECT_PENDING: None})


# ─── donations ──────────────────────────────────────────────────────────────

async def test_donation_pay_happy_path(client, conn, init):
    _happy(conn)

    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS, json={})

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["authorization_url"] == CHECKOUT_URL
    assert body["reference"].startswith("mc-don-")

    kw = init.await_args.kwargs
    assert kw["reference"] == body["reference"]
    assert kw["amount_minor"] == 250_000
    assert kw["currency"] == "KES"
    assert kw["callback_url"] == "http://localhost:3000/mutual-circle/donor/payment-return"
    assert kw["metadata"]["cancel_action"].endswith(f"?reference={body['reference']}")
    assert kw["email"].endswith("@example.com")
    assert DONOR not in kw["email"]

    # pending row saved with the same reference and amount
    insert = next(e for e in conn.log if INSERT_PAYMENT in e[1])
    assert insert[2][:6] == (body["reference"], "donor_contributions", DONATION_ID, DONOR, 250_000, "KES")
    assert conn.ran("UPDATE donor_contributions SET status = 'pending_payment'")


async def test_donation_pay_saves_record_before_calling_paystack(client, conn, init):
    _happy(conn)
    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)
    assert r.status_code == 200, r.text

    order = [e[0] if e[0] == "paystack.initialize" else e[1] for e in conn.log]
    insert_at = next(i for i, s in enumerate(order) if INSERT_PAYMENT in s)
    init_at = order.index("paystack.initialize")
    assert insert_at < init_at


async def test_donation_pay_uses_donor_email_when_given(client, conn, init):
    _happy(conn)
    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS, json={"email": "me@example.com"})
    assert r.status_code == 200, r.text
    assert init.await_args.kwargs["email"] == "me@example.com"
    # the email is passed through only, never stored
    assert "me@example.com" not in repr(conn.log)


async def test_donation_pay_rejects_bad_email(client, conn, init):
    _happy(conn)
    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS, json={"email": "not-an-email"})
    assert r.status_code == 422
    init.assert_not_awaited()


async def test_donation_pay_blocked_while_in_progress(client, conn, init):
    conn.fetchrow_map.update({
        SELECT_DONATION: {**DONATION_ROW, "status": "pending_payment"},
        SELECT_PENDING: payment_row(stale=False),
    })
    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)
    assert r.status_code == 409
    assert "in progress" in r.json()["reason"]
    init.assert_not_awaited()
    assert not conn.ran(INSERT_PAYMENT)


async def test_donation_pay_concurrent_insert_loses_race(client, conn, init):
    """Partial unique index: the second pending row for a target fails."""
    _happy(conn)
    conn.execute_map[INSERT_PAYMENT] = asyncpg.UniqueViolationError("duplicate key")
    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)
    assert r.status_code == 409
    init.assert_not_awaited()


async def test_donation_pay_stale_pending_abandoned_allows_new(client, conn, init):
    old = payment_row("mc-don-old", stale=True)
    conn.fetchrow_map.update({
        SELECT_DONATION: DONATION_ROW,
        SELECT_PENDING: old,
        CLOSE_PAYMENT: {"target_table": "donor_contributions", "target_id": DONATION_ID},
    })
    with patch("mtc.paystack.payments.verify_transaction", new_callable=AsyncMock) as verify:
        verify.return_value = paystack_tx("mc-don-old", status="abandoned")
        r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)

    assert r.status_code == 200, r.text
    verify.assert_awaited_once_with("mc-don-old")
    close = next(e for e in conn.log if CLOSE_PAYMENT in e[1])
    assert close[2] == ("mc-don-old", "abandoned")
    init.assert_awaited_once()


async def test_donation_pay_stale_pending_that_actually_paid(client, conn, init):
    """A stale checkout Paystack says succeeded is recorded, not replaced."""
    conn.fetchrow_map.update({
        SELECT_DONATION: DONATION_ROW,
        SELECT_PENDING: payment_row("mc-don-old", stale=True),
        "SET status = 'paid'": {"target_table": "donor_contributions", "target_id": DONATION_ID},
    })
    with patch("mtc.paystack.payments.verify_transaction", new_callable=AsyncMock) as verify:
        verify.return_value = paystack_tx("mc-don-old")
        r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)

    assert r.status_code == 409
    assert conn.ran("UPDATE donor_contributions SET status = 'paid'")
    init.assert_not_awaited()


async def test_donation_pay_already_paid(client, conn, init):
    conn.fetchrow_map[SELECT_DONATION] = {**DONATION_ROW, "status": "paid"}
    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)
    assert r.status_code == 409
    init.assert_not_awaited()


async def test_donation_pay_not_found(client, conn, init):
    conn.fetchrow_map[SELECT_DONATION] = None
    r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)
    assert r.status_code == 404
    init.assert_not_awaited()


async def test_donation_pay_bad_id_is_404(client, conn, init):
    r = await client.post("/donations/not-a-uuid/pay", headers=HEADERS)
    assert r.status_code == 404
    assert conn.log == []


async def test_donation_pay_paystack_down_closes_payment(client, conn):
    _happy(conn)
    conn.fetchrow_map[CLOSE_PAYMENT] = {"target_table": "donor_contributions", "target_id": DONATION_ID}
    with patch("mtc.paystack.payments.initialize_transaction", new_callable=AsyncMock) as m:
        m.side_effect = PaystackError("Paystack initialize failed (HTTP 503): down", 503)
        r = await client.post(f"/donations/{DONATION_ID}/pay", headers=HEADERS)

    assert r.status_code == 503
    close = next(e for e in conn.log if CLOSE_PAYMENT in e[1])
    assert close[2][1] == "failed"  # the lock is released so the donor can retry
    assert conn.ran("SET status = 'payment_failed'")


async def test_donation_pay_idempotent_replay(client, conn, init):
    """Same Idempotency-Key returns the first response, no second checkout."""
    cached = {"ok": True, "reference": "mc-don-first", "authorization_url": CHECKOUT_URL}

    async def claimed_by_someone_else(sql, *args):
        conn.log.append(("fetchval", sql, args))
        return None
    conn.fetchval = claimed_by_someone_else
    conn.fetchrow_map["FROM idempotency_keys"] = {"response_body": cached, "created_at": None}

    r = await client.post(
        f"/donations/{DONATION_ID}/pay", headers={**HEADERS, "Idempotency-Key": "k-1"},
    )
    assert r.status_code == 200
    assert r.json() == cached
    init.assert_not_awaited()


# ─── pledges ────────────────────────────────────────────────────────────────

async def test_pledge_pay_happy_path(client, conn, init):
    _happy(conn, target_select=SELECT_PLEDGE, target_row=PLEDGE_ROW)

    r = await client.post(f"/pledges/{PLEDGE_ID}/pay", headers=HEADERS, json={})

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["authorization_url"] == CHECKOUT_URL
    assert body["reference"].startswith("mc-plg-")
    assert init.await_args.kwargs["amount_minor"] == 500_000

    insert = next(e for e in conn.log if INSERT_PAYMENT in e[1])
    assert insert[2][1:3] == ("pledges", PLEDGE_ID)
    # payment only touches payment_status, never the match status column
    assert conn.ran("UPDATE pledges SET payment_status = 'pending_payment'")
    assert not conn.ran("UPDATE pledges SET status")


async def test_pledge_pay_without_value_is_400(client, conn, init):
    conn.fetchrow_map[SELECT_PLEDGE] = {**PLEDGE_ROW, "max_value_pence": None}
    r = await client.post(f"/pledges/{PLEDGE_ID}/pay", headers=HEADERS)
    assert r.status_code == 400
    init.assert_not_awaited()


async def test_pledge_pay_already_paid(client, conn, init):
    conn.fetchrow_map[SELECT_PLEDGE] = {**PLEDGE_ROW, "payment_status": "paid"}
    r = await client.post(f"/pledges/{PLEDGE_ID}/pay", headers=HEADERS)
    assert r.status_code == 409
    init.assert_not_awaited()


async def test_pledge_pay_blocked_while_in_progress(client, conn, init):
    conn.fetchrow_map.update({
        SELECT_PLEDGE: {**PLEDGE_ROW, "payment_status": "pending_payment"},
        SELECT_PENDING: payment_row("mc-plg-1", target_table="pledges", target_id=PLEDGE_ID, stale=False),
    })
    r = await client.post(f"/pledges/{PLEDGE_ID}/pay", headers=HEADERS)
    assert r.status_code == 409
    init.assert_not_awaited()


# ─── removed routes stay removed ────────────────────────────────────────────

async def test_requester_self_pay_route_is_gone(client):
    r = await client.post(
        "/requests/00000000-0000-0000-0000-000000000001/pay",
        headers={"X-Token": "x" * 64}, json={"phone": "+254711000001"},
    )
    assert r.status_code in (404, 405)


async def test_mpesa_callback_route_is_gone(client):
    r = await client.post("/mpesa/stk/callback", json={})
    assert r.status_code == 404
