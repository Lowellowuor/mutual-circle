"""Requester routes â€” token-authenticated via X-Token header."""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field

import asyncpg

from mtc.db.main import get_conn
from mtc.rate_limit.counter import RateLimitExceeded, consume_quota
from mtc.requests_.lifecycle import WithdrawNotAllowed, list_requests, withdraw_request
from mtc.requests_.pool import create_pool
from mtc.requests_.swap import create_swap
from mtc.tokens.hmac import is_valid_token_format

router = APIRouter(prefix="/requests", tags=["requests"])


async def require_token(x_token: str = Header(..., alias="X-Token")) -> str:
    if not is_valid_token_format(x_token):
        raise HTTPException(401, "Invalid token format")
    return x_token


class SwapBody(BaseModel):
    bundle_category: str = Field(..., min_length=1, max_length=80)
    locker_location: str = Field(..., min_length=1, max_length=80)


class PoolBody(BaseModel):
    category: str = Field(..., pattern="^(utility|school_fee|hospital_invoice)$")
    hashed_object_id: str = Field(..., min_length=4, max_length=64)
    amount_pence: int = Field(..., gt=0, le=100_000_000)


@router.post("/swap")
async def create_swap_route(
    body: SwapBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        await consume_quota(conn, token_hash=token, value_pence=0)
    except RateLimitExceeded as e:
        raise HTTPException(429, detail={"reason": e.reason, "count": e.count, "value_pence": e.value_pence})
    return await create_swap(
        conn,
        token_hash=token,
        bundle_category=body.bundle_category,
        locker_location=body.locker_location,
    )


@router.post("/pool")
async def create_pool_route(
    body: PoolBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        await consume_quota(conn, token_hash=token, value_pence=body.amount_pence)
    except RateLimitExceeded as e:
        raise HTTPException(429, detail={"reason": e.reason, "count": e.count, "value_pence": e.value_pence})
    return await create_pool(
        conn,
        token_hash=token,
        category=body.category,
        hashed_object_id=body.hashed_object_id,
        amount_pence=body.amount_pence,
    )


@router.get("/mine")
async def list_mine(
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"requests": await list_requests(conn, token_hash=token)}


@router.post("/{request_id}/withdraw")
async def withdraw_route(
    request_id: str,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await withdraw_request(conn, request_id=request_id, token_hash=token)
    except LookupError:
        raise HTTPException(404, "Request not found")
    except PermissionError:
        raise HTTPException(403, "Token does not own this request")
    except WithdrawNotAllowed as e:
        raise HTTPException(409, f"Cannot withdraw from status '{e.current_status}'")

@router.get("/vouchers/mine", tags=["vouchers"])
async def list_my_vouchers(
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    from mtc.vouchers.issue import list_vouchers_for_token
    return {"vouchers": await list_vouchers_for_token(conn, token_hash=token)}
