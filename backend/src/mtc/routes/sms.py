"""SMS Webhook for Africa's Talking - Menu-Driven State Machine."""
from fastapi import APIRouter, Depends, Form
import asyncpg
import logging
import json
import bcrypt
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
    """Stateful SMS menu. Users reply with numbers to navigate."""
    logger.info("SMS received from %s: %s", from_, text)

    token = issue_token(from_)
    msg = text.strip()

    session = await conn.fetchrow(
        "SELECT * FROM sms_sessions WHERE token_hash = $1", token
    )

    if not session:
        step = "MENU"
        ctx = {}
    else:
        step = session["current_step"]
        raw_ctx = session["context"]
        ctx = raw_ctx if isinstance(raw_ctx, dict) else json.loads(raw_ctx or "{}")

    async def save_state(new_step, new_ctx):
        await conn.execute(
            """INSERT INTO sms_sessions (token_hash, current_step, context, updated_at)
               VALUES ($1, $2, $3, now())
               ON CONFLICT (token_hash) DO UPDATE
               SET current_step = EXCLUDED.current_step,
                   context = EXCLUDED.context,
                   updated_at = now()""",
            token, new_step, json.dumps(new_ctx),
        )

    async def clear_state():
        await conn.execute("DELETE FROM sms_sessions WHERE token_hash = $1", token)

    # Global reset
    if msg.upper() in ("CANCEL", "STOP", "RESET", "MENU", "HELP", "0"):
        await clear_state()
        return {"reply": "Welcome to Mutual Circle.\nReply:\n1. Request Food\n2. Pay Bill\n3. My Token\n4. Family Size\n\n(You can also text STATUS or COLLECT <PIN>)"}

    # Main menu

    # --- GLOBAL COMMANDS ---
    if msg.upper().startswith("COLLECT "):
        pin = msg.split(" ", 1)[1].strip()
        pin_last4 = pin[-4:]
        rows = await conn.fetch(
            "SELECT id, request_id, pin_hash FROM vouchers WHERE pin_last4 = $1 AND status = 'active'",
            pin_last4
        )
        matched = None
        for r in rows:
            if bcrypt.checkpw(pin.encode(), r["pin_hash"].encode()):
                matched = r
                break
        if not matched:
            return {"reply": "Invalid or expired PIN."}
        async with conn.transaction():
            await conn.execute("UPDATE vouchers SET status = 'redeemed' WHERE id = $1", matched["id"])
            await conn.execute("UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1", matched["request_id"])
            await conn.execute(
                "INSERT INTO voucher_redemptions (voucher_id, partner_name, amount_pence, status) VALUES ($1, 'SMS Agent', 0, 'success')",
                matched["id"]
            )
        return {"reply": "Collection confirmed. Thank you!"}

    if msg.upper() == "STATUS":
        row = await conn.fetchrow(
            "SELECT id, status, amount_pence FROM requests WHERE token_hash = $1 ORDER BY created_at DESC LIMIT 1",
            token
        )
        if not row:
            return {"reply": "You have no active requests."}
        status_map = {
            "pending_check": "Under Review", "verified": "Verified",
            "submitted_to_partner": "Sent to Partner", "voucher_issued": "Voucher Ready",
            "fulfilled": "Fulfilled", "collected": "Collected", "withdrawn": "Withdrawn"
        }
        readable_status = status_map.get(row["status"], row["status"])
        return {"reply": f"Ref: {str(row['id'])[:8]}\nStatus: {readable_status}\nAmount: KES {row['amount_pence']//100}"}


    if step == "MENU":
        if msg == "1":
            await save_state("SWAP_LOC", {})
            return {"reply": "Select Locker Location:\n1. Kibera\n2. Mathare\n3. Kawangware"}
        elif msg == "2":
            await save_state("POOL_TYPE", {})
            return {"reply": "Select Bill Type:\n1. Utility\n2. School\n3. Hospital"}
        elif msg == "3":
            await clear_state()
            return {"reply": "Your anonymous token is: " + token + ". Keep this safe."}
        elif msg == "4":
            await save_state("FAMILY_SIZE", {})
            return {"reply": "How many people in your household? (Reply with a number 1-15)"}
        else:
            return {"reply": "Invalid choice. Reply 1, 2, 3, or 4. (Also try STATUS or COLLECT <PIN>)"}

    # Swap flow
    elif step == "SWAP_LOC":
        locations = {"1": "Kibera Hub", "2": "Mathare Central", "3": "Kawangware Station"}
        if msg in locations:
            ctx["location"] = locations[msg]
            await save_state("SWAP_BUNDLE", ctx)
            return {"reply": "Select Bundle:\n1. Standard Pantry\n2. Hygiene Kit"}
        return {"reply": "Invalid. Reply 1, 2, or 3."}

    elif step == "SWAP_BUNDLE":
        bundles = {"1": "Standard Pantry", "2": "Hygiene Kit"}
        if msg in bundles:
            ctx["bundle"] = bundles[msg]
            await save_state("SWAP_HH", ctx)
            return {"reply": "How many people in your household? (1-15)"}
        return {"reply": "Invalid. Reply 1 or 2."}

    elif step == "SWAP_HH":
        try:
            size = int(msg)
            if size < 1 or size > 15:
                raise ValueError
        except ValueError:
            return {"reply": "Invalid number. Reply with a number between 1 and 15."}

        await conn.execute(
            """INSERT INTO household_declarations (token_hash, household_size)
               VALUES ($1, $2)
               ON CONFLICT (token_hash) DO UPDATE SET household_size = EXCLUDED.household_size""",
            token, size,
        )
        try:
            res = await create_swap(
                conn,
                token_hash=token,
                bundle_category=ctx["bundle"],
                locker_location=ctx["location"],
            )
            await clear_state()
            return {"reply": "Success! Locker reserved at " + ctx["location"] + ".\nPIN: " + str(res["pin"])}
        except Exception as e:
            logger.error("SMS Swap failed: %s", e)
            await clear_state()
            return {"reply": "System error. Please reply MENU to start over."}

    # Pool flow
    elif step == "POOL_TYPE":
        cats = {"1": "utility", "2": "school_fee", "3": "hospital_invoice"}
        if msg in cats:
            ctx["category"] = cats[msg]
            await save_state("POOL_AMOUNT", ctx)
            return {"reply": "Enter amount in KES (e.g. 500):"}
        return {"reply": "Invalid. Reply 1, 2, or 3."}

    elif step == "POOL_AMOUNT":
        try:
            amount = float(msg)
            if amount <= 0:
                raise ValueError
        except ValueError:
            return {"reply": "Invalid amount. Reply with a number."}
        ctx["amount_pence"] = int(amount * 100)
        await save_state("POOL_ACC", ctx)
        return {"reply": "Enter the account/meter/invoice number:"}

    elif step == "POOL_ACC":
        if not msg:
            return {"reply": "Invalid. Please reply with the account number."}
        ctx["hashed_object_id"] = msg
        try:
            await create_pool(
                conn,
                token_hash=token,
                category=ctx["category"],
                hashed_object_id=ctx["hashed_object_id"],
                amount_pence=ctx["amount_pence"],
            )
            await clear_state()
            return {"reply": "Request submitted! We will notify you when it is fulfilled."}
        except Exception as e:
            logger.error("SMS Pool failed: %s", e)
            await clear_state()
            return {"reply": "System error. Please reply MENU to start over."}

    # Family size flow
    elif step == "FAMILY_SIZE":
        try:
            size = int(msg)
            if size < 1 or size > 15:
                raise ValueError
        except ValueError:
            return {"reply": "Invalid number. Reply with a number 1-15."}

        await conn.execute(
            """INSERT INTO household_declarations (token_hash, household_size)
               VALUES ($1, $2)
               ON CONFLICT (token_hash) DO UPDATE SET household_size = EXCLUDED.household_size""",
            token, size,
        )
        await clear_state()
        return {"reply": "Household size updated to " + str(size) + "."}

    # Fallback
    await clear_state()
    return {"reply": "Session expired. Reply MENU to start over."}