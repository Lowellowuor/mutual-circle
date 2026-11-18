"""Phone encryption — unit + integration tests.

Guards against the 2026-11-13 finding that phone numbers sat in
mpesa_transactions.expected_phone as plaintext (payments review #9).
After migration 016, all phone storage is encrypted with Fernet,
and all verification uses HMAC-SHA256 hashes.

The end-to-end STK test that lived here was removed with the Daraja
integration (Paystack payments store no phone numbers).
"""
import pytest

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
