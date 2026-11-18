"""mtc.paystack.client — no network, no DB.

httpx is mocked with httpx.MockTransport via the client's ``_transport``
seam, so every request the client builds is inspected for real.
"""
import json

import httpx
import pytest

from mtc.config import settings
from mtc.paystack import client as paystack
from mtc.paystack.client import PaystackError
from mtc.paystack.payments import checkout_email

from tests.paystack_fakes import TEST_SECRET


@pytest.fixture(autouse=True)
def _configured(monkeypatch):
    monkeypatch.setattr(settings, "paystack_secret_key", TEST_SECRET)
    monkeypatch.setattr(settings, "paystack_currency", "KES")


@pytest.fixture
def mock_paystack(monkeypatch):
    """Install a handler; returns the list of requests it received."""
    seen: list[httpx.Request] = []

    def install(handler):
        def _record(request: httpx.Request) -> httpx.Response:
            seen.append(request)
            return handler(request)
        monkeypatch.setattr(paystack, "_transport", httpx.MockTransport(_record))
        return seen

    return install


def _ok(data: dict) -> httpx.Response:
    return httpx.Response(200, json={"status": True, "message": "ok", "data": data})


# ─── initialize_transaction ────────────────────────────────────────────────

async def test_initialize_sends_expected_request(mock_paystack):
    seen = mock_paystack(lambda req: _ok({
        "authorization_url": "https://checkout.paystack.com/abc",
        "access_code": "abc",
        "reference": "mc-don-1",
    }))

    out = await paystack.initialize_transaction(
        email="donor-x@example.com",
        amount_minor=250_000,
        reference="mc-don-1",
        callback_url="http://localhost:3000/mutual-circle/donor/payment-return",
    )

    assert out == {
        "authorization_url": "https://checkout.paystack.com/abc",
        "access_code": "abc",
        "reference": "mc-don-1",
    }
    assert len(seen) == 1
    req = seen[0]
    assert req.method == "POST"
    assert str(req.url) == "https://api.paystack.co/transaction/initialize"
    assert req.headers["authorization"] == f"Bearer {TEST_SECRET}"
    body = json.loads(req.content)
    assert body == {
        "email": "donor-x@example.com",
        "amount": 250_000,  # lowest unit, passed through untouched
        "currency": "KES",
        "reference": "mc-don-1",
        "callback_url": "http://localhost:3000/mutual-circle/donor/payment-return",
    }


async def test_initialize_uses_currency_setting(mock_paystack, monkeypatch):
    monkeypatch.setattr(settings, "paystack_currency", "ngn")
    seen = mock_paystack(lambda req: _ok({"authorization_url": "https://checkout.paystack.com/x"}))

    await paystack.initialize_transaction(
        email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
    )
    assert json.loads(seen[0].content)["currency"] == "NGN"


async def test_initialize_passes_metadata(mock_paystack):
    seen = mock_paystack(lambda req: _ok({"authorization_url": "https://checkout.paystack.com/x"}))
    await paystack.initialize_transaction(
        email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
        metadata={"cancel_action": "http://x/cb?reference=r1"},
    )
    assert json.loads(seen[0].content)["metadata"] == {"cancel_action": "http://x/cb?reference=r1"}


async def test_initialize_rejected_by_paystack(mock_paystack):
    mock_paystack(lambda req: httpx.Response(401, json={"status": False, "message": "Invalid key"}))
    with pytest.raises(PaystackError) as exc:
        await paystack.initialize_transaction(
            email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
        )
    assert exc.value.status_code == 401
    assert "Invalid key" in str(exc.value)


async def test_initialize_status_false_with_200(mock_paystack):
    mock_paystack(lambda req: httpx.Response(200, json={"status": False, "message": "Duplicate reference"}))
    with pytest.raises(PaystackError, match="Duplicate reference"):
        await paystack.initialize_transaction(
            email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
        )


async def test_initialize_requires_https_authorization_url(mock_paystack):
    mock_paystack(lambda req: _ok({"authorization_url": "http://evil.example/checkout"}))
    with pytest.raises(PaystackError, match="authorization_url"):
        await paystack.initialize_transaction(
            email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
        )


async def test_initialize_non_json_reply(mock_paystack):
    mock_paystack(lambda req: httpx.Response(502, text="<html>Bad gateway</html>"))
    with pytest.raises(PaystackError) as exc:
        await paystack.initialize_transaction(
            email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
        )
    assert exc.value.status_code == 502


async def test_initialize_network_error(mock_paystack):
    def boom(req):
        raise httpx.ConnectError("connection refused", request=req)
    mock_paystack(boom)
    with pytest.raises(PaystackError, match="network error"):
        await paystack.initialize_transaction(
            email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
        )


async def test_initialize_without_secret_makes_no_request(mock_paystack, monkeypatch):
    monkeypatch.setattr(settings, "paystack_secret_key", "")
    seen = mock_paystack(lambda req: _ok({}))
    with pytest.raises(PaystackError, match="PAYSTACK_SECRET_KEY"):
        await paystack.initialize_transaction(
            email="a@b.co", amount_minor=100, reference="r1", callback_url="http://x/cb",
        )
    assert seen == []


@pytest.mark.parametrize("amount", [0, -5])
async def test_initialize_rejects_non_positive_amount(mock_paystack, amount):
    seen = mock_paystack(lambda req: _ok({}))
    with pytest.raises(ValueError):
        await paystack.initialize_transaction(
            email="a@b.co", amount_minor=amount, reference="r1", callback_url="http://x/cb",
        )
    assert seen == []


# ─── verify_transaction ─────────────────────────────────────────────────────

async def test_verify_returns_data(mock_paystack):
    data = {"status": "success", "reference": "mc-don-1", "amount": 250_000, "currency": "KES"}
    seen = mock_paystack(lambda req: _ok(data))

    out = await paystack.verify_transaction("mc-don-1")

    assert out == data
    assert seen[0].method == "GET"
    assert str(seen[0].url) == "https://api.paystack.co/transaction/verify/mc-don-1"
    assert seen[0].headers["authorization"] == f"Bearer {TEST_SECRET}"


async def test_verify_escapes_reference(mock_paystack):
    seen = mock_paystack(lambda req: _ok({"status": "success"}))
    await paystack.verify_transaction("a/../b")
    assert seen[0].url.raw_path == b"/transaction/verify/a%2F..%2Fb"


async def test_verify_not_found(mock_paystack):
    mock_paystack(lambda req: httpx.Response(
        400, json={"status": False, "message": "Transaction reference not found"},
    ))
    with pytest.raises(PaystackError) as exc:
        await paystack.verify_transaction("nope")
    assert exc.value.status_code == 400


async def test_verify_error_does_not_leak_body(mock_paystack):
    """Errors carry Paystack's message only, never the data object (PII)."""
    mock_paystack(lambda req: httpx.Response(500, json={
        "status": False, "message": "Server error",
        "data": {"customer": {"email": "real.person@example.com"}},
    }))
    with pytest.raises(PaystackError) as exc:
        await paystack.verify_transaction("mc-don-1")
    assert "real.person@example.com" not in str(exc.value)


# ─── email placeholder ──────────────────────────────────────────────────────

def test_placeholder_email_format():
    assert paystack.placeholder_email("ABC123") == "donor-abc123@example.com"


def test_checkout_email_prefers_real_email():
    assert checkout_email("donor-hash-1", "me@example.com") == "me@example.com"


def test_checkout_email_placeholder_does_not_contain_donor_hash():
    """X-Donor-Hash is a credential; it must not be sent to Paystack."""
    email = checkout_email("donor-k3yq9x2z", None)
    assert email.endswith("@example.com")
    assert "k3yq9x2z" not in email
    assert email == checkout_email("donor-k3yq9x2z", None)  # stable per donor
    assert email != checkout_email("donor-other", None)
