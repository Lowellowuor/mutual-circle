"""Voucher redemption at the partner till.

Public endpoint — a partner till scans a PIN + amount, calls this, gets a
success/fail. PINs are bcrypt-checked; the pin_last4 hint narrows the search
without exposing the full code in the DB.
"""
from datetime import datetime, timezone

import asyncpg
import bcrypt

from mtc.audit.log import append_audit


async def redeem_voucher(
    conn: asyncpg.Connection,
    *,
    pin: str,
    partner_name: str,
    amount_pence: int,
) -> dict:
    if not pin.isdigit() or len(pin) != 6:
        return {"ok": False, "reason": "PIN must be 6 digits"}
    if amount_pence <= 0:
        return {"ok": False, "reason": "Amount must be positive"}

    pin_last4 = pin[-4:]

    async with conn.transaction():
        # Narrow by (partner, pin_last4, status) — usually a single row
        candidates = await conn.fetch(
            """SELECT * FROM vouchers
               WHERE partner_name = $1 AND pin_last4 = $2 AND status IN ('active', 'redeemed')
               ORDER BY created_at DESC""",
            partner_name, pin_last4,
        )

        matched = None
        locked = False
        for v in candidates:
            if v["locked_until"] and v["locked_until"] > datetime.now(timezone.utc):
                locked = True
                continue
            
            if bcrypt.checkpw(pin.encode(), v["pin_hash"].encode()):
                matched = v
                break

        if matched is None:
            if locked:
                return {"ok": False, "reason": "Voucher is locked due to multiple failed attempts. Try again in 15 minutes."}

            # A3-b: Increment failed_attempts for any active vouchers matching this pin_last4
            # to prevent brute-forcing the full 6-digit PIN.
            # If they hit 3, lock the voucher for 15 minutes.
            candidates_to_lock = await conn.fetch(
                "SELECT id, failed_attempts FROM vouchers WHERE partner_name = $1 AND pin_last4 = $2 AND status = 'active'",
                partner_name, pin_last4
            )
            for v in candidates_to_lock:
                new_attempts = v["failed_attempts"] + 1
                if new_attempts >= 3:
                    await conn.execute(
                        "UPDATE vouchers SET failed_attempts = 0, locked_until = now() + interval '15 minutes' WHERE id = $1",
                        v["id"]
                    )
                else:
                    await conn.execute(
                        "UPDATE vouchers SET failed_attempts = $1 WHERE id = $2",
                        new_attempts, v["id"]
                    )

            await conn.execute(
                """INSERT INTO voucher_redemptions (voucher_id, partner_name, amount_pence, status)
                   SELECT id, $1, $2, 'invalid' FROM vouchers WHERE pin_last4 = $3 LIMIT 1""",
                partner_name, amount_pence, pin_last4,
            )
            return {"ok": False, "reason": "PIN not valid at this partner"}

        if matched["status"] == "redeemed":
            await conn.execute(
                "INSERT INTO voucher_redemptions (voucher_id, partner_name, amount_pence, status) VALUES ($1, $2, $3, 'already_redeemed')",
                matched["id"], partner_name, amount_pence,
            )
            return {"ok": False, "reason": "Voucher already redeemed"}

        if matched["expires_at"] < datetime.now(timezone.utc):
            await conn.execute(
                "INSERT INTO voucher_redemptions (voucher_id, partner_name, amount_pence, status) VALUES ($1, $2, $3, 'expired')",
                matched["id"], partner_name, amount_pence,
            )
            return {"ok": False, "reason": "Voucher expired"}

        if amount_pence > matched["max_value_pence"]:
            await conn.execute(
                "INSERT INTO voucher_redemptions (voucher_id, partner_name, amount_pence, status) VALUES ($1, $2, $3, 'exceeds_value')",
                matched["id"], partner_name, amount_pence,
            )
            return {
                "ok": False,
                "reason": f"Amount exceeds voucher limit (KES {matched['max_value_pence'] // 100:,})",
            }

        await conn.execute(
            "UPDATE vouchers SET status = 'redeemed', failed_attempts = 0, locked_until = NULL WHERE id = $1",
            matched["id"],
        )
        await conn.execute(
            "INSERT INTO voucher_redemptions (voucher_id, partner_name, amount_pence, status) VALUES ($1, $2, $3, 'success')",
            matched["id"], partner_name, amount_pence,
        )
    # Transition the linked request to 'collected' (voucher redemption = delivery)
    if matched["request_id"]:
        from mtc.notifications.service import notify
        await conn.execute(
            """UPDATE requests SET status = 'collected', updated_at = now()
               WHERE id = $1 AND status IN ('voucher_issued', 'verified', 'pending_check')""",
            matched["request_id"],
        )
        await notify(
            conn,
            matched["token_hash"],
            str(matched["request_id"]),
            "pool_collected",
            {
                "partner": partner_name,
                "ref": "REF-" + str(matched["request_id"])[:8].upper(),
            },
        )
        await append_audit(
            conn, actor_role="system", actor_id=None,
            action=f"Voucher redeemed at {partner_name} (KES {amount_pence // 100:,})",
            target_hash=matched["token_hash"],
            metadata={"voucher_id": str(matched["id"]), "amount_pence": amount_pence},
        )

    return {"ok": True, "voucher_id": str(matched["id"])}