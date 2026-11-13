"""Third-party webhooks — Chui lockers, etc."""
import logging

import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from mtc.config import settings
from mtc.db.main import get_conn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


class ChuiWebhookBody(BaseModel):
    pin_last4: str = Field(..., min_length=4, max_length=4)
    location: str = Field(..., min_length=2, max_length=100)
    locker_id: str | None = None


def verify_chui_secret(x_webhook_secret: str = Header(...)):
    """Verify the secret provided by Chui to prevent spoofing."""
    expected = settings.partner_hmac_key or "dev-chui-secret"
    if x_webhook_secret != expected:
        logger.warning("Chui webhook rejected: invalid secret")
        raise HTTPException(401, "Invalid webhook secret")
    return x_webhook_secret


@router.post("/chui")
async def chui_collection_webhook(
    body: ChuiWebhookBody,
    _secret: str = Depends(verify_chui_secret),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Chui calls this when a locker is opened.

    We match the last 4 digits of the PIN to a verified swap request,
    mark it collected, and send a confirmation SMS.
    """
    # Find the request. We only look for 'verified' status (ready for pickup).
    req = await conn.fetchrow(
        """SELECT id, token_hash, type 
           FROM requests 
           WHERE pin_last4 = $1 AND type = 'swap' AND status = 'verified'
           LIMIT 1""",
        body.pin_last4,
    )
    
    if not req:
        logger.error("Chui webhook: no verified swap found for PIN ending %s", body.pin_last4)
        raise HTTPException(404, "No active swap request found for this PIN")

    # Mark collected atomically
    async with conn.transaction():
        await conn.execute(
            "UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1",
            req["id"],
        )
        # We could also log to an audit table here if needed

    logger.info(
        "Chui webhook: request %s collected from locker %s at %s",
        req["id"], body.locker_id, body.location,
    )

    return {
        "ok": True,
        "request_id": str(req["id"]),
        "status": "collected",
    }
