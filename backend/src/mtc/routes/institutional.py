"""Institutional payments — direct KPLC / school / hospital disbursement.

R.U.T.H 4.3: The Pool pays institutions directly. The requester never
receives cash for bills. This module handles the admin-side flow:

  1. Requester submits a utility bill request (existing route)
  2. Audit approves it (existing route)
  3. Fulfilment staff performs a bank transfer to the institution
  4. Staff records the payment + KPLC token via POST /admin/institutional-payments
  5. System sends the KPLC token to the requester via SMS
  6. Request is marked 'fulfilled'

Payments review #2 (no requester-pays) is enforced here: only fulfilment
staff can trigger a payment. Requesters cannot.
"""
import logging
from typing import Literal

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from mtc.crypto import decrypt_phone
from mtc.db.main import get_conn
from mtc.sms.service import send_sms
from mtc.auth.deps import require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin-institutional"])
require_fulfilment = require_role("fulfilment")


# ─── Schemas ────────────────────────────────────────────────────────────────

class InstitutionBody(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: Literal["utility", "school", "hospital"]
    paybill_number: str | None = Field(None, max_length=20)
    account_number: str | None = Field(None, max_length=40)


class ConfirmPaymentBody(BaseModel):
    bank_transaction_ref: str = Field(..., min_length=3, max_length=64)
    kplc_token: str = Field(..., min_length=4, max_length=64)
    institution_id: str | None = None


# ─── Institutions (needed before any payments can run) ──────────────────────

@router.post("/institutions")
async def create_institution(
    body: InstitutionBody,
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Register an institution (KPLC, school, hospital). One-time setup."""
    row = await conn.fetchrow(
        """INSERT INTO institutions (name, type, paybill_number, account_number)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, type, created_at""",
        body.name, body.type, body.paybill_number, body.account_number,
    )
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "type": row["type"],
        "created_at": row["created_at"].isoformat(),
    }


@router.get("/institutions")
async def list_institutions(
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    rows = await conn.fetch(
        "SELECT id, name, type, paybill_number, account_number, active, created_at "
        "FROM institutions ORDER BY created_at ASC"
    )
    return {
        "institutions": [
            {
                "id": str(r["id"]),
                "name": r["name"],
                "type": r["type"],
                "paybill_number": r["paybill_number"],
                "account_number": r["account_number"],
                "active": r["active"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in rows
        ]
    }


# ─── Institutional payment queue ────────────────────────────────────────────

@router.get("/institutional-payments/queue")
async def institutional_queue(
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Pending utility requests + in-progress payments + recently completed.

    The admin uses this to know what to pay. Sorted oldest-first for pending.
    """
    pending = await conn.fetch(
        """SELECT r.id, r.amount_pence, r.category, r.hashed_object_id,
                  r.tier, r.status, r.created_at,
                  r.metadata->>'raw_object_id' AS raw_object_id
           FROM requests r
           LEFT JOIN institutional_payments ip ON ip.request_id = r.id
           WHERE r.status IN ('verified', 'pending_check')
             AND r.category = 'utility'
             AND ip.id IS NULL
           ORDER BY r.created_at ASC"""
    )

    in_progress = await conn.fetch(
        """SELECT r.id AS request_id, ip.id AS payment_id, ip.amount_pence,
                  ip.status, ip.bank_transaction_ref, ip.kplc_token,
                  ip.paid_at, ip.created_at
           FROM institutional_payments ip
           JOIN requests r ON r.id = ip.request_id
           WHERE ip.status = 'pending'
           ORDER BY ip.created_at ASC"""
    )

    recent = await conn.fetch(
        """SELECT r.id AS request_id, ip.id AS payment_id, ip.amount_pence,
                  ip.status, ip.bank_transaction_ref, ip.kplc_token,
                  ip.paid_at
           FROM institutional_payments ip
           JOIN requests r ON r.id = ip.request_id
           WHERE ip.status = 'paid'
           ORDER BY ip.paid_at DESC LIMIT 20"""
    )

    return {
        "pending": [
            {
                "request_id": str(p["id"]),
                "amount_pence": p["amount_pence"],
                "amount_kes": p["amount_pence"] // 100,
                "raw_object_id": p["raw_object_id"],
                "tier": p["tier"],
                "status": p["status"],
                "created_at": p["created_at"].isoformat(),
            }
            for p in pending
        ],
        "in_progress": [
            {
                "payment_id": str(p["payment_id"]),
                "request_id": str(p["request_id"]),
                "amount_pence": p["amount_pence"],
                "status": p["status"],
                "bank_transaction_ref": p["bank_transaction_ref"],
                "created_at": p["created_at"].isoformat(),
            }
            for p in in_progress
        ],
        "recent": [
            {
                "payment_id": str(p["payment_id"]),
                "request_id": str(p["request_id"]),
                "amount_pence": p["amount_pence"],
                "bank_transaction_ref": p["bank_transaction_ref"],
                "paid_at": p["paid_at"].isoformat() if p["paid_at"] else None,
            }
            for p in recent
        ],
    }


# ─── Confirm a payment (the core flow) ──────────────────────────────────────

@router.post("/institutional-payments/{request_id}/confirm")
async def confirm_payment(
    request_id: str,
    body: ConfirmPaymentBody,
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Admin enters bank ref + KPLC token. System records payment, sends SMS, fulfils request."""
    request = await conn.fetchrow(
        "SELECT id, token_hash, amount_pence, category, status FROM requests WHERE id = $1",
        request_id,
    )
    if not request:
        raise HTTPException(404, "Request not found")
    if request["category"] != "utility":
        raise HTTPException(
            400,
            f"Only utility requests can be confirmed via institutional payment "
            f"(request category is '{request['category']}')",
        )
    if request["status"] not in ("verified", "pending_check"):
        raise HTTPException(
            409,
            f"Cannot confirm payment for request in status '{request['status']}'. "
            f"Only 'verified' or 'pending_check' are payable.",
        )

    # Resolve institution
    institution_id = body.institution_id
    if institution_id is None:
        inst = await conn.fetchrow(
            "SELECT id FROM institutions WHERE type = 'utility' AND active = true "
            "ORDER BY created_at ASC LIMIT 1"
        )
        if not inst:
            raise HTTPException(
                409,
                "No utility institution registered. Create one first via "
                "POST /admin/institutions with type='utility'.",
            )
        institution_id = str(inst["id"])

    # Look up requester phone for SMS delivery
    requester = await conn.fetchrow(
        "SELECT phone_encrypted FROM requesters WHERE token_hash = $1",
        request["token_hash"],
    )
    if not requester:
        raise HTTPException(
            409,
            "No phone on file for this requester. Cannot deliver KPLC token. "
            "Requester must initiate via a channel that saves the phone first.",
        )

    try:
        phone = decrypt_phone(requester["phone_encrypted"])
    except Exception as exc:
        logger.error("Cannot decrypt requester phone for request %s: %r", request_id, exc)
        raise HTTPException(500, "Phone decryption failed") from exc

    # Record payment + fulfil request atomically
    async with conn.transaction():
        payment = await conn.fetchrow(
            """INSERT INTO institutional_payments
                   (request_id, institution_id, amount_pence, status,
                    bank_transaction_ref, kplc_token, paid_at)
               VALUES ($1, $2, $3, 'paid', $4, $5, now())
               ON CONFLICT (request_id) DO UPDATE SET
                   status = 'paid',
                   bank_transaction_ref = EXCLUDED.bank_transaction_ref,
                   kplc_token = EXCLUDED.kplc_token,
                   paid_at = now()
               RETURNING id, paid_at""",
            request_id, institution_id, request["amount_pence"],
            body.bank_transaction_ref, body.kplc_token,
        )
        await conn.execute(
            "UPDATE requests SET status = 'fulfilled', updated_at = now() WHERE id = $1",
            request_id,
        )

    # Send SMS (best-effort, outside transaction — never roll back a payment over SMS failure)
    sms_body = (
        f"Mutual Circle: KPLC token for your bill is {body.kplc_token}. "
        f"Load it on your meter. Ref: {request_id[:8]}"
    )
    sms_ok = False
    sms_error = None
    try:
        result = await send_sms(phone=phone, message=sms_body)
        sms_ok = bool(result.get("ok"))
        if not sms_ok:
            sms_error = result.get("error") or "AT rejected"
            logger.warning(
                "KPLC token SMS rejected by AT for request %s: %s",
                request_id, sms_error,
            )
    except Exception as exc:
        sms_error = f"{type(exc).__name__}: {exc}"
        logger.error("KPLC token SMS raised for request %s: %r", request_id, exc)

    return {
        "ok": True,
        "payment_id": str(payment["id"]),
        "request_id": request_id,
        "amount_pence": request["amount_pence"],
        "bank_transaction_ref": body.bank_transaction_ref,
        "sms_delivered": sms_ok,
        "sms_error": sms_error,
    }


@router.get("/institutional-payments/{request_id}")
async def get_payment(
    request_id: str,
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        """SELECT ip.id, ip.request_id, ip.amount_pence, ip.status,
                  ip.bank_transaction_ref, ip.kplc_token, ip.paid_at, ip.created_at
           FROM institutional_payments ip
           WHERE ip.request_id = $1""",
        request_id,
    )
    if not row:
        raise HTTPException(404, "No payment recorded for this request")
    return {
        "payment_id": str(row["id"]),
        "request_id": str(row["request_id"]),
        "amount_pence": row["amount_pence"],
        "status": row["status"],
        "bank_transaction_ref": row["bank_transaction_ref"],
        "kplc_token": row["kplc_token"],
        "paid_at": row["paid_at"].isoformat() if row["paid_at"] else None,
        "created_at": row["created_at"].isoformat(),
    }
