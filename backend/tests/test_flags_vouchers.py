"""Day 5 tests — flags, vouchers, partner till, enrolment."""
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
            "TRUNCATE requests, ledger_entries, audit_log, staff_sessions, "
            "risk_flags, vouchers, voucher_redemptions, rate_counters RESTART IDENTITY CASCADE"
        )
    yield


async def _audit_headers(client):
    r = await client.post("/staff/login", json={"role": "audit", "staff_id": "AUDIT-02", "pin": "9142"})
    return {"Authorization": f"Bearer {r.json()['session_token']}"}


async def _fulf_headers(client):
    r = await client.post("/staff/login", json={"role": "fulfilment", "staff_id": "FULF-08", "pin": "7355"})
    return {"Authorization": f"Bearer {r.json()['session_token']}"}


# --- Flags -------------------------------------------------------------------

async def test_flags_list(client, clean_db):
    h = await _audit_headers(client)
    r = await client.get("/audit/flags", headers=h)
    assert r.status_code == 200
    assert "flags" in r.json()


async def test_flag_route_tier4(client, clean_db):
    h = await _audit_headers(client)
    # Create a flag directly (no endpoint to create)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO risk_flags (target_hash, severity, title, description) VALUES ('obj #test','high','Test flag','desc') RETURNING id"
        )
        flag_id = str(row["id"])
    r = await client.post(f"/audit/flags/{flag_id}/route-tier4", headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "routed_tier4"


async def test_flag_clear(client, clean_db):
    h = await _audit_headers(client)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO risk_flags (target_hash, severity, title, description) VALUES ('obj #test2','routine','Test','d') RETURNING id"
        )
        flag_id = str(row["id"])
    r = await client.post(
        f"/audit/flags/{flag_id}/clear",
        headers=h, json={"note": "Shared-meter household"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "cleared_false_positive"


# --- Vouchers ----------------------------------------------------------------

async def _create_verified_pool(client, phone="+254700111222", amount=350000):
    tok = (await client.post("/tokens", json={"phone": phone})).json()["token"]
    r = await client.post(
        "/requests/pool",
        headers={"X-Token": tok}, json={
            "category": "utility",
            "hashed_object_id": "objhash-test-" + phone[-4:],
            "amount_pence": amount,
        },
    )
    return tok, r.json()["id"]


async def test_issue_voucher(client, clean_db):
    _, request_id = await _create_verified_pool(client)
    h = await _fulf_headers(client)
    r = await client.post(
        f"/fulfilment/requests/{request_id}/voucher",
        headers=h, json={"partner_name": "Naivas Kibera", "partner_type": "retailer"},
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body["pin"]) == 4
    assert body["pin"].isdigit()
    assert body["partner_name"] == "Naivas Kibera"


async def test_redeem_voucher_success(client, clean_db):
    _, request_id = await _create_verified_pool(client)
    h = await _fulf_headers(client)
    issue = await client.post(
        f"/fulfilment/requests/{request_id}/voucher",
        headers=h, json={"partner_name": "Naivas Kibera", "partner_type": "retailer"},
    )
    pin = issue.json()["pin"]
    r = await client.post(
        "/partner/redeem",
        json={"pin": pin, "partner_name": "Naivas Kibera", "amount_pence": 300000},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


async def test_redeem_wrong_partner(client, clean_db):
    _, request_id = await _create_verified_pool(client)
    h = await _fulf_headers(client)
    issue = await client.post(
        f"/fulfilment/requests/{request_id}/voucher",
        headers=h, json={"partner_name": "Naivas Kibera", "partner_type": "retailer"},
    )
    pin = issue.json()["pin"]
    r = await client.post(
        "/partner/redeem",
        json={"pin": pin, "partner_name": "Different Partner", "amount_pence": 300000},
    )
    assert r.json()["ok"] is False


async def test_redeem_twice(client, clean_db):
    _, request_id = await _create_verified_pool(client)
    h = await _fulf_headers(client)
    issue = await client.post(
        f"/fulfilment/requests/{request_id}/voucher",
        headers=h, json={"partner_name": "Naivas Kibera", "partner_type": "retailer"},
    )
    pin = issue.json()["pin"]
    r1 = await client.post("/partner/redeem", json={"pin": pin, "partner_name": "Naivas Kibera", "amount_pence": 100000})
    assert r1.json()["ok"] is True
    r2 = await client.post("/partner/redeem", json={"pin": pin, "partner_name": "Naivas Kibera", "amount_pence": 100000})
    assert r2.json()["ok"] is False
    assert "already" in r2.json()["reason"].lower()


async def test_redeem_exceeds_value(client, clean_db):
    _, request_id = await _create_verified_pool(client, amount=350000)  # 3,500 KES
    h = await _fulf_headers(client)
    issue = await client.post(
        f"/fulfilment/requests/{request_id}/voucher",
        headers=h, json={"partner_name": "Naivas Kibera", "partner_type": "retailer"},
    )
    pin = issue.json()["pin"]
    r = await client.post("/partner/redeem", json={"pin": pin, "partner_name": "Naivas Kibera", "amount_pence": 500000})
    assert r.json()["ok"] is False


async def test_requester_lists_vouchers(client, clean_db):
    tok, request_id = await _create_verified_pool(client)
    h = await _fulf_headers(client)
    await client.post(
        f"/fulfilment/requests/{request_id}/voucher",
        headers=h, json={"partner_name": "Naivas Kibera", "partner_type": "retailer"},
    )
    r = await client.get("/requests/vouchers/mine", headers={"X-Token": tok})
    assert r.status_code == 200
    assert len(r.json()["vouchers"]) == 1
    assert r.json()["vouchers"][0]["partner_name"] == "Naivas Kibera"


# --- Enrolment ---------------------------------------------------------------

async def test_enrolment_metrics(client, clean_db):
    r = await client.post("/staff/login", json={"role": "enrolment", "staff_id": "ENROL-04", "pin": "4821"})
    h = {"Authorization": f"Bearer {r.json()['session_token']}"}
    resp = await client.get("/enrolment/metrics", headers=h)
    assert resp.status_code == 200
    body = resp.json()
    assert "tokens_today" in body
    assert "channels" in body