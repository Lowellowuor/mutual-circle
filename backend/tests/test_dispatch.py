"""Dispatch + OCR + audit log tests."""
import pytest
import pytest_asyncio

from mtc.admin.dispatch import DispatchConflict, dispatch_pool_request
from mtc.admin.ocr import OcrConflict, complete_ocr
from mtc.audit.log import list_audit
from mtc.db.main import get_pool
from mtc.requests_.pool import create_pool
from mtc.tokens.hmac import issue_token


@pytest_asyncio.fixture
async def clean_conn():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("TRUNCATE requests, ledger_entries, audit_log RESTART IDENTITY CASCADE")
        try:
            yield conn
        finally:
            try:
                await conn.execute("TRUNCATE requests, ledger_entries, audit_log RESTART IDENTITY CASCADE")
            except Exception:
                pass


async def test_dispatch_verified_pool(clean_conn):
    conn = clean_conn
    token = issue_token("+254700111222")
    created = await create_pool(
        conn, token_hash=token, category="utility",
        hashed_object_id="objhash-dispatch-1", amount_pence=350_000,
    )
    # Tier 2 → status verified. Dispatch directly.
    result = await dispatch_pool_request(conn, request_id=created["id"], staff_id="FULF-08")
    assert result["receipt"].startswith("MPESA-")
    assert result["status"] == "submitted_to_partner"

    # Ledger got an entry
    ledger_row = await conn.fetchrow(
        "SELECT object_hash, amount_pence FROM ledger_entries WHERE object_hash = 'objhash-dispatch-1'"
    )
    assert ledger_row is not None
    assert ledger_row["amount_pence"] == 350_000

    # Audit log recorded
    logs = await list_audit(conn)
    assert any("Dispatched" in e["action"] and e["actor_role"] == "fulfilment" for e in logs)


async def test_dispatch_pending_check_rejected(clean_conn):
    conn = clean_conn
    token = issue_token("+254700333444")
    created = await create_pool(
        conn, token_hash=token, category="hospital_invoice",
        hashed_object_id="objhash-dispatch-2", amount_pence=1_200_000,
    )
    # Tier 3 → pending_check. Dispatch must fail.
    with pytest.raises(DispatchConflict):
        await dispatch_pool_request(conn, request_id=created["id"], staff_id="FULF-08")


async def test_dispatch_duplicate_object_blocked(clean_conn):
    conn = clean_conn
    token = issue_token("+254700555666")
    a = await create_pool(
        conn, token_hash=token, category="utility",
        hashed_object_id="objhash-same", amount_pence=350_000,
    )
    b = await create_pool(
        conn, token_hash=issue_token("+254700777888"), category="utility",
        hashed_object_id="objhash-same", amount_pence=350_000,
    )
    # First dispatch succeeds
    await dispatch_pool_request(conn, request_id=a["id"], staff_id="FULF-08")
    # Second dispatch of same object_hash must fail
    with pytest.raises(DispatchConflict):
        await dispatch_pool_request(conn, request_id=b["id"], staff_id="FULF-08")


async def test_ocr_completes_pending_to_verified(clean_conn):
    conn = clean_conn
    token = issue_token("+254700999000")
    created = await create_pool(
        conn, token_hash=token, category="hospital_invoice",
        hashed_object_id="objhash-ocr-1", amount_pence=1_200_000,
    )
    assert created["status"] == "pending_check"

    result = await complete_ocr(conn, request_id=created["id"], staff_id="AUDIT-02")
    assert result["status"] == "verified"

    # Now dispatch should work
    dispatch = await dispatch_pool_request(conn, request_id=created["id"], staff_id="FULF-08")
    assert dispatch["status"] == "submitted_to_partner"


async def test_ocr_on_non_pending_rejected(clean_conn):
    conn = clean_conn
    token = issue_token("+254700123123")
    created = await create_pool(
        conn, token_hash=token, category="utility",
        hashed_object_id="objhash-ocr-2", amount_pence=350_000,
    )
    # Already 'verified', not 'pending_check'
    with pytest.raises(OcrConflict):
        await complete_ocr(conn, request_id=created["id"], staff_id="AUDIT-02")