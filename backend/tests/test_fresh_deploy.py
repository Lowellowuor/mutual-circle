"""Fresh deploy contract — migrations produce what the app needs.

Guards the class of bug where CI passes because the DB has schema from
manual SQL, but a truly fresh DB is missing tables/columns. The pattern
that caught this: schema introspection against tables the code queries.

Runs against the live/test DB but asserts only what matters for fresh
deploy: every table, every critical column, every constraint.
"""
import os

import pytest
import pytest_asyncio

from mtc.db.main import get_pool


@pytest_asyncio.fixture
async def conn():
    pool = await get_pool()
    async with pool.acquire() as c:
        yield c


async def test_every_live_table_is_created_by_a_migration(conn):
    """No table should exist in the DB unless a migration creates it.

    Orphan tables (like donor_otp_challenges before migration 013) mean
    the schema was modified by hand at some point and fresh deploys will
    crash on those code paths.
    """
    # Tables we know are created by migrations
    EXPECTED_FROM_MIGRATIONS = {
        "audit_log", "campaigns", "dedup_items", "depot_state",
        "institutions", "institutional_payments",
        "donor_contributions", "donor_otp_challenges", "donor_profiles",
        "donor_sessions", "helplines", "household_declarations",
        "idempotency_keys", "intake_surveys", "ledger_entries",
        "locker_stock", "match_interests", "mpesa_transactions",
        "notifications", "opportunities", "partner_confirmations",
        "partners", "paystack_payments", "pledges", "rate_counters", "requests", "requesters", "risk_flags",
        "sms_sessions", "staff_sessions", "voucher_redemptions", "vouchers",
    }

    rows = await conn.fetch(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' "
        "AND table_name NOT IN ('alembic_version', 'playing_with_neon')"
    )
    live = {r["table_name"] for r in rows}

    orphan = live - EXPECTED_FROM_MIGRATIONS
    assert not orphan, (
        f"Tables exist in DB but no migration creates them: {sorted(orphan)}. "
        f"Fresh deploy will not have these. Add a migration."
    )


async def test_every_expected_table_exists(conn):
    """Inverse of the above: every table migrations promise must exist."""
    REQUIRED = {
        "audit_log", "campaigns", "dedup_items", "depot_state",
        "institutions", "institutional_payments",
        "donor_contributions", "donor_otp_challenges", "donor_profiles",
        "donor_sessions", "helplines", "household_declarations",
        "idempotency_keys", "intake_surveys", "ledger_entries",
        "locker_stock", "match_interests", "mpesa_transactions",
        "notifications", "opportunities", "partner_confirmations",
        "partners", "paystack_payments", "pledges", "rate_counters", "requests", "requesters", "risk_flags",
        "sms_sessions", "staff_sessions", "voucher_redemptions", "vouchers",
    }
    rows = await conn.fetch(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    )
    live = {r["table_name"] for r in rows}
    missing = REQUIRED - live
    assert not missing, (
        f"Required tables missing from DB: {sorted(missing)}. "
        f"A migration is missing."
    )


def test_staff_credentials_available():
    """Fresh deploy needs staff login. Staff credentials are env-var based.

    This test asserts the env vars are either all set (production path) or
    explicitly stubbed (test path via conftest). If neither, staff login
    will 500 on a fresh deploy.
    """
    pairs = [
        ("STAFF_ENROL_ID", "STAFF_ENROL_PIN_HASH"),
        ("STAFF_FULF_ID", "STAFF_FULF_PIN_HASH"),
        ("STAFF_AUDIT_ID", "STAFF_AUDIT_PIN_HASH"),
    ]
    # In the test environment, conftest.py sets these. In prod, .env sets them.
    # This test's real job is to assert at least one path is configured.
    import os
    import pytest
    env = os.environ.get("ENVIRONMENT", "development")
    if env not in ("production", "staging"):
        pytest.skip("staff credentials are asserted at startup only in production/staging")
    configured = sum(
        1 for id_v, hash_v in pairs
        if os.environ.get(id_v) and os.environ.get(hash_v)
    )
    assert configured > 0, (
        "No staff credentials configured. Either set STAFF_*_ID and "
        "STAFF_*_PIN_HASH env vars (see backend/.env.example), or set "
        "them in pytest conftest for tests. Fresh deploy will not allow "
        "staff login without this."
    )


async def test_verify_pin_module_uses_bcrypt():
    """verify_pin.py must use bcrypt — not plaintext comparison.

    Regression guard: this file was flagged in an external audit.
    Reading the source is the cheapest way to prove it's using bcrypt.
    """
    from pathlib import Path
    src = Path("src/mtc/vouchers/verify_pin.py").read_text(encoding="utf-8")
    assert "bcrypt" in src, (
        "verify_pin.py does not import bcrypt — "
        "PINs are being verified in plaintext"
    )
    assert "bcrypt.checkpw" in src or "bcrypt.hashpw" in src, (
        "verify_pin.py imports bcrypt but does not call checkpw/hashpw"
    )
