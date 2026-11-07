"""Locker Partner Webhook - Collection Callback."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
import logging

from mtc.db.main import get_conn
from mtc.vouchers.verify_pin import verify_and_redeem_pin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/locker", tags=["locker"])


class CollectionEvent(BaseModel):
    locker_id: str
    pin: str


@router.post("/collection-callback")
async def collection_callback(
    event: CollectionEvent,
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Called by the locker hardware/API when a door is opened."""
    logger.info(
        "Locker %s reports collection with PIN ending in ...%s",
        event.locker_id, event.pin[-4:] if event.pin else "----",
    )

    result = await verify_and_redeem_pin(conn, event.pin, source_hint=f"locker:{event.locker_id}")
    if not result:
        logger.warning(
            "Locker %s: invalid or expired PIN (ending ...%s)",
            event.locker_id, event.pin[-4:] if event.pin else "----",
        )
        raise HTTPException(404, "Invalid or expired PIN")

    logger.info(
        "Locker collection success: %s source=%s request=%s",
        event.locker_id, result["source"], result["request_id"],
    )
    return {"status": "success", **result}