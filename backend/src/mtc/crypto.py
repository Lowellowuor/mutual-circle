"""Phone encryption and hashing for PII at rest.

R.U.T.H 4.1 [Rec] + alignment doc point 4:
  - Phone numbers stored in the DB must be encrypted at rest.
  - Lookups (rate limits, callback verification) use a one-way hash so
    the plaintext is never needed for comparison.
  - Decryption only happens in memory, never in logs, never in the DB.

The encryption key is settings.messaging_encryption_key, a single key
used for all message-bound sensitive data (phone numbers, future: SMS
bodies if we ever store them).

Key derivation: if the setting value is already a valid Fernet key
(44-char base64, 32 bytes), use it directly. Otherwise derive via
SHA-256 so any passphrase-shaped string works in dev.
"""
import base64
import hashlib
import hmac

from cryptography.fernet import Fernet, InvalidToken

from mtc.config import settings


def _derive_fernet_key() -> bytes:
    """Return a valid 32-byte base64-encoded Fernet key derived from settings."""
    raw = settings.messaging_encryption_key
    if not raw:
        raise RuntimeError(
            "MESSAGING_ENCRYPTION_KEY is not configured. "
            "See backend/.env.example for the required value."
        )
    # If it's already a valid Fernet key, use as-is
    try:
        decoded = base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4))
        if len(decoded) == 32:
            return base64.urlsafe_b64encode(decoded)
    except Exception:
        pass
    # Otherwise derive via SHA-256
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_phone(plain: str) -> str:
    """Encrypt a phone number. Returns base64 ciphertext (str). Empty in, empty out."""
    if not plain:
        return ""
    f = Fernet(_derive_fernet_key())
    return f.encrypt(plain.encode("utf-8")).decode("ascii")


def decrypt_phone(ciphertext: str) -> str:
    """Decrypt a phone number. Returns plaintext. Empty in, empty out."""
    if not ciphertext:
        return ""
    f = Fernet(_derive_fernet_key())
    try:
        return f.decrypt(ciphertext.encode("ascii")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError(
            "Failed to decrypt phone: key mismatch or data corruption. "
            "Check MESSAGING_ENCRYPTION_KEY."
        ) from exc


def _normalize_for_hash(phone: str) -> str:
    """Normalize to 2547XXXXXXXX (no +) so every phone format hashes the same."""
    if not phone:
        return ""
    p = phone.strip().replace(" ", "").replace("-", "")
    if p.startswith("+"):
        p = p[1:]
    if p.startswith("0"):
        p = "254" + p[1:]
    if p.startswith("7") or p.startswith("1"):
        p = "254" + p
    return p


def hash_phone(phone: str) -> str:
    """HMAC-SHA256 hash of the normalized phone. Deterministic, non-reversible.

    Used for callback verification: compare hash(stored) to hash(incoming)
    so we never have to decrypt the stored value.
    """
    normalized = _normalize_for_hash(phone)
    if not normalized:
        return ""
    key = settings.messaging_encryption_key.encode("utf-8")
    return hmac.new(key, normalized.encode("utf-8"), hashlib.sha256).hexdigest()
