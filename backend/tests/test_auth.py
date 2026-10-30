"""Auth tests — bcrypt verify, JWT lifecycle, role enforcement."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from mtc.auth.staff import authenticate, verify_pin
from mtc.config import settings
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
        await conn.execute("TRUNCATE staff_sessions, audit_log RESTART IDENTITY CASCADE")
    yield


def test_bcrypt_verify_correct_pin():
    assert verify_pin("7355", settings.staff_fulf_pin_hash)


def test_bcrypt_verify_wrong_pin():
    assert not verify_pin("9999", settings.staff_fulf_pin_hash)


def test_authenticate_correct():
    assert authenticate("fulfilment", "FULF-08", "7355") is not None


def test_authenticate_wrong_role():
    # Enrolment PIN submitted under Fulfilment role → fails at ID check
    assert authenticate("fulfilment", "ENROL-04", "4821") is None


def test_authenticate_wrong_pin():
    assert authenticate("fulfilment", "FULF-08", "0000") is None


async def test_login_success(client, clean_db):
    resp = await client.post("/staff/login", json={
        "role": "fulfilment", "staff_id": "FULF-08", "pin": "7355"
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "session_token" in body
    assert body["expires_at"]
    assert body["session_id"]


async def test_login_wrong_pin(client, clean_db):
    resp = await client.post("/staff/login", json={
        "role": "fulfilment", "staff_id": "FULF-08", "pin": "0000"
    })
    assert resp.status_code == 401


async def test_session_endpoint(client, clean_db):
    login = await client.post("/staff/login", json={
        "role": "audit", "staff_id": "AUDIT-02", "pin": "9142"
    })
    token = login.json()["session_token"]
    resp = await client.get("/staff/session", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "audit"


async def test_logout_revokes_session(client, clean_db):
    login = await client.post("/staff/login", json={
        "role": "fulfilment", "staff_id": "FULF-08", "pin": "7355"
    })
    token = login.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    assert (await client.get("/staff/session", headers=headers)).status_code == 200
    assert (await client.post("/staff/logout", headers=headers)).status_code == 200
    assert (await client.get("/staff/session", headers=headers)).status_code == 401


async def test_role_enforcement(client, clean_db):
    login = await client.post("/staff/login", json={
        "role": "audit", "staff_id": "AUDIT-02", "pin": "9142"
    })
    token = login.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Audit cannot hit fulfilment endpoints
    assert (await client.get("/fulfilment/queue", headers=headers)).status_code == 403
    # Audit can hit audit endpoints
    assert (await client.get("/audit/ocr-queue", headers=headers)).status_code == 200