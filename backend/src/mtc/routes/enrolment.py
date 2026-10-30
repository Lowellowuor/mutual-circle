"""Enrolment role — intake health only, zero request details."""
from fastapi import APIRouter, Depends

import asyncpg

from mtc.auth.deps import require_role
from mtc.db.main import get_conn

router = APIRouter(prefix="/enrolment", tags=["enrolment"])
require_enrolment = require_role("enrolment")


@router.get("/metrics")
async def metrics(
    session: dict = Depends(require_enrolment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    tokens_today = await conn.fetchval(
        """SELECT COUNT(*) FROM requests WHERE created_at::date = CURRENT_DATE"""
    )
    rate_hits = await conn.fetchval(
        """SELECT COUNT(*) FROM rate_counters
           WHERE day = CURRENT_DATE AND (request_count > 25 OR total_value_pence > 10000000)"""
    )
    return {
        "tokens_today": int(tokens_today or 0),
        "rate_limit_hits_today": int(rate_hits or 0),
        "active_salt_id": "SHA256-WK43",
        "channels": {"web": 54, "sms": 31, "ussd": 15},
    }