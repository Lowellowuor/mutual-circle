"""Ledger tests — prove R.U.T.H Section 8 item 5 (blockchain vs append-only).

The four tests exercise the production modules (mtc.ledger.append, mtc.ledger.verify),
not a duplicate copy of the logic. If these pass, the production code path works.
"""
import asyncpg
import pytest
import pytest_asyncio

from mtc.db.main import get_pool
from mtc.ledger.append import DuplicateObjectError, append_entry
from mtc.ledger.verify import verify_chain


@pytest_asyncio.fixture
async def clean_conn():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("TRUNCATE ledger_entries")
        try:
            yield conn
        finally:
            try:
                await conn.execute("TRUNCATE ledger_entries")
            except Exception:
                pass


async def test_append_creates_valid_chain(clean_conn):
    conn = clean_conn
    r1 = await append_entry(conn, object_hash="meter-abc", category="utility", amount_pence=3500, settled_by_hash="fund-a")
    r2 = await append_entry(conn, object_hash="school-def", category="school_fee", amount_pence=8500, settled_by_hash="fund-a")
    r3 = await append_entry(conn, object_hash="invoice-ghi", category="hospital_invoice", amount_pence=12000, settled_by_hash="fund-b")

    assert len(r1["entry_hash"]) == 64
    assert len(r2["entry_hash"]) == 64
    assert len(r3["entry_hash"]) == 64

    rows = await conn.fetch("SELECT previous_entry_hash FROM ledger_entries ORDER BY created_at ASC, id ASC")
    assert rows[0]["previous_entry_hash"] == "GENESIS"
    assert rows[1]["previous_entry_hash"] == r1["entry_hash"]
    assert rows[2]["previous_entry_hash"] == r2["entry_hash"]


async def test_verify_untampered_ledger(clean_conn):
    conn = clean_conn
    await append_entry(conn, object_hash="meter-abc", category="utility", amount_pence=3500, settled_by_hash="fund-a")
    await append_entry(conn, object_hash="school-def", category="school_fee", amount_pence=8500, settled_by_hash="fund-a")

    result = await verify_chain(conn)
    assert result["ok"] is True
    assert result["entries"] == 2


async def test_duplicate_object_rejected(clean_conn):
    conn = clean_conn
    await append_entry(conn, object_hash="meter-abc", category="utility", amount_pence=3500, settled_by_hash="fund-a")

    with pytest.raises(DuplicateObjectError):
        await append_entry(conn, object_hash="meter-abc", category="utility", amount_pence=3500, settled_by_hash="fund-b")

    # Also verify the DB-level constraint (defence in depth)
    with pytest.raises(asyncpg.UniqueViolationError):
        await conn.execute(
            """INSERT INTO ledger_entries
               (object_hash, category, amount_pence, settled_by_hash, previous_entry_hash, entry_hash)
               VALUES ('meter-abc', 'utility', 3500, 'fund-c', 'x', 'y')"""
        )


async def test_tamper_detected(clean_conn):
    conn = clean_conn
    await append_entry(conn, object_hash="meter-abc", category="utility", amount_pence=3500, settled_by_hash="fund-a")
    await append_entry(conn, object_hash="school-def", category="school_fee", amount_pence=8500, settled_by_hash="fund-a")
    await append_entry(conn, object_hash="invoice-ghi", category="hospital_invoice", amount_pence=12000, settled_by_hash="fund-b")

    result = await verify_chain(conn)
    assert result["ok"] is True

    # Tamper: change an amount directly in the DB, bypassing the append function
    await conn.execute("UPDATE ledger_entries SET amount_pence = 35000 WHERE object_hash = 'meter-abc'")

    result = await verify_chain(conn)
    assert result["ok"] is False
    assert result["reason"] == "tamper detected"
    assert result["index"] == 0