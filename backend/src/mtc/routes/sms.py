"""SMS Webhook for Africa's Talking - Complete Flow."""
from fastapi import APIRouter, Depends, Form
import asyncpg
import logging
from mtc.db.main import get_conn
from mtc.tokens.hmac import issue_token
from mtc.requests_.swap import create_swap
from mtc.requests_.pool import create_pool

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sms", tags=["sms"])

@router.post("")
async def sms_inbound(
    from_: str = Form(..., alias="from"),
    text: str = Form(...),
    conn: asyncpg.Connection = Depends(get_conn),
):
    logger.info(f"SMS received from {from_}: {text}")
    
    token = issue_token(from_)
    words = text.strip().upper().split()
    
    if not words:
        return {"reply": "Reply with SWAP, POOL, TOKEN, or FAMILY."}

    command = words[0]

    # --- FAMILY / HOUSEHOLD COMMAND ---
    # Format: FAMILY 4
    if command in ("FAMILY", "HOUSEHOLD"):
        if len(words) < 2:
            return {"reply": "Reply with: FAMILY [number]. Example: FAMILY 4"}
        try:
            size = int(words[1])
            await conn.execute(
                """INSERT INTO household_declarations (token_hash, size)
                   VALUES ($1, $2) ON CONFLICT (token_hash) DO UPDATE SET size = EXCLUDED.size""",
                token, size
            )
            return {"reply": f"Household size updated to {size}."}
        except ValueError:
            return {"reply": "Invalid number. Reply with: FAMILY 4"}

    # --- SWAP COMMAND ---
    elif command == "SWAP":
        if len(words) < 2:
            return {"reply": "Reply with your location: SWAP KIBERA, SWAP MATHARE, or SWAP KAWANGWARE."}
        
        loc_code = words[1]
        locations = {"KIBERA": "Kibera Hub", "MATHARE": "Mathare Central", "KAWANGWARE": "Kawangware Station"}
        loc = locations.get(loc_code)
        
        if not loc:
            return {"reply": "Invalid location. Reply SWAP KIBERA, SWAP MATHARE, or SWAP KAWANGWARE."}
            
        try:
            res = await create_swap(conn, token_hash=token, bundle_category="Standard Pantry", locker_location=loc)
            return {"reply": f"Locker reserved at {loc}! PIN: {res['pin']}. Show this SMS at the locker."}
        except Exception as e:
            logger.error(f"SMS Swap failed: {e}")
            return {"reply": "System error. Please try again later."}

    # --- POOL COMMAND ---
    elif command == "POOL":
        if len(words) < 4:
            return {"reply": "Reply: POOL [TYPE] [AMOUNT] [ACCOUNT]. Example: POOL UTILITY 500 12345678."}
            
        cat_code = words[1]
        categories = {"UTILITY": "utility", "SCHOOL": "school_fee", "HOSPITAL": "hospital_invoice"}
        cat = categories.get(cat_code)
        
        if not cat:
            return {"reply": "Invalid type. Use UTILITY, SCHOOL, or HOSPITAL."}
            
        try:
            amount_pence = int(float(words[2]) * 100)
            hashed_obj = words[3]
            
            await create_pool(conn, token_hash=token, category=cat, hashed_object_id=hashed_obj, amount_pence=amount_pence)
            return {"reply": f"Bill request for {cat_code} KES {words[2]} submitted. We will notify you when fulfilled."}
        except ValueError:
            return {"reply": "Invalid amount."}
        except Exception as e:
            logger.error(f"SMS Pool failed: {e}")
            return {"reply": "System error. Please try again later."}

    # --- TOKEN COMMAND ---
    elif command == "TOKEN":
        return {"reply": f"Your anonymous token is: {token}. Keep this safe."}

    else:
        return {"reply": "Reply with SWAP, POOL, TOKEN, or FAMILY for help."}
