"""Partner key signing - HMAC signature appended to key.

Format: <key>.<hex-signature>
Signature = HMAC-SHA256(PARTNER_HMAC_KEY, key)
Constant-time compare on verify.

Dev bypass: if PARTNER_HMAC_KEY is unset AND environment != production,
unsigned keys pass through (matches current demo behavior). Production
enforces via _validate_secrets refusing to boot without the key set.
"""
import hashlib
import hmac

from mtc.config import settings


def sign_partner_key(key: str) -> str:
    """Append signature to a raw key. Result: '<key>.<hex>'."""
    if not settings.partner_hmac_key:
        raise RuntimeError("PARTNER_HMAC_KEY not configured - cannot sign")
    sig = hmac.new(
        settings.partner_hmac_key.encode("utf-8"),
        key.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{key}.{sig}"


def verify_partner_key(signed: str) -> str | None:
    """Verify a signed key. Return raw key on success, None on failure."""
    if "." not in signed:
        if settings.environment != "production" and not settings.partner_hmac_key:
            return signed
        return None
    key, provided_sig = signed.rsplit(".", 1)
    if not settings.partner_hmac_key:
        return None
    expected = hmac.new(
        settings.partner_hmac_key.encode("utf-8"),
        key.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if hmac.compare_digest(provided_sig, expected):
        return key
    return None