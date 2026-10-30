"""Session-scoped asyncpg pool lifecycle.

One event loop for all tests means the pool created on first use stays valid
across every test function. Without this, pytest-asyncio spins up a fresh
loop per test and the module-level pool in db/main.py goes stale, producing
"Event loop is closed" errors on the second test onwards.
"""
import pytest_asyncio

from mtc.db.main import get_pool, close_pool


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _pool_lifecycle():
    await get_pool()
    yield
    await close_pool()