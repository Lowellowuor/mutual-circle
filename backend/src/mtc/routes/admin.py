"""Admin — depot state, locker stock, dedup (staff roles only)."""
import asyncpg
from fastapi import APIRouter, Depends

from mtc.auth.deps import get_current_session
from mtc.db.main import get_conn

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/depot")
async def depot(
    session: dict = Depends(get_current_session),
    conn: asyncpg.Connection = Depends(get_conn),
):
    r = await conn.fetchrow("SELECT * FROM depot_state LIMIT 1")
    if r is None:
        return {"receivedUnits": 0, "qualityCheckedUnits": 0, "packedBundles": 0, "loadedLockerUnits": 0}
    return {
        "receivedUnits": r["received_units"],
        "qualityCheckedUnits": r["quality_checked_units"],
        "packedBundles": r["packed_bundles"],
        "loadedLockerUnits": r["loaded_locker_units"],
    }


@router.get("/locker-stock")
async def locker_stock(
    session: dict = Depends(get_current_session),
    conn: asyncpg.Connection = Depends(get_conn),
):
    rows = await conn.fetch("SELECT * FROM locker_stock ORDER BY location, bundle_type")
    return {
        "stocks": [
            {
                "location": r["location"],
                "bundleType": r["bundle_type"],
                "available": r["available"],
                "capacity": r["capacity"],
                "lowStockThreshold": r["low_stock_threshold"],
            }
            for r in rows
        ]
    }


@router.get("/dedup")
async def dedup(
    session: dict = Depends(get_current_session),
    conn: asyncpg.Connection = Depends(get_conn),
):
    rows = await conn.fetch("SELECT * FROM dedup_items ORDER BY created_at DESC")
    return {
        "items": [
            {
                "id": str(r["id"]),
                "hashedObjectId": r["hashed_object_id"],
                "objectType": r["object_type"],
                "firstFundedBy": r["first_funded_by"],
                "firstFundedDate": r["first_funded_date"].isoformat(),
                "duplicateAttemptDate": r["duplicate_attempt_date"].isoformat(),
                "status": r["status"],
            }
            for r in rows
        ]
    }
