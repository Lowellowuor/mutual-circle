"""Requester routes Ã¢â‚¬â€ token-authenticated via X-Token header."""
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
    hh = await conn.fetchval(
        "SELECT household_size FROM household_declarations WHERE token_hash = $1",
        token,
    )
    return await create_swap(
        conn,
        token_hash=token,
        bundle_category=body.bundle_category,
        locker_location=body.locker_location,
        household_size=hh,
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

class MatchInterestBody(BaseModel):
    opportunity_id: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=200)


@router.post("/match/{request_id}/interest")
async def express_interest(
    request_id: str, body: MatchInterestBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Express interest in an opportunity (The Match). Requires opt-in disclosure."""
    row = await conn.fetchrow(
        """INSERT INTO match_interests (opportunity_id, title, token_hash, status)
           VALUES ($1, $2, $3, 'pending') RETURNING id, created_at""",
        body.opportunity_id, body.title, token,
    )
    return {
        "id": str(row["id"]),
        "opportunity_id": body.opportunity_id,
        "title": body.title,
        "status": "pending",
        "created_at": row["created_at"].isoformat(),
    }

# --- Household declaration (used to size bundles) ---

class HouseholdBody(BaseModel):
    household_size: int = Field(..., ge=1, le=20)


@router.post("/household")
async def set_household(
    body: HouseholdBody,
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        """INSERT INTO household_declarations (token_hash, household_size)
           VALUES ($1, $2)
           ON CONFLICT (token_hash) DO UPDATE
           SET household_size = EXCLUDED.household_size,
               updated_at = now()
           RETURNING household_size, declared_at, updated_at""",
        token, body.household_size,
    )
    return {
        "household_size": row["household_size"],
        "declared_at": row["declared_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


@router.get("/household")
async def get_household(
    token: str = Depends(require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        "SELECT household_size, declared_at FROM household_declarations WHERE token_hash = $1",
        token,
    )
    if row is None:
        return {"household_size": None, "declared": False}
    return {
        "household_size": row["household_size"],
        "declared": True,
        "declared_at": row["declared_at"].isoformat(),
    }
