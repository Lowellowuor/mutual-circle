"""Public routes — no auth required."""
import asyncpg
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from mtc.crypto import encrypt_phone, hash_phone
from mtc.tokens.hmac import issue_token
from mtc.db.main import get_conn

router = APIRouter(tags=["public"])


class TokenRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)


class TokenResponse(BaseModel):
    token: str


@router.post("/tokens", response_model=TokenResponse)
async def create_token(
    body: TokenRequest,
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Derive a token from a phone number and remember it.

    The phone is used to compute the HMAC token. It is also stored
    encrypted at rest so Admin can send SMS (KPLC tokens, PINs).
    """
    if not body.phone.strip():
        raise HTTPException(400, "Phone number is required")
    phone = body.phone.strip()
    token = issue_token(phone)

    # Save the encrypted phone so we can SMS the requester later.
    # Do NOT swallow exceptions silently — if this fails, the caller must
    # know (otherwise SMS delivery for KPLC tokens / PINs is silently dead).
    try:
        await conn.execute(
            """
            INSERT INTO requesters (token_hash, phone_encrypted, phone_hash)
            VALUES ($1, $2, $3)
            ON CONFLICT (token_hash) DO UPDATE SET
                phone_encrypted = EXCLUDED.phone_encrypted,
                updated_at = now()
            """,
            token, encrypt_phone(phone), hash_phone(phone),
        )
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error(
            "CRITICAL: failed to save requester phone. SMS delivery for this "
            "requester will fail until fixed. error=%r", exc,
            exc_info=True,
        )
        raise HTTPException(
            500,
            f"Failed to register requester: {type(exc).__name__}",
        ) from exc

    return TokenResponse(token=token)