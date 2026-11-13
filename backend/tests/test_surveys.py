"""Intake surveys — state machine, k-anonymity, basket recommendation."""
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from mtc.db.main import get_pool
from mtc.main import app
from mtc.surveys.basket import evaluate_amount, recommend_basket


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def clean_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "TRUNCATE intake_surveys, requests, mpesa_transactions, "
            "idempotency_keys, rate_counters, ledger_entries, audit_log "
            "RESTART IDENTITY CASCADE"
        )
    yield


async def _create_and_approve_request(client, phone="+254700111222", status="verified"):
    """Create a pool request, force status. Returns (token, request_id)."""
    tok = (await client.post("/tokens", json={"phone": phone})).json()["token"]
    r = await client.post(
        "/requests/pool",
        headers={"X-Token": tok},
        json={
            "category": "utility",
            "hashed_object_id": "99991222",
            "amount_pence": 50000,
        },
    )
    rid = r.json()["id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE requests SET status = $2 WHERE id = $1", rid, status)
    return tok, rid


def _intake_body(rid, **kwargs):
    base = {
        "request_id": rid,
        "family_size": 4,
        "work_status": "casual",
        "industry": "informal",
        "primary_need": "food",
        "consent_to_aggregate": True,
        "consent_to_followup": True,
        "submitted_via": "web",
    }
    base.update(kwargs)
    return base


# ═══════════════════════════════════════════════════════════════════════
# Basket logic (pure functions — no DB)
# ═══════════════════════════════════════════════════════════════════════

def test_basket_grows_with_family_size():
    b1 = recommend_basket(1)
    b6 = recommend_basket(6)
    assert b6["total_pence"] > b1["total_pence"]
    assert b1["tier"] == 1
    assert b6["tier"] == 3


def test_basket_clamps_out_of_range():
    assert recommend_basket(0)["family_size"] == 1
    assert recommend_basket(99)["family_size"] == 8


def test_evaluate_within_tolerance_no_flag():
    baseline = recommend_basket(3)["items"][0]["amount_pence"]
    result = evaluate_amount(3, "food", baseline)
    assert result["flag"] is None
    assert result["tier"] == 2


def test_evaluate_over_tolerance_escalates():
    baseline = recommend_basket(3)["items"][0]["amount_pence"]
    result = evaluate_amount(3, "food", baseline * 2)  # 200%
    assert result["flag"] == "over_baseline"
    assert result["tier"] == 3


def test_evaluate_under_tolerance_flags_confirm():
    baseline = recommend_basket(3)["items"][0]["amount_pence"]
    result = evaluate_amount(3, "food", baseline // 2)  # 50%
    assert result["flag"] == "under_baseline_confirm"


# ═══════════════════════════════════════════════════════════════════════
# Intake submission
# ═══════════════════════════════════════════════════════════════════════

async def test_submit_intake_happy(client, clean_db):
    tok, rid = await _create_and_approve_request(client)
    r = await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["revision"] is False
    assert "survey_id" in body
    assert body["basket_recommendation"]["family_size"] == 4


async def test_submit_intake_wrong_token_404(client, clean_db):
    tok_a, rid = await _create_and_approve_request(client, phone="+254700111111")
    tok_b = (await client.post("/tokens", json={"phone": "+254700222222"})).json()["token"]
    r = await client.post(
        "/surveys/intake",
        headers={"X-Token": tok_b},
        json=_intake_body(rid),
    )
    assert r.status_code == 404


async def test_submit_intake_wrong_status_409(client, clean_db):
    tok, rid = await _create_and_approve_request(client, status="withdrawn")
    r = await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid),
    )
    assert r.status_code == 409


async def test_submit_intake_revision(client, clean_db):
    tok, rid = await _create_and_approve_request(client)
    r1 = await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid, family_size=3),
    )
    assert r1.status_code == 200
    r2 = await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid, family_size=5),
    )
    assert r2.status_code == 200
    assert r2.json()["revision"] is True
    assert r2.json()["survey_id"] == r1.json()["survey_id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT family_size, revision_count FROM intake_surveys WHERE request_id = $1",
            rid,
        )
    assert row["family_size"] == 5
    assert row["revision_count"] == 1


# ═══════════════════════════════════════════════════════════════════════
# Followup
# ═══════════════════════════════════════════════════════════════════════

async def test_followup_requires_collected(client, clean_db):
    tok, rid = await _create_and_approve_request(client)
    r = await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid),
    )
    survey_id = r.json()["survey_id"]
    # Request is still verified, not collected
    rf = await client.post(
        f"/surveys/{survey_id}/followup",
        headers={"X-Token": tok},
        json={"willing_to_give_back": True, "willing_channels": ["sms"]},
    )
    assert rf.status_code == 409


async def test_followup_happy(client, clean_db):
    tok, rid = await _create_and_approve_request(client)
    r = await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid),
    )
    survey_id = r.json()["survey_id"]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE requests SET status = 'collected' WHERE id = $1", rid)
    rf = await client.post(
        f"/surveys/{survey_id}/followup",
        headers={"X-Token": tok},
        json={
            "willing_to_give_back": True,
            "willing_channels": ["sms", "whatsapp"],
        },
    )
    assert rf.status_code == 200, rf.text
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT willing_to_give_back, willing_channels FROM intake_surveys WHERE id = $1",
            survey_id,
        )
    assert row["willing_to_give_back"] is True
    assert "sms" in row["willing_channels"]


# ═══════════════════════════════════════════════════════════════════════
# Aggregate + privacy
# ═══════════════════════════════════════════════════════════════════════

async def test_aggregate_excludes_non_consent(client, clean_db):
    tok, rid = await _create_and_approve_request(client)
    await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid, consent_to_aggregate=False),
    )
    r = await client.get("/surveys/aggregate")
    data = r.json()
    assert data["consenting_total"] == 0
    assert data["by_industry"] == []


async def test_aggregate_k_anonymity_suppresses_small_buckets(client, clean_db):
    # 1 consenting survey — below k=5, should be suppressed
    tok, rid = await _create_and_approve_request(client)
    await client.post(
        "/surveys/intake",
        headers={"X-Token": tok},
        json=_intake_body(rid, consent_to_aggregate=True, industry="informal"),
    )
    r = await client.get("/surveys/aggregate")
    data = r.json()
    # Bucket with 1 respondent should NOT appear (below k=5)
    for bucket in data["by_industry"]:
        assert bucket["count"] >= 5, f"Bucket below k-anonymity leaked: {bucket}"


# ═══════════════════════════════════════════════════════════════════════
# Status endpoint
# ═══════════════════════════════════════════════════════════════════════

async def test_status_reports_intake_available(client, clean_db):
    tok, rid = await _create_and_approve_request(client)
    r = await client.get(f"/surveys/status?request_id={rid}", headers={"X-Token": tok})
    assert r.status_code == 200
    body = r.json()
    assert body["has_intake"] is False
    assert body["can_submit_intake"] is True
    assert body["can_submit_followup"] is False
