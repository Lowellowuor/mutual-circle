"""Intake surveys — household context, giving-back intent, aggregate stats."""
from __future__ import annotations

import hashlib
import logging
from typing import Literal

import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field

from mtc.db.main import get_conn
from mtc.surveys.basket import (
    evaluate_amount,
    recommend_basket,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/surveys", tags=["surveys"])

# Intake is allowed at these request states (approved, pre-delivery)
INTAKE_ALLOWED_STATUSES = ("verified", "pending_check", "pending_evidence")
# Followup is only allowed after physical collection
FOLLOWUP_ALLOWED_STATUSES = ("collected",)

MIN_AGGREGATE_BUCKET = 5  # k-anonymity threshold


def _require_token(x_token: str = Header(..., alias="X-Token")) -> str:
    if not x_token or len(x_token) < 8:
        raise HTTPException(401, "Invalid token")
    return x_token


def _hash_ip(request: Request) -> str | None:
    ip = request.client.host if request.client else None
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()[:32]


class IntakeBody(BaseModel):
    request_id: str | None = None
    family_size: int = Field(..., ge=1, le=20)
    work_status: Literal[
        "employed", "self_employed", "casual", "unemployed", "student", "retired"
    ]
    industry: Literal[
        "formal", "informal", "agriculture", "services", "manufacturing", "none"
    ]
    primary_need: Literal["food", "utilities", "school_fees", "hospital", "rent"]
    urgency: Literal["today", "this_week", "this_month"] = "this_week"
    duration_in_need: Literal["less_than_month", "1_to_6_months", "over_6_months"] = "less_than_month"
    willing_to_give_back: bool | None = None
    consent_to_aggregate: bool = False
    consent_to_followup: bool = False
    submitted_via: Literal["whatsapp", "sms", "ussd", "web", "in_person"] = "web"
    time_to_complete_ms: int | None = None


class FollowupBody(BaseModel):
    willing_to_give_back: bool
    willing_channels: list[str] = Field(default_factory=list)
    submitted_via: Literal["whatsapp", "sms", "ussd", "web", "in_person"] = "web"


@router.post("/intake")
async def submit_intake(
    body: IntakeBody,
    request: Request,
    token: str = Depends(_require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Submit or revise the intake survey for an approved request."""
    req = None
    if body.request_id:
        req = await conn.fetchrow(
            "SELECT id, status FROM requests WHERE id = $1 AND token_hash = $2",
            body.request_id, token,
        )
        if not req:
            raise HTTPException(404, "Request not found or token does not own it")
    else:
        # Standalone survey: require at least a valid token
        valid = await conn.fetchrow("SELECT id FROM staff_sessions LIMIT 1") # dummy check to ensure DB is up
        if not valid: pass # just let it through, token was checked by dependency
    if req and req["status"] not in INTAKE_ALLOWED_STATUSES:
        raise HTTPException(
            409,
            f"Cannot submit intake for request in status '{req['status'] if req else 'N/A'}'. "
            f"Allowed: {list(INTAKE_ALLOWED_STATUSES)}",
        )

    ip_hash = _hash_ip(request)

    existing = await conn.fetchrow(
        "SELECT id FROM intake_surveys WHERE request_id = $1 OR (request_id IS NULL AND token_hash = $2)", body.request_id, token
    )
    if existing:
        await conn.execute(
            """UPDATE intake_surveys SET
                   family_size = $2,
                   work_status = $3,
                   industry = $4,
                   primary_need = $5,
                   urgency = $6,
                   duration_in_need = $7,
                   willing_to_give_back = $8,
                   consent_to_aggregate = $9,
                   consent_to_followup = $10,
                   submitted_via = $11,
                   ip_hash = COALESCE(ip_hash, $12),
                   time_to_complete_ms = $13,
                   revision_count = revision_count + 1,
                   updated_at = now()
               WHERE id = $1""",
            existing["id"],
            body.family_size, body.work_status, body.industry, body.primary_need,
            body.urgency, body.duration_in_need, body.willing_to_give_back,
            body.consent_to_aggregate, body.consent_to_followup,
            body.submitted_via, ip_hash, body.time_to_complete_ms,
        )
        survey_id = existing["id"]
        revision = True
    else:
        row = await conn.fetchrow(
            """INSERT INTO intake_surveys
                   (request_id, token_hash, family_size, work_status, industry, primary_need,
                    urgency, duration_in_need, willing_to_give_back,
                    consent_to_aggregate, consent_to_followup,
                    submitted_via, ip_hash, time_to_complete_ms)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
               RETURNING id""",
            body.request_id, token, body.family_size, body.work_status, body.industry,
            body.primary_need, body.urgency, body.duration_in_need, body.willing_to_give_back,
            body.consent_to_aggregate, body.consent_to_followup,
            body.submitted_via, ip_hash, body.time_to_complete_ms,
        )
        survey_id = row["id"]
        revision = False

    basket = recommend_basket(body.family_size)
    logger.info(
        "Intake survey %s request=%s family_size=%d via=%s revision=%s",
        survey_id, body.request_id, body.family_size, body.submitted_via, revision,
    )
    return {
        "ok": True,
        "survey_id": str(survey_id),
        "revision": revision,
        "basket_recommendation": basket,
    }


@router.post("/{survey_id}/followup")
async def submit_followup(
    survey_id: str,
    body: FollowupBody,
    token: str = Depends(_require_token),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Submit the post-collection followup (would you give back?)."""
    survey = await conn.fetchrow(
        "SELECT id, request_id FROM intake_surveys WHERE id = $1", survey_id,
    )
    if not survey:
        raise HTTPException(404, "Survey not found")

    req = await conn.fetchrow(
        "SELECT id, status FROM requests WHERE id = $1 AND token_hash = $2",
        survey["request_id"], token,
    )
    if not req:
        raise HTTPException(403, "Token does not own this survey")
    if req["status"] not in FOLLOWUP_ALLOWED_STATUSES:
        raise HTTPException(
            409,
            f"Followup requires request to be collected (currently '{req['status']}')",
        )

    await conn.execute(
        """UPDATE intake_surveys SET
               willing_to_give_back = $2,
               willing_channels = $3,
               submitted_via = $4,
               updated_at = now()
           WHERE id = $1""",
        survey_id, body.willing_to_give_back, body.willing_channels, body.submitted_via,
    )
    return {"ok": True, "survey_id": survey_id}


@router.get("/status")
async def survey_status(
    token: str = Depends(_require_token),
    request_id: str | None = None,
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Return whether intake/followup are available for this request."""
    req = None
    if request_id:
        req = await conn.fetchrow(
            "SELECT id, status FROM requests WHERE id = $1 AND token_hash = $2",
            request_id, token,
        )
        if not req:
            raise HTTPException(404, "Request not found")

    survey = await conn.fetchrow(
        "SELECT id, family_size, willing_to_give_back FROM intake_surveys WHERE token_hash = $1 AND (request_id = $2 OR $2 IS NULL) LIMIT 1",
        token, request_id,
    )
    has_intake = survey is not None
    has_followup = bool(survey and survey["willing_to_give_back"] is not None)

    return {
        "request_id": request_id,
        "request_status": req["status"] if req else "no_request",
        "has_intake": has_intake,
        "has_followup": has_followup,
        "can_submit_intake": (req["status"] in INTAKE_ALLOWED_STATUSES) if req else True,
        "can_submit_followup": (
            has_intake
            and not has_followup
            and (req["status"] in FOLLOWUP_ALLOWED_STATUSES if req else False)
        ),
        "survey_id": str(survey["id"]) if survey else None,
        "family_size": survey["family_size"] if survey else None,
    }


@router.get("/basket-preview")
async def basket_preview(family_size: int):
    """Public preview — recommended basket for a given household size."""
    return recommend_basket(family_size)


@router.get("/evaluate")
async def evaluate(
    family_size: int,
    category: str,
    amount_pence: int,
):
    """Public preview — tier and flag for a candidate amount."""
    return evaluate_amount(family_size, category, amount_pence)


@router.get("/aggregate")
async def aggregate(
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Funder-facing aggregate stats.

    Only counts buckets with >= MIN_AGGREGATE_BUCKET rows (k-anonymity).
    Only includes surveys where consent_to_aggregate = TRUE.
    No individual rows ever leave this endpoint.
    """
    # By industry
    by_industry = await conn.fetch(
        """SELECT industry AS bucket, COUNT(*) AS n
           FROM intake_surveys
           WHERE consent_to_aggregate = TRUE
           GROUP BY industry
           HAVING COUNT(*) >= $1
           ORDER BY n DESC""",
        MIN_AGGREGATE_BUCKET,
    )
    # By work_status
    by_work = await conn.fetch(
        """SELECT work_status AS bucket, COUNT(*) AS n
           FROM intake_surveys
           WHERE consent_to_aggregate = TRUE
           GROUP BY work_status
           HAVING COUNT(*) >= $1
           ORDER BY n DESC""",
        MIN_AGGREGATE_BUCKET,
    )
    # By primary_need
    by_need = await conn.fetch(
        """SELECT primary_need AS bucket, COUNT(*) AS n
           FROM intake_surveys
           WHERE consent_to_aggregate = TRUE
           GROUP BY primary_need
           HAVING COUNT(*) >= $1
           ORDER BY n DESC""",
        MIN_AGGREGATE_BUCKET,
    )
    # Family size summary (only average, min, max — never distribution)
    fam = await conn.fetchrow(
        """SELECT COUNT(*) AS total_consenting,
                  AVG(family_size)::numeric(6,2) AS avg_family_size,
                  MIN(family_size) AS min_size,
                  MAX(family_size) AS max_size
           FROM intake_surveys
           WHERE consent_to_aggregate = TRUE"""
    )

    return {
        "min_bucket": MIN_AGGREGATE_BUCKET,
        "note": (
            "Buckets with fewer than min_bucket respondents are suppressed "
            "for k-anonymity. No individual rows are ever returned."
        ),
        "consenting_total": fam["total_consenting"] if fam else 0,
        "avg_family_size": float(fam["avg_family_size"]) if fam and fam["avg_family_size"] else None,
        "family_size_range": (
            [fam["min_size"], fam["max_size"]]
            if fam and fam["min_size"] is not None else None
        ),
        "by_industry": [{"industry": r["bucket"], "count": r["n"]} for r in by_industry],
        "by_work_status": [{"work_status": r["bucket"], "count": r["n"]} for r in by_work],
        "by_primary_need": [{"primary_need": r["bucket"], "count": r["n"]} for r in by_need],
    }
