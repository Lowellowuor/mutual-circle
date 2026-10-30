"""Connection pool for the main database (mtc_main).

This module deliberately handles only one database. Bench and messaging have
their own modules — see ADR-003. The separation is the point.
"""
import logging
from typing import Optional

import asyncpg

from mtc.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """Return the shared connection pool, creating it lazily."""
    global _pool
    if _pool is not None:
        return _pool

    if not settings.database_url_main:
        raise RuntimeError("DATABASE_URL_MAIN is not configured")

    _pool = await asyncpg.create_pool(
        settings.database_url_main,
        min_size=1,
        max_size=5,
        command_timeout=10,
    )
    logger.info("Connected to mtc_main")
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Closed mtc_main pool")


async def health_check() -> dict:
    """Return database health. Never raises — reports state in the dict."""
    if not settings.database_url_main:
        return {"db": "not_configured"}
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"db": "connected"}
    except Exception as exc:
        logger.error("DB health check failed: %s", exc)
        return {"db": "error", "error": str(exc)}