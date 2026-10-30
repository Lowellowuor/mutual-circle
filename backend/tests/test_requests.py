"""Day 3 tests â€” prove tier assignment, request persistence, rate limits, withdrawal."""
import asyncpg
import pytest
import pytest_asyncio

from mtc.db.main import get_pool
from mtc.rate_limit.counter import MAX_REQUESTS_PER_DAY, RateLimitExceeded, consume_quota
from mtc.requests_.lifecycle import WithdrawNotAllowed, list_requests, withdraw_request
from mtc.requests_.pool import create_pool
from mtc.requests_.swap import create_swap
from mtc.requests_.tiers import assign_tier, initial_status
from mtc.tokens.hmac import is_valid_token_format, issue_token


@pytest_asyncio.fixture
async def clean_conn():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("TRUNCATE requests, rate_counters RESTART IDENTITY CASCADE")
        try:
            yield conn
        finally:
            try:
                await conn.execute("TRUNCATE requests, rate_counters RESTART IDENTITY CASCADE")
            except Exception:
                pass


# -- Pure function tests -----------------------------------------------------

def test_tier_assignment_swap():
    assert assign_tier("swap_bundle", 0) == 1
    assert initial_status(1) == "verified"


def test_tier_assignment_small_utility():
    assert assign_tier("utility", 350_000) == 2  # 3,500 KES
    assert initial_status(2) == "verified"


def test_tier_assignment_large_utility():
    assert assign_tier("utility", 500_000) == 3  # exactly 5,000 KES
    assert initial_status(3) == "pending_check"
    assert assign_tier("hospital_invoice", 1_200_000) == 3


def test_token_format():
    t = issue_token("+254700123456")
    assert len(t) == 16
    assert is_valid_token_format(t)
    assert not is_valid_token_format("short")
    assert not is_valid_token_format("ZZZZZZZZZZZZZZZZ")


def test_token_deterministic():
    a = issue_token("+254700123456")
    b = issue_token("+254700123456")
    c = issue_token("+254700999999")
    assert a == b
    assert a != c


# -- DB-backed tests ---------------------------------------------------------

@pytest.mark.asyncio
async def test_create_swap_persists(clean_conn):
    conn = clean_conn
    token = issue_token("+254700111222")
    result = await create_swap(
        conn, token_hash=token, bundle_category="Standard Pantry", locker_location="Kibera Hub"
    )
    assert result["type"] == "swap"
    assert result["tier"] == 1
    assert result["status"] == "verified"

    listed = await list_requests(conn, token_hash=token)
    assert len(listed) == 1
    assert listed[0]["id"] == result["id"]


@pytest.mark.asyncio
async def test_create_pool_tier_2(clean_conn):
    conn = clean_conn
    token = issue_token("+254700222333")
    result = await create_pool(
        conn, token_hash=token, category="utility",
        hashed_object_id="objhash-aaaa", amount_pence=350_000,
    )
    assert result["tier"] == 2
    assert result["status"] == "verified"


@pytest.mark.asyncio
async def test_create_pool_tier_3(clean_conn):
    conn = clean_conn
    token = issue_token("+254700333444")
    result = await create_pool(
        conn, token_hash=token, category="hospital_invoice",
        hashed_object_id="objhash-bbbb", amount_pence=1_200_000,
    )
    assert result["tier"] == 3
    assert result["status"] == "pending_check"


@pytest.mark.asyncio
async def test_rate_limit_request_count(clean_conn):
    conn = clean_conn
    token = issue_token("+254700444555")
    for _ in range(MAX_REQUESTS_PER_DAY):
        await consume_quota(conn, token_hash=token, value_pence=0)
    with pytest.raises(RateLimitExceeded) as exc:
        await consume_quota(conn, token_hash=token, value_pence=0)
    assert "Daily request limit" in exc.value.reason


@pytest.mark.asyncio
async def test_rate_limit_value(clean_conn):
    conn = clean_conn
    token = issue_token("+254700555666")
    # 3 requests of 4,000,000 pence (40,000 KES each)
    await consume_quota(conn, token_hash=token, value_pence=4_000_000)
    await consume_quota(conn, token_hash=token, value_pence=4_000_000)
    with pytest.raises(RateLimitExceeded) as exc:
        await consume_quota(conn, token_hash=token, value_pence=4_000_000)
    assert "Daily value limit" in exc.value.reason


@pytest.mark.asyncio
async def test_withdraw(clean_conn):
    conn = clean_conn
    token = issue_token("+254700666777")
    created = await create_pool(
        conn, token_hash=token, category="utility",
        hashed_object_id="objhash-cccc", amount_pence=350_000,
    )
    result = await withdraw_request(conn, request_id=created["id"], token_hash=token)
    assert result["status"] == "withdrawn"

    listed = await list_requests(conn, token_hash=token)
    assert listed[0]["status"] == "withdrawn"


@pytest.mark.asyncio
async def test_withdraw_wrong_owner(clean_conn):
    conn = clean_conn
    token_a = issue_token("+254700777888")
    token_b = issue_token("+254700888999")
    created = await create_pool(
        conn, token_hash=token_a, category="utility",
        hashed_object_id="objhash-dddd", amount_pence=350_000,
    )
    with pytest.raises(PermissionError):
        await withdraw_request(conn, request_id=created["id"], token_hash=token_b)


@pytest.mark.asyncio
async def test_withdraw_after_dispatch_blocked(clean_conn):
    conn = clean_conn
    token = issue_token("+254700999000")
    created = await create_pool(
        conn, token_hash=token, category="utility",
        hashed_object_id="objhash-eeee", amount_pence=350_000,
    )
    # Manually simulate dispatch
    await conn.execute(
        "UPDATE requests SET status = 'submitted_to_partner' WHERE id = $1",
        created["id"],
    )
    with pytest.raises(WithdrawNotAllowed):
        await withdraw_request(conn, request_id=created["id"], token_hash=token)