"""Connection pool for the main database (mtc_main).

Deliberately handles only one database — see ADR-003.

Neon notes:
  - Remote requires SSL (auto-detected).
  - Pooled hostname (-pooler) is PgBouncer; statement_cache_size=0 avoids
    "prepared statement already exists" errors.
"""
import logging
from typing import Optional
from urllib.parse import urlparse

import asyncpg

from mtc.config import settings

logger = logging.getLogger(__name__)
_pool: Optional[asyncpg.Pool] = None


def _needs_ssl(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
        return host not in ("localhost", "127.0.0.1", "::1")
    except Exception:
        return True


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool
    if not settings.database_url_main:
        raise RuntimeError("DATABASE_URL_MAIN is not configured")

    ssl_mode = "require" if _needs_ssl(settings.database_url_main) else False
    _pool = await asyncpg.create_pool(
        settings.database_url_main,
        min_size=1,
        max_size=5,
        command_timeout=10,
        ssl=ssl_mode,
        statement_cache_size=0,
    )
    logger.info("Connected to mtc_main (ssl=%s)", ssl_mode)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def get_conn():
    """FastAPI dependency: yields a pooled connection."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def health_check() -> dict:
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