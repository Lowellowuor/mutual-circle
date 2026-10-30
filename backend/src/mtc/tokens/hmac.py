"""Requester token derivation — HMAC-SHA256 with weekly rotating salt.

Per R.U.T.H Section 4.1:
  - Keyed hash (not plain hash) so small input spaces can't be brute-forced
  - Salt rotates weekly
  - Token is displayed only to the requester; staff and partners never see it
  - The raw phone is never stored. It exists only during the POST /tokens call.
"""
import hashlib
import hmac

from mtc.config import settings

TOKEN_LENGTH = 16  # hex characters


def current_weekly_salt() -> str:
    return settings.token_hmac_key_current


def previous_weekly_salt() -> str:
    return settings.token_hmac_key_previous


def derive_token(phone: str, salt: str) -> str:
    if not salt:
        raise RuntimeError("Token HMAC salt is not configured")
    sig = hmac.new(salt.encode(), phone.encode(), hashlib.sha256).hexdigest()
    return sig[:TOKEN_LENGTH]


def issue_token(phone: str) -> str:
    """Derive a token for the given phone number using the current weekly salt."""
    return derive_token(phone, current_weekly_salt())


def is_valid_token_format(token: str) -> bool:
    if not token or len(token) != TOKEN_LENGTH:
        return False
    try:
        int(token, 16)
        return True
    except ValueError:
        return False