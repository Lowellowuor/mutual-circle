"""Campaigns — public read, cohort-level giving."""
import asyncpg
from fastapi import APIRouter, Depends

from mtc.db.main import get_conn

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("")
async def list_campaigns(conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch("SELECT * FROM campaigns ORDER BY created_at ASC")
    return {
        "campaigns": [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "cohortGoalText": r["cohort_goal_text"],
                "targetAmount": r["target_amount_pence"] // 100,
                "pooledAmount": r["pooled_amount_pence"] // 100,
                "targetCount": r["target_count"],
                "coveredCount": r["covered_count"],
                "daysRemaining": r["days_remaining"],
                "isClosed": r["is_closed"],
            }
            for r in rows
        ]
    }
