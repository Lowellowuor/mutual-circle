"""USSD Webhook for Africa's Talking."""
from fastapi import APIRouter, Form
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ussd", tags=["ussd"])

@router.post("")
async def ussd_inbound(
    sessionId: str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...),
    text: str = Form(""),
):
    """Handles USSD session state machine from Africa's Talking."""
    logger.info(f"USSD session {sessionId} from {phoneNumber}: '{text}'")
    parts = text.split("*") if text else []
    
    if len(parts) == 0:
        response = "CON Welcome to Mutual Circle\n1. Food (Swap)\n2. Bills (Pool)\n3. Check Token"
    elif len(parts) == 1:
        if parts[0] == "1":
            response = "CON Select Locker Location:\n1. Kibera\n2. Mathare"
        elif parts[0] == "2":
            response = "CON Select Bill Type:\n1. Utility\n2. School\n3. Hospital"
        elif parts[0] == "3":
            response = "END Your request history has been sent via SMS."
        else:
            response = "END Invalid choice."
    elif len(parts) == 2:
        if parts[0] == "1":
            response = "END Locker reserved. You will receive a PIN via SMS."
        elif parts[0] == "2":
            response = "CON Enter the amount in KES:"
        else:
            response = "END Invalid session."
    elif len(parts) == 3:
        if parts[0] == "2":
            response = "CON Enter the account/meter number:"
        else:
            response = "END Invalid session."
    else:
        response = "END Request submitted successfully. You will receive a token via SMS."

    return response
