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
    if not pin.isdigit() or len(pin) != 4:
        return {"ok": False, "reason": "PIN must be 4 digits"}
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
        for v in candidates:
            if bcrypt.checkpw(pin.encode(), v["pin_hash"].encode()):
                matched = v
                break

        if matched is None:
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
            "UPDATE vouchers SET status = 'redeemed' WHERE id = $1",
            matched["id"],
        )
        await conn.execute(
            "INSERT INTO voucher_redemptions (voucher_id, partner_name, amount_pence, status) VALUES ($1, $2, $3, 'success')",
            matched["id"], partner_name, amount_pence,
        )
        await append_audit(
            conn, actor_role="system", actor_id=None,
            action=f"Voucher redeemed at {partner_name} (KES {amount_pence // 100:,})",
            target_hash=matched["token_hash"],
            metadata={"voucher_id": str(matched["id"]), "amount_pence": amount_pence},
        )

    return {"ok": True, "voucher_id": str(matched["id"])}