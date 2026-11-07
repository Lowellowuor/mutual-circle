"""SMS Webhook for Africa's Talking."""
from fastapi import APIRouter, Depends, Form
from mtc.db.main import get_conn
import asyncpg
import logging
from mtc.tokens.hmac import issue_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sms", tags=["sms"])

@router.post("")
async def sms_inbound(
    from_: str = Form(..., alias="from"),
    text: str = Form(...),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Handles incoming SMS from Africa's Talking."""
    logger.info(f"SMS received from {from_}: {text}")
    
    token = issue_token(from_)
    text_lower = text.strip().lower()
    
    if text_lower in ("help", "menu"):
        reply = "Reply 1 for a Swap (food), 2 for the Pool (bills), 3 for your token."
    elif text_lower == "1":
        reply = "You selected Swap. Please go to the web portal to reserve a locker."
    elif text_lower == "2":
        reply = "You selected Pool. Please go to the web portal to request a bill payment."
    elif text_lower == "3":
        reply = f"Your anonymous token is: {token[:8]}..."
    else:
        reply = "Reply HELP for options."
        
    return {"reply": reply}
