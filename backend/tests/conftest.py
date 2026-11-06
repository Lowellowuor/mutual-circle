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
    import os
    # CI has no Postgres configured; skip pool lifecycle. Tests that
    # require a real DB will fail with their own clearer error when
    # they try to use the pool. Tests that don't need a DB (e.g.
    # test_secret_validation.py) run to completion.
    if os.getenv('CI_NO_DB'):
        yield
        return

    await get_pool()
    yield
    await close_pool()