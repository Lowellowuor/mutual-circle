"""USSD Webhook - Complete Flow with Collection and Status."""
from fastapi import APIRouter, Form, Depends
import asyncpg
import logging
import bcrypt
from mtc.db.main import get_conn
from mtc.tokens.hmac import issue_token
from mtc.requests_.swap import create_swap
from mtc.requests_.pool import create_pool
from mtc.vouchers.verify_pin import verify_and_redeem_pin

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
    logger.info("USSD session %s from %s: '%s'", sessionId, phoneNumber, text)
    parts = text.split("*") if text else []
    token = issue_token(phoneNumber)

    if len(parts) == 0 or parts == [""]:
        return (
            "CON Welcome to Mutual Circle\n"
            "1. Request Food (Swap)\n"
            "2. Pay Bill (Pool)\n"
            "3. Check Status\n"
            "4. Confirm Collection\n"
            "5. Family Size"
        )

    if len(parts) == 1:
        if parts[0] == "1":
            return "CON Select Locker Location:\n1. Kibera\n2. Mathare\n3. Kawangware"
        elif parts[0] == "2":
            return "CON Select Bill Type:\n1. Utility\n2. School\n3. Hospital"
        elif parts[0] == "3":
            # Check Status Flow
            row = await conn.fetchrow(
                "SELECT id, status, amount_pence FROM requests WHERE token_hash = $1 ORDER BY created_at DESC LIMIT 1",
                token
            )
            if not row:
                return "END You have no active requests."
            
            status_map = {
                "pending_check": "Under Review", "verified": "Verified",
                "submitted_to_partner": "Sent to Partner", "voucher_issued": "Voucher Ready",
                "fulfilled": "Fulfilled", "collected": "Collected", "withdrawn": "Withdrawn"
            }
            readable_status = status_map.get(row["status"], row["status"])
            return f"END Ref: {str(row['id'])[:8]}\nStatus: {readable_status}\nAmount: KES {row['amount_pence']//100}"
        elif parts[0] == "4":
            return "CON Enter the PIN given to you:"
        elif parts[0] == "5":
            return "CON How many people in your household? (1-15)"
        else:
            return "END Invalid choice."

    # --- COLLECTION FLOW (4 *) ---
    if parts[0] == "4" and len(parts) == 2:
        pin = parts[1]
        result = await verify_and_redeem_pin(conn, pin, source_hint="ussd")
        if not result:
            return "END Invalid or expired PIN. Please try again."
        return "END Collection confirmed. Thank you!"

    # --- SWAP FLOW (1 *) ---
    if parts[0] == "1":
        if len(parts) == 2:
            return "CON Select Bundle:\n1. Standard Pantry\n2. Hygiene Kit"
        elif len(parts) == 3:
            return "CON How many people in your household? (1-15)"
        elif len(parts) == 4:
            locations = {"1": "Kibera Hub", "2": "Mathare Central", "3": "Kawangware Station"}
            bundles = {"1": "Standard Pantry", "2": "Hygiene Kit"}
            loc = locations.get(parts[1])
            bundle = bundles.get(parts[2])
            if not loc or not bundle:
                return "END Invalid selection."
            try:
                size = int(parts[3])
                await conn.execute(
                    "INSERT INTO household_declarations (token_hash, household_size) VALUES ($1, $2) ON CONFLICT (token_hash) DO UPDATE SET household_size = EXCLUDED.household_size",
                    token, size
                )
                res = await create_swap(conn, token_hash=token, bundle_category=bundle, locker_location=loc, household_size=size)
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
                await create_pool(conn, token_hash=token, category=cat, hashed_object_id=hashed_obj, amount_pence=amount_pence)
                return "END Request submitted! We will notify you via SMS."
            except ValueError:
                return "END Invalid amount."
            except Exception as e:
                logger.error(f"USSD Pool failed: {e}")
                return "END Error: Could not submit bill."

    # --- FAMILY FLOW (5 *) ---
    if parts[0] == "5" and len(parts) == 2:
        try:
            size = int(parts[1])
            await conn.execute(
                "INSERT INTO household_declarations (token_hash, household_size) VALUES ($1, $2) ON CONFLICT (token_hash) DO UPDATE SET household_size = EXCLUDED.household_size",
                token, size
            )
            return f"END Household size updated to {size}."
        except Exception:
            return "END Invalid number."

    return "END Invalid session."