"""USSD Webhook for Africa's Talking - Complete Flow."""
from fastapi import APIRouter, Form, Depends
import asyncpg
import logging
from mtc.db.main import get_conn
from mtc.tokens.hmac import issue_token
from mtc.requests_.swap import create_swap
from mtc.requests_.pool import create_pool

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ussd", tags=["ussd"])

@router.post("")
async def ussd_inbound(
    sessionId: str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...),
    text: str = Form(""),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Complete USSD state machine backed by real DB actions."""
    logger.info(f"USSD session {sessionId} from {phoneNumber}: '{text}'")
    
    parts = text.split("*") if text else []
    token = issue_token(phoneNumber)
    
    # --- MENU LEVEL 0 ---
    if len(parts) == 0 or parts == [""]:
        return (
            "CON Welcome to Mutual Circle\n"
            "1. Request Food (Swap)\n"
            "2. Pay Bill (Pool)\n"
            "3. Check Token\n"
            "4. Household Size"
        )

    # --- MENU LEVEL 1 ---
    if len(parts) == 1:
        if parts[0] == "1":
            return (
                "CON Select Locker Location:\n"
                "1. Kibera Hub\n"
                "2. Mathare Central\n"
                "3. Kawangware Station"
            )
        elif parts[0] == "2":
            return (
                "CON Select Bill Type:\n"
                "1. Utility\n"
                "2. School Fees\n"
                "3. Hospital Invoice"
            )
        elif parts[0] == "3":
            return f"END Your anonymous token is:\n{token}\nKeep this safe."
        elif parts[0] == "4":
            return "CON How many people are in your household? (1-15)"
        else:
            return "END Invalid choice."

    # --- HOUSEHOLD FLOW (4 *) ---
    if parts[0] == "4" and len(parts) == 2:
        try:
            size = int(parts[1])
            await conn.execute(
                """INSERT INTO household_declarations (token_hash, size)
                   VALUES ($1, $2) ON CONFLICT (token_hash) DO UPDATE SET size = EXCLUDED.size""",
                token, size
            )
            return f"END Household size updated to {size}."
        except Exception:
            return "END Invalid number. Please try again."

    # --- SWAP FLOW (1 *) ---
    if parts[0] == "1":
        if len(parts) == 2:
            return "CON Select Bundle:\n1. Standard Pantry\n2. Hygiene Kit"
        elif len(parts) == 3:
            # NEW STEP: Ask for family size before confirming
            return "CON How many people in your household? (1-15)"
        elif len(parts) == 4:
            locations = {"1": "Kibera Hub", "2": "Mathare Central", "3": "Kawangware Station"}
            bundles = {"1": "Standard Pantry", "2": "Hygiene Kit"}
            loc = locations.get(parts[1])
            bundle = bundles.get(parts[2])
            
            if not loc or not bundle:
                return "END Invalid selection."
                
            try:
                # Save family size first
                size = int(parts[3])
                await conn.execute(
                    """INSERT INTO household_declarations (token_hash, size)
                       VALUES ($1, $2) ON CONFLICT (token_hash) DO UPDATE SET size = EXCLUDED.size""",
                    token, size
                )
                
                # Create the swap
                res = await create_swap(conn, token_hash=token, bundle_category=bundle, locker_location=loc)
                return f"END Success! Locker reserved.\nPIN: {res['pin']}\nShow this at the locker."
            except ValueError:
                return "END Invalid number."
            except Exception as e:
                logger.error(f"USSD Swap failed: {e}")
                return "END Error: Could not reserve locker."

    # --- POOL FLOW (2 *) ---
    if parts[0] == "2":
        if len(parts) == 2:
            return "CON Enter amount in KES (e.g. 500):"
        elif len(parts) == 3:
            return "CON Enter the account/meter/invoice number:"
        elif len(parts) == 4:
            categories = {"1": "utility", "2": "school_fee", "3": "hospital_invoice"}
            cat = categories.get(parts[1])
            
            try:
                amount_pence = int(float(parts[2]) * 100)
                hashed_obj = parts[3]
                
                await create_pool(
                    conn, token_hash=token, category=cat, 
                    hashed_object_id=hashed_obj, amount_pence=amount_pence
                )
                return "END Request submitted! We will notify you via SMS."
            except ValueError:
                return "END Invalid amount."
            except Exception as e:
                logger.error(f"USSD Pool failed: {e}")
                return "END Error: Could not submit bill."

    return "END Invalid session."
