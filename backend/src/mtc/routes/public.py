"""Public routes — no auth required."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from mtc.tokens.hmac import issue_token

router = APIRouter(tags=["public"])


class TokenRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)


class TokenResponse(BaseModel):
    token: str


@router.post("/tokens", response_model=TokenResponse)
async def create_token(body: TokenRequest):
    """Derive a token from a phone number.

    The phone is used only to compute the HMAC. It is not stored anywhere.
    Same phone + same weekly salt = same token (deterministic).
    """
    if not body.phone.strip():
        raise HTTPException(400, "Phone number is required")
    return TokenResponse(token=issue_token(body.phone.strip()))