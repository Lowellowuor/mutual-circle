"""Alembic environment — connects to mtc_main using asyncpg.

Alembic is synchronous by default. We use asyncio.run() with an async engine
to speak to Postgres through asyncpg (matching the app's driver).
"""
import asyncio
import sys as _platform_sys
if _platform_sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from mtc.config import settings  # noqa: E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

def _rewrite_db_url(url: str) -> str:
    if not url.startswith("postgresql://"):
        return url
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    query.pop("sslmode", None)
    query.pop("channel_binding", None)
    new_query = urlencode(query, doseq=True)
    return urlunparse(parsed._replace(scheme="postgresql+asyncpg", query=new_query))

config.set_main_option("sqlalchemy.url", _rewrite_db_url(settings.database_url_main))
target_metadata = None


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connect_args = {}
    if "sslmode=require" in settings.database_url_main:
        connect_args["ssl"] = True

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_offline() -> None:
    context.configure(url=settings.database_url_main, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()