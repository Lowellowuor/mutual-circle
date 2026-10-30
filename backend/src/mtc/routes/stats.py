"""Public aggregate stats — driven entirely by database state.

Every number here is computed from real tables. If the ledger is empty,
returns zeros. If donations exist, sums reflect them. No mocks.
"""
import asyncpg
from fastapi import APIRouter, Depends

from mtc.db.main import get_conn

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/impact")
async def impact_stats(conn: asyncpg.Connection = Depends(get_conn)):
    total_pooled = await conn.fetchval("SELECT COALESCE(SUM(amount_pence), 0) FROM donor_contributions") or 0
    bundles = await conn.fetchval(
        "SELECT COUNT(*) FROM requests WHERE type = 'swap' AND status IN ('collected', 'verified')"
    ) or 0
    utility_meters = await conn.fetchval(
        "SELECT COUNT(*) FROM requests WHERE category = 'utility' AND status IN ('submitted_to_partner', 'voucher_issued', 'fulfilled')"
    ) or 0
    students = await conn.fetchval(
        "SELECT COUNT(*) FROM requests WHERE category = 'school_fee' AND status IN ('submitted_to_partner', 'voucher_issued', 'fulfilled')"
    ) or 0
    return {
        "total_pooled_pence": int(total_pooled),
        "bundles_delivered": int(bundles),
        "utility_meters_paid": int(utility_meters),
        "student_terms_paid": int(students),
    }


@router.get("/distribution")
async def distribution_stats(conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch(
        """
        SELECT category, COUNT(*) AS cnt, SUM(amount_pence) AS total
        FROM ledger_entries
        GROUP BY category
        """
    )
    totals = {
        "swap_bundle": 0,
        "utility": 0,
        "school_fee": 0,
        "hospital_invoice": 0,
    }
    counts = {k: 0 for k in totals}
    for r in rows:
        if r["category"] in totals:
            totals[r["category"]] = int(r["total"] or 0)
            counts[r["category"]] = int(r["cnt"] or 0)

    grand = sum(totals.values())

    def pct(x):
        return round((x / grand * 100), 1) if grand > 0 else 0.0

    return {
        "total_pence": grand,
        "by_category": [
            {
                "category": "swap_bundle",
                "label": "Food & hygiene",
                "count": counts["swap_bundle"],
                "total_pence": totals["swap_bundle"],
                "percentage": pct(totals["swap_bundle"]),
            },
            {
                "category": "utility",
                "label": "Utility bills",
                "count": counts["utility"],
                "total_pence": totals["utility"],
                "percentage": pct(totals["utility"]),
            },
            {
                "category": "school_fee",
                "label": "School fees",
                "count": counts["school_fee"],
                "total_pence": totals["school_fee"],
                "percentage": pct(totals["school_fee"]),
            },
            {
                "category": "hospital_invoice",
                "label": "Hospital bills",
                "count": counts["hospital_invoice"],
                "total_pence": totals["hospital_invoice"],
                "percentage": pct(totals["hospital_invoice"]),
            },
        ],
    }
