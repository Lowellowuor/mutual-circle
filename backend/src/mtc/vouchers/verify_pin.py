"""Unified PIN verification - checks both vouchers and swap requests.

R.U.T.H 4.2: Lockers use single-use PINs. Two PIN sources exist:
  - vouchers table: partner-issued vouchers (retailer, hospital)
  - requests.metadata: swap requests (locker pickups)

Both are bcrypt-hashed. This module provides a single function to
verify and redeem a PIN regardless of source.
"""
import logging
from typing import Any

import asyncpg
import bcrypt

logger = logging.getLogger(__name__)


async def verify_and_redeem_pin(
    conn: asyncpg.Connection,
    pin: str,
    *,
    source_hint: str,
) -> dict[str, Any] | None:
    """Verify a PIN against both tables. On success, marks as collected.

    Args:
        conn: asyncpg connection
        pin: the plaintext PIN entered by user/locker
        source_hint: 'locker' or 'ussd' or 'sms' — for audit trail

    Returns:
        dict with request_id and source ("voucher" | "swap") on success,
        None if PIN doesn't match any active request.
    """
    if not pin or len(pin) < 4:
        return None

    pin_last4 = pin[-4:]

    # 1. Try partner vouchers (retailer/hospital)
    voucher_rows = await conn.fetch(
        """SELECT id, request_id, pin_hash
           FROM vouchers
           WHERE pin_last4 = $1 AND status = 'active'""",
        pin_last4,
    )
    for v in voucher_rows:
        if bcrypt.checkpw(pin.encode(), v["pin_hash"].encode()):
            async with conn.transaction():
                await conn.execute(
                    "UPDATE vouchers SET status = 'redeemed' WHERE id = $1",
                    v["id"],
                )
                await conn.execute(
                    "UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1",
                    v["request_id"],
                )
                await conn.execute(
                    """INSERT INTO voucher_redemptions
                       (voucher_id, partner_name, amount_pence, status)
                       VALUES ($1, $2, 0, 'success')""",
                    v["id"], f"Redemption-{source_hint}",
                )
            logger.info(
                "PIN redeemed via %s: voucher %s -> request %s",
                source_hint, v["id"], v["request_id"],
            )
            return {"request_id": str(v["request_id"]), "source": "voucher"}

    # 2. Try swap requests (locker pickups)
    swap_rows = await conn.fetch(
        """SELECT id, metadata->>'pin_hash' AS pin_hash
           FROM requests
           WHERE pin_last4 = $1
             AND type = 'swap'
             AND status IN ('reserved', 'verified', 'submitted_to_partner', 'voucher_issued')""",
        pin_last4,
    )
    for r in swap_rows:
        stored_hash = r["pin_hash"]
        if not stored_hash:
            continue
        if bcrypt.checkpw(pin.encode(), stored_hash.encode()):
            async with conn.transaction():
                await conn.execute(
                    "UPDATE requests SET status = 'collected', updated_at = now() WHERE id = $1",
                    r["id"],
                )
            logger.info(
                "PIN redeemed via %s: swap request %s",
                source_hint, r["id"],
            )
            return {"request_id": str(r["id"]), "source": "swap"}

    return None