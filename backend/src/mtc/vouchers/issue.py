"""Voucher issuance — Fulfilment issues a PIN from a verified pool request.

Section 4.5: retailer or hospital vouchers, redeemed at the till with the
same anonymous PIN mechanism. PINs are bcrypt-hashed so even a leaked DB
doesn't expose redeemable codes.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone

import asyncpg
import bcrypt

from mtc.audit.log import append_audit

logger = logging.getLogger(__name__)

VOUCHER_VALID_DAYS = 30


class VoucherConflict(Exception):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


async def issue_voucher(
    conn: asyncpg.Connection,
    *,
    request_id: str,
    partner_name: str,
    partner_type: str,
    staff_id: str,
) -> dict:
    if partner_type not in ("retailer", "hospital"):
        raise VoucherConflict("partner_type must be 'retailer' or 'hospital'")

    async with conn.transaction():
        req = await conn.fetchrow("SELECT * FROM requests WHERE id = $1 FOR UPDATE", request_id)
        if req is None:
            raise LookupError(f"Request not found: {request_id}")
        if req["type"] != "pool":
            raise VoucherConflict("Vouchers only apply to pool requests")
        if req["status"] != "verified":
            raise VoucherConflict(f"Voucher requires status 'verified', got '{req['status']}'")

        pin = f"{secrets.randbelow(10000):04d}"
        pin_hash = bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode("utf-8")
        pin_last4 = pin[-4:]
        expires_at = datetime.now(timezone.utc) + timedelta(days=VOUCHER_VALID_DAYS)

        row = await conn.fetchrow(
            """INSERT INTO vouchers
               (request_id, token_hash, partner_name, partner_type, description,
                max_value_pence, pin_hash, pin_last4, expires_at, issued_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               RETURNING id, created_at""",
            request_id, req["token_hash"], partner_name, partner_type,
            req["category"].replace("_", " "),
            req["amount_pence"], pin_hash, pin_last4, expires_at, staff_id,
        )

        await conn.execute(
            "UPDATE requests SET status = 'voucher_issued', updated_at = now() WHERE id = $1",
            request_id,
        )

        await append_audit(
            conn, actor_role="fulfilment", actor_id=staff_id,
            action=f"Issued voucher for {request_id} at {partner_name}",
            target_hash=req["hashed_object_id"],
            metadata={"voucher_id": str(row["id"]), "amount_pence": req["amount_pence"]},
        )

    return {
        "voucher_id": str(row["id"]),
        "pin": pin,
        "pin_last4": pin_last4,
        "partner_name": partner_name,
        "partner_type": partner_type,
        "max_value_pence": req["amount_pence"],
        "expires_at": expires_at.isoformat(),
    }


async def list_vouchers_for_token(conn: asyncpg.Connection, *, token_hash: str) -> list[dict]:
    rows = await conn.fetch(
        """SELECT id, partner_name, partner_type, description, max_value_pence,
                  pin_last4, status, expires_at, created_at
           FROM vouchers WHERE token_hash = $1
           ORDER BY created_at DESC""",
        token_hash,
    )
    return [
        {
            "voucher_id": str(r["id"]),
            "partner_name": r["partner_name"],
            "partner_type": r["partner_type"],
            "description": r["description"],
            "max_value_pence": r["max_value_pence"],
            "pin_last4": r["pin_last4"],
            "status": r["status"],
            "expires_at": r["expires_at"].isoformat(),
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]