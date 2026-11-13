"""Phone encryption — unit + integration tests.

Guards against the 2026-11-13 finding that phone numbers sat in
mpesa_transactions.expected_phone as plaintext (payments review #9).
After migration 016, all phone storage is encrypted with Fernet,
and all verification uses HMAC-SHA256 hashes.
"""
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio

from mtc.crypto import decrypt_phone, encrypt_phone, hash_phone


# ---------------------------------------------------------------------------
# Crypto roundtrip
# ---------------------------------------------------------------------------

def test_encrypt_decrypt_roundtrip():
    plain = "+254711000001"
    ct = encrypt_phone(plain)
    assert ct != plain
    assert len(ct) > len(plain)
    assert decrypt_phone(ct) == plain


def test_encrypt_empty_returns_empty():
    assert encrypt_phone("") == ""
    assert decrypt_phone("") == ""


def test_encrypt_different_nonces_for_same_plaintext():
    ct1 = encrypt_phone("+254711000001")
    ct2 = encrypt_phone("+254711000001")
    assert ct1 != ct2  # Fernet uses random nonce
    assert decrypt_phone(ct1) == decrypt_phone(ct2)


def test_decrypt_with_wrong_key_raises():
    ct = encrypt_phone("+254711000001")
    # Corrupt the ciphertext
    corrupted = ct[:-4] + "AAAA"
    with pytest.raises(ValueError, match="decrypt"):
        decrypt_phone(corrupted)


# ---------------------------------------------------------------------------
# Hash determinism + normalization
# ---------------------------------------------------------------------------

def test_hash_is_deterministic():
    assert hash_phone("+254711000001") == hash_phone("+254711000001")


def test_hash_normalizes_formats():
    """+254..., 254..., 07..., and 7... all hash identically."""
    variants = ["+254711000001", "254711000001", "0711000001", "711000001"]
    hashes = {hash_phone(v) for v in variants}
    assert len(hashes) == 1, f"Different hashes for same phone: {hashes}"


def test_hash_different_for_different_phones():
    assert hash_phone("+254711000001") != hash_phone("+254711000002")


def test_hash_empty_returns_empty():
    assert hash_phone("") == ""


def test_hash_not_reversible():
    """Spot check: the hash doesn't contain any plaintext fragments."""
    h = hash_phone("+254711000001")
    assert "254" not in h
    assert "711" not in h
    assert len(h) == 64  # SHA-256 hex


# ---------------------------------------------------------------------------
# End-to-end: DB stores ciphertext, verification uses hash
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client():
    from httpx import ASGITransport, AsyncClient
    from mtc.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def clean_db():
    from mtc.db.main import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "TRUNCATE mpesa_transactions, requests, donor_contributions, pledges, "
            "idempotency_keys, rate_counters RESTART IDENTITY CASCADE"
        )
    yield


async def test_stk_writes_ciphertext_to_db(client, clean_db):
    """After STK init, expected_phone_encrypted is ciphertext, hash is set."""
    from mtc.db.main import get_pool
    from mtc.requests_.pool import create_pool
    from mtc.tokens.hmac import issue_token
    from mtc.crypto import decrypt_phone as _dec

    pool = await get_pool()
    async with pool.acquire() as conn:
        token = issue_token("+254711000001")
        created = await create_pool(
            conn, token_hash=token, category="utility",
            hashed_object_id="99991234", amount_pence=50_000,
        )

    with patch("mtc.routes.requester.initiate_stk_push", new_callable=AsyncMock) as stk:
        stk.return_value = {
            "checkout_request_id": "ws_CO_test_PHONE_001",
            "customer_message": "Enter PIN",
            "phone": "254711000001",
        }
        r = await client.post(
            f"/requests/{created['id']}/pay",
            headers={"X-Token": token},
            json={"phone": "+254711000001"},
        )
    assert r.status_code == 200, r.text

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT expected_phone_encrypted, expected_phone_hash FROM mpesa_transactions "
            "WHERE checkout_request_id = 'ws_CO_test_PHONE_001'",
        )
    assert row is not None
    # Ciphertext is NOT the plaintext
    assert row["expected_phone_encrypted"] != "+254711000001"
    assert row["expected_phone_encrypted"] != "254711000001"
    # But decrypts correctly
    assert _dec(row["expected_phone_encrypted"]) == "254711000001"
    # Hash matches
    assert row["expected_phone_hash"] == hash_phone("254711000001")
    # No plaintext column remains
    async with pool.acquire() as conn:
        cols = await conn.fetch(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'mpesa_transactions' AND column_name = 'expected_phone'"
        )
    assert not cols, "Plaintext expected_phone column should not exist"
