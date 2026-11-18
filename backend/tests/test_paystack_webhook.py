"""POST /paystack/webhook and GET /payments/verify/{reference} — no DB, no network.

Webhook contract under test:
  * HMAC-SHA512 signature over the raw body, else 401 (before any DB use)
  * only charge.success is acted on, and only after verify_transaction
    confirms reference, amount and currency
  * idempotent: duplicates change nothing
  * a failed or forged event can never block the genuine success
  * unexpected errors -> 500 so Paystack retries
  * no emails or phone numbers in logs
"""
import logging
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from mtc.config import settings
from mtc.db.main import get_conn
from mtc.main import app
from mtc.paystack.client import PaystackError

from tests.paystack_fakes import (
    DONATION_ID, DONOR, PLEDGE_ID, TEST_SECRET, FakeConn, charge_success,
    payment_row, paystack_tx, sign, webhook_request,
)

REF = "mc-don-abc123"
GET_PAYMENT = "FROM paystack_payments WHERE reference = $1"
MARK_PAID = "SET status = 'paid'"
CLOSE_PAYMENT = "UPDATE paystack_payments SET status = $2"
PAID_ROW = {"target_table": "donor_contributions", "target_id": DONATION_ID}


@pytest.fixture(autouse=True)
def _secret(monkeypatch):
    monkeypatch.setattr(settings, "paystack_secret_key", TEST_SECRET)


@pytest.fixture
def conn():
    return FakeConn()


@pytest.fixture
def conn_used():
    return {"count": 0}


@pytest.fixture
async def client(conn, conn_used):
    def _get_conn():
        conn_used["count"] += 1
        return conn

    app.dependency_overrides[get_conn] = _get_conn
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def verify():
    with patch("mtc.routes.payments.verify_transaction", new_callable=AsyncMock) as m:
        yield m


async def _post(client, event, *, secret=TEST_SECRET, signature=None):
    raw, headers = webhook_request(event, secret)
    if signature is not None:
        headers["x-paystack-signature"] = signature
    return await client.post("/paystack/webhook", content=raw, headers=headers)


# ─── signature ──────────────────────────────────────────────────────────────

async def test_valid_signature_marks_donation_paid(client, conn, verify):
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF), MARK_PAID: PAID_ROW})
    verify.return_value = paystack_tx(REF)

    r = await _post(client, charge_success(REF))

    assert r.status_code == 200, r.text
    assert r.json() == {"status": "paid"}
    verify.assert_awaited_once_with(REF)
    paid = next(e for e in conn.log if MARK_PAID in e[1])
    assert paid[2] == (REF, 4099260516, "card")
    assert conn.ran("UPDATE donor_contributions SET status = 'paid'")


async def test_valid_signature_marks_pledge_payment_status_only(client, conn, verify):
    conn.fetchrow_map.update({
        GET_PAYMENT: payment_row("mc-plg-1", target_table="pledges", target_id=PLEDGE_ID, amount_pence=500_000),
        MARK_PAID: {"target_table": "pledges", "target_id": PLEDGE_ID},
    })
    verify.return_value = paystack_tx("mc-plg-1", amount=500_000)

    r = await _post(client, charge_success("mc-plg-1", 500_000))

    assert r.json() == {"status": "paid"}
    assert conn.ran("UPDATE pledges SET payment_status = 'paid'")
    assert not conn.ran("UPDATE pledges SET status")


async def test_invalid_signature_is_401_and_touches_nothing(client, conn, conn_used, verify):
    r = await _post(client, charge_success(REF), secret="sk_test_wrong_key")
    assert r.status_code == 401
    assert conn_used["count"] == 0  # rejected before a DB connection is taken
    assert conn.log == []
    verify.assert_not_awaited()


async def test_missing_signature_is_401(client, conn_used, verify):
    raw, _ = webhook_request(charge_success(REF))
    r = await client.post("/paystack/webhook", content=raw, headers={"Content-Type": "application/json"})
    assert r.status_code == 401
    assert conn_used["count"] == 0
    verify.assert_not_awaited()


async def test_signature_must_cover_exact_body(client, conn_used, verify):
    """Re-serialising the JSON (e.g. spacing) breaks the signature."""
    raw, headers = webhook_request(charge_success(REF))
    tampered = raw.replace(b'"amount": 250000', b'"amount": 1')
    assert tampered != raw
    r = await client.post("/paystack/webhook", content=tampered, headers=headers)
    assert r.status_code == 401
    assert conn_used["count"] == 0


async def test_unconfigured_secret_is_500(client, conn_used, monkeypatch):
    monkeypatch.setattr(settings, "paystack_secret_key", "")
    raw, _ = webhook_request(charge_success(REF))
    # An attacker could compute HMAC with an empty key; must never be accepted.
    r = await client.post("/paystack/webhook", content=raw, headers={"x-paystack-signature": sign(raw, "")})
    assert r.status_code == 500
    assert conn_used["count"] == 0


# ─── idempotency ────────────────────────────────────────────────────────────

async def test_duplicate_event_for_paid_payment_does_nothing(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = payment_row(REF, status="paid")

    r = await _post(client, charge_success(REF))

    assert r.status_code == 200
    assert r.json() == {"status": "duplicate"}
    verify.assert_not_awaited()
    assert not conn.ran("UPDATE")


async def test_duplicate_racing_another_delivery_does_nothing(client, conn, verify):
    """Both deliveries read 'pending'; the conditional UPDATE lets only one win."""
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF), MARK_PAID: None})
    verify.return_value = paystack_tx(REF)

    r = await _post(client, charge_success(REF))

    assert r.json() == {"status": "duplicate"}
    assert not conn.ran("UPDATE donor_contributions")


async def test_success_after_failed_attempt_still_marks_paid(client, conn, verify):
    """A failed payment row never blocks a later genuine success."""
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF, status="failed"), MARK_PAID: PAID_ROW})
    verify.return_value = paystack_tx(REF)

    r = await _post(client, charge_success(REF))

    assert r.json() == {"status": "paid"}
    sql = next(e[1] for e in conn.log if MARK_PAID in e[1])
    assert "status <> 'paid'" in sql  # failed/abandoned rows are upgradable


# ─── verification against Paystack ──────────────────────────────────────────

async def test_amount_mismatch_is_not_marked_paid(client, conn, verify):
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF, amount_pence=250_000), MARK_PAID: PAID_ROW})
    verify.return_value = paystack_tx(REF, amount=100)  # paid KES 1 for a KES 2,500 donation

    r = await _post(client, charge_success(REF, amount=250_000))

    assert r.status_code == 200
    assert r.json() == {"status": "rejected"}
    assert not conn.ran("UPDATE")


async def test_mismatch_does_not_block_the_real_payment(client, conn, verify):
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF), MARK_PAID: PAID_ROW})

    verify.return_value = paystack_tx(REF, amount=100)
    first = await _post(client, charge_success(REF))
    assert first.json() == {"status": "rejected"}

    verify.return_value = paystack_tx(REF)
    second = await _post(client, charge_success(REF))
    assert second.json() == {"status": "paid"}


async def test_event_body_is_not_trusted_only_verify_counts(client, conn, verify):
    """A signed charge.success is not enough on its own: Paystack's verify
    reply decides. A non-success reply changes nothing (no 'failed' write)."""
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF), MARK_PAID: PAID_ROW})
    verify.return_value = paystack_tx(REF, status="failed")

    r = await _post(client, charge_success(REF))

    assert r.json() == {"status": "pending"}
    assert not conn.ran("UPDATE")  # webhook never records failures


@pytest.mark.parametrize("tx, label", [
    (paystack_tx(REF, currency="NGN"), "currency"),
    (paystack_tx("mc-don-someone-else"), "reference"),
    (paystack_tx(REF, amount="250000"), "amount type"),
])
async def test_other_mismatches_are_rejected(client, conn, verify, tx, label):
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF), MARK_PAID: PAID_ROW})
    verify.return_value = tx
    r = await _post(client, charge_success(REF))
    assert r.json() == {"status": "rejected"}, label
    assert not conn.ran("UPDATE")


async def test_non_success_events_are_ignored(client, conn, verify):
    event = charge_success(REF)
    event["event"] = "charge.failed"
    r = await _post(client, event)
    assert r.json() == {"status": "ignored"}
    assert conn.log == []
    verify.assert_not_awaited()


async def test_unknown_reference_is_acknowledged(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = None
    r = await _post(client, charge_success("mc-don-not-ours"))
    assert r.status_code == 200
    assert r.json() == {"status": "unknown_reference"}
    verify.assert_not_awaited()


# ─── errors -> 500 so Paystack retries ──────────────────────────────────────

async def test_paystack_unreachable_returns_500(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = payment_row(REF)
    verify.side_effect = PaystackError("Paystack verify: network error (ConnectError)")
    r = await _post(client, charge_success(REF))
    assert r.status_code == 500
    assert not conn.ran("UPDATE")


async def test_db_error_returns_500(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = RuntimeError("connection reset")
    r = await _post(client, charge_success(REF))
    assert r.status_code == 500


async def test_bad_json_with_valid_signature_is_400(client, conn_used):
    raw = b"not json"
    r = await client.post("/paystack/webhook", content=raw, headers={"x-paystack-signature": sign(raw)})
    assert r.status_code == 400
    assert conn_used["count"] == 0


# ─── logging hygiene ────────────────────────────────────────────────────────

async def test_logs_contain_no_email_or_phone(client, conn, verify, caplog):
    caplog.set_level(logging.DEBUG)
    conn.fetchrow_map.update({GET_PAYMENT: payment_row(REF), MARK_PAID: PAID_ROW})

    verify.return_value = paystack_tx(REF, amount=1)      # rejected path logs an error
    await _post(client, charge_success(REF))
    verify.return_value = paystack_tx(REF)                # paid path logs info
    await _post(client, charge_success(REF))
    verify.side_effect = PaystackError("boom")            # 500 path logs an error
    await _post(client, charge_success(REF))

    assert "real.person@example.com" not in caplog.text
    assert "254711000001" not in caplog.text
    assert "4081" not in caplog.text


# ─── GET /payments/verify/{reference} ───────────────────────────────────────

async def test_verify_endpoint_confirms_with_paystack(client, conn, verify):
    rows = [payment_row(REF), payment_row(REF, status="paid")]
    conn.fetchrow_map.update({GET_PAYMENT: lambda *a: rows.pop(0), MARK_PAID: PAID_ROW})
    verify.return_value = paystack_tx(REF)

    r = await client.get(f"/payments/verify/{REF}", headers={"X-Donor-Hash": DONOR})

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "paid"
    assert body["kind"] == "donation"
    assert body["amount_pence"] == 250_000
    verify.assert_awaited_once_with(REF)


async def test_verify_endpoint_paid_does_not_call_paystack(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = payment_row(REF, status="paid")
    r = await client.get(f"/payments/verify/{REF}", headers={"X-Donor-Hash": DONOR})
    assert r.json()["status"] == "paid"
    verify.assert_not_awaited()


async def test_verify_endpoint_failed_releases_target(client, conn, verify):
    rows = [payment_row(REF), payment_row(REF, status="failed")]
    conn.fetchrow_map.update({GET_PAYMENT: lambda *a: rows.pop(0), CLOSE_PAYMENT: PAID_ROW})
    verify.return_value = paystack_tx(REF, status="failed")

    r = await client.get(f"/payments/verify/{REF}", headers={"X-Donor-Hash": DONOR})

    assert r.json()["status"] == "failed"
    close = next(e for e in conn.log if CLOSE_PAYMENT in e[1])
    assert close[2] == (REF, "failed")


async def test_verify_endpoint_amount_mismatch_stays_pending(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = payment_row(REF)
    verify.return_value = paystack_tx(REF, amount=1)
    r = await client.get(f"/payments/verify/{REF}", headers={"X-Donor-Hash": DONOR})
    assert r.json()["status"] == "pending"
    assert not conn.ran("UPDATE")


async def test_verify_endpoint_other_donor_is_404(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = payment_row(REF)
    r = await client.get(f"/payments/verify/{REF}", headers={"X-Donor-Hash": "someone-else"})
    assert r.status_code == 404
    verify.assert_not_awaited()


async def test_verify_endpoint_unknown_reference_is_404(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = None
    r = await client.get("/payments/verify/mc-don-nope", headers={"X-Donor-Hash": DONOR})
    assert r.status_code == 404
    verify.assert_not_awaited()


async def test_verify_endpoint_paystack_down_is_503(client, conn, verify):
    conn.fetchrow_map[GET_PAYMENT] = payment_row(REF)
    verify.side_effect = PaystackError("down")
    r = await client.get(f"/payments/verify/{REF}", headers={"X-Donor-Hash": DONOR})
    assert r.status_code == 503
