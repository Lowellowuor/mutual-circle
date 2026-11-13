"""Schema contract tests — assert migrations produce what the code needs.

Guards against: a migration missing a table or column that some code
path uses (the orphan donor tables, missing payment_status, phantom
alembic_version stamps). Runs against any DB after ``alembic upgrade head``.

If any of these fail, either a migration is missing or the schema was
modified by hand. Both must be fixed before the code can be trusted to
work on a fresh deploy.

Session incident this guards against: 2026-11-13, three donor auth
tables existed in the live DB but no migration created them. Fresh
deploy would have crashed on the first donor OTP request. See migration
013_donor_auth_tables.
"""
import pytest
import pytest_asyncio

from mtc.db.main import get_pool


# Expected tables and their critical columns. Keep this in sync when
# migrations add tables or columns. `None` means "assert existence only,
# don't check columns" — for tables where the code is defensive about
# schema, or where columns change frequently.
EXPECTED_TABLES = {
    "audit_log": None,
    "campaigns": None,
    "dedup_items": None,
    "depot_state": None,
    "donor_contributions": {"donor_hash", "amount_pence", "status"},
    "donor_otp_challenges": {"phone_hash", "code_hash", "expires_at", "attempts", "send_count"},
    "donor_profiles": {"donor_hash", "display_name", "opt_in_ledger"},
    "donor_sessions": {"id", "donor_hash", "phone_hash", "expires_at"},
    "helplines": None,
    "household_declarations": None,
    "idempotency_keys": None,
    "institutions": {"id", "name", "type", "paybill_number", "account_number"},
    "institutional_payments": {"id", "request_id", "institution_id", "amount_pence", "status", "kplc_token"},
    "intake_surveys": {
        "id", "request_id", "family_size", "work_status", "industry",
        "primary_need", "willing_to_give_back", "consent_to_aggregate",
        "verification_status",
    },
    "ledger_entries": {"object_hash", "entry_hash", "previous_entry_hash"},
    "locker_stock": None,
    "match_interests": None,
    "mpesa_transactions": {"checkout_request_id", "expected_phone", "target_table", "target_id"},
    "notifications": None,
    "opportunities": None,
    "partner_confirmations": None,
    "partners": None,
    "pledges": {"id", "status", "payment_status", "type", "max_value_pence"},
    "rate_counters": None,
    "requests": {
        "id", "token_hash", "status", "payment_status",
        "hashed_object_id", "amount_pence", "tier", "type", "category",
        "evidence_photo_path", "evidence_submitted_at",
    },
    "risk_flags": None,
    "sms_sessions": None,
    "staff_sessions": None,
    "voucher_redemptions": None,
    "vouchers": None,
}


@pytest_asyncio.fixture
async def conn():
    pool = await get_pool()
    async with pool.acquire() as c:
        yield c


@pytest.mark.asyncio
async def test_all_expected_tables_exist(conn):
    """Every table the code references must exist after migrations."""
    rows = await conn.fetch(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    existing = {r["table_name"] for r in rows}
    missing = set(EXPECTED_TABLES.keys()) - existing
    assert not missing, (
        f"Missing tables after alembic upgrade head: {sorted(missing)}. "
        f"A migration is missing (see the 2026-11-13 orphan donor tables incident)."
    )


@pytest.mark.asyncio
async def test_critical_columns_present(conn):
    """Critical columns on critical tables must exist after migrations."""
    failures = []
    for table, expected_cols in EXPECTED_TABLES.items():
        if not expected_cols:
            continue
        rows = await conn.fetch(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = $1",
            table,
        )
        actual = {r["column_name"] for r in rows}
        missing = expected_cols - actual
        if missing:
            failures.append(f"  {table}: missing {sorted(missing)}")
    assert not failures, (
        "Missing columns after alembic upgrade head:\n" + "\n".join(failures)
    )


@pytest.mark.asyncio
async def test_donor_contributions_status_default_is_unpaid(conn):
    """Payments review #2 regression guard: default must be 'unpaid', not 'paid'.

    A 'paid' default made every donation appear paid before any M-PESA
    prompt was sent. The user saw "already paid" on first attempt.
    """
    row = await conn.fetchrow(
        "SELECT column_default FROM information_schema.columns "
        "WHERE table_name = 'donor_contributions' AND column_name = 'status'"
    )
    assert row is not None, "donor_contributions.status column missing"
    default = (row["column_default"] or "").lower()
    assert "unpaid" in default, (
        f"donor_contributions.status default is {default!r}; expected 'unpaid'"
    )


@pytest.mark.asyncio
async def test_pledges_payment_status_check_constraint(conn):
    """Payments review #8: pledges.payment_status must be constrained."""
    rows = await conn.fetch(
        "SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint "
        "WHERE conname = 'chk_pledges_payment_status'"
    )
    assert rows, (
        "chk_pledges_payment_status constraint missing — migration 011 "
        "didn't run, or the constraint was dropped"
    )
    cdef = rows[0]["def"]
    for allowed in ("unpaid", "pending_payment", "paid", "payment_failed"):
        assert allowed in cdef, (
            f"payment_status constraint missing value {allowed!r}: {cdef}"
        )


@pytest.mark.asyncio
async def test_donor_auth_fk_integrity(conn):
    """Migration 013: donor_sessions.donor_hash must reference donor_profiles."""
    rows = await conn.fetch("""
        SELECT pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conrelid = 'donor_sessions'::regclass AND contype = 'f'
    """)
    assert rows, (
        "donor_sessions has no foreign key — migration 013 didn't run, "
        "or the FK was dropped"
    )
    combined = " ".join(r["def"] for r in rows)
    assert "donor_profiles" in combined, (
        f"donor_sessions FK does not reference donor_profiles: {combined}"
    )
