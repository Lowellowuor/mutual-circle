"""Tests for the Chui locker webhook."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from mtc.config import settings
from mtc.db.main import get_pool
from mtc.main import app
from mtc.requests_.swap import create_swap
from mtc.tokens.hmac import issue_token


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
            "TRUNCATE requests, audit_log RESTART IDENTITY CASCADE"
        )
    yield


def _headers(secret="dev-chui-secret"):
    return {"X-Webhook-Secret": secret}


@pytest.mark.asyncio
async def test_chui_webhook_happy_path(client, clean_db):
    """A valid PIN webhook marks the swap as collected."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        token = issue_token("+254799111222")
        # Create a swap request (it generates a PIN automatically)
        created = await create_swap(
            conn, token_hash=token, bundle_category="Standard Pantry", locker_location="Kibera Hub"
        )
        # Force it to verified so it's ready for pickup
        await conn.execute("UPDATE requests SET status = 'verified' WHERE id = $1", created["id"])
        
        # Get the PIN we just generated
        pin_last4 = await conn.fetchval("SELECT pin_last4 FROM requests WHERE id = $1", created["id"])

    payload = {"pin_last4": pin_last4, "location": "Kibera Hub", "locker_id": "CHUI-04"}
    
    r = await client.post("/webhooks/chui", headers=_headers(), json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "collected"
    assert r.json()["request_id"] == created["id"]

    # Verify DB was updated
    async with pool.acquire() as conn:
        status = await conn.fetchval("SELECT status FROM requests WHERE id = $1", created["id"])
        assert status == "collected"


@pytest.mark.asyncio
async def test_chui_webhook_invalid_secret(client, clean_db):
    """Rejects if the secret is wrong."""
    payload = {"pin_last4": "1234", "location": "Kibera Hub"}
    r = await client.post("/webhooks/chui", headers=_headers(secret="wrong-secret"), json=payload)
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_chui_webhook_unknown_pin(client, clean_db):
    """Returns 404 if no verified swap matches the PIN."""
    payload = {"pin_last4": "9999", "location": "Kibera Hub"}
    r = await client.post("/webhooks/chui", headers=_headers(), json=payload)
    assert r.status_code == 404
