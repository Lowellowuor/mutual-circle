"""Partner API — reconciliation for locker operators, retailers, institutions.

Auth: X-Partner-Key header (seeded per partner, replace with real secret
management before production).

Each partner sees their own reconciliation: which requests they fulfil, what
they're owed, and can confirm delivery.
"""
import csv
import io

import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from mtc.db.main import get_conn

router = APIRouter(prefix="/partners", tags=["partners"])


async def require_partner(
    x_partner_key: str = Header(..., alias="X-Partner-Key"),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    row = await conn.fetchrow(
        "SELECT * FROM partners WHERE api_key = $1 AND active = TRUE",
        x_partner_key,
    )
    if row is None:
        raise HTTPException(401, "Invalid partner key")
    return {
        "id": row["id"],
        "name": row["name"],
        "type": row["type"],
        "contact_email": row["contact_email"],
    }


@router.get("/me")
async def partner_me(partner: dict = Depends(require_partner)):
    return partner


@router.get("/me/redemptions")
async def partner_redemptions(
    partner: dict = Depends(require_partner),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """List this partner's fulfillments.

    - lockers: see swap requests in their location
    - institutions: see pool requests submitted to them
    - retail: see voucher redemptions they processed
    """
    ptype = partner["type"]
    pname = partner["name"]

    if ptype == "locker":
        rows = await conn.fetch(
            """SELECT r.id, r.metadata, r.status, r.tier, r.created_at,
                      c.id AS confirmation_id, c.created_at AS confirmed_at
               FROM requests r
               LEFT JOIN partner_confirmations c
                 ON c.request_id = r.id AND c.partner_id = $1
               WHERE r.type = 'swap'
               ORDER BY r.created_at DESC LIMIT 200""",
            partner["id"],
        )
        return {
            "kind": "locker",
            "redemptions": [
                {
                    "id": str(r["id"]),
                    "metadata": r["metadata"] or {},
                    "status": r["status"],
                    "tier": r["tier"],
                    "created_at": r["created_at"].isoformat(),
                    "confirmed": r["confirmation_id"] is not None,
                    "confirmed_at": r["confirmed_at"].isoformat() if r["confirmed_at"] else None,
                }
                for r in rows
            ],
        }
    elif ptype == "institution":
        rows = await conn.fetch(
            """SELECT r.id, r.category, r.amount_pence, r.hashed_object_id, r.status, r.created_at,
                      c.id AS confirmation_id, c.created_at AS confirmed_at
               FROM requests r
               LEFT JOIN partner_confirmations c
                 ON c.request_id = r.id AND c.partner_id = $1
               WHERE r.type = 'pool' AND r.status IN ('submitted_to_partner', 'fulfilled')
               ORDER BY r.created_at DESC LIMIT 200""",
            partner["id"],
        )
        return {
            "kind": "institution",
            "redemptions": [
                {
                    "id": str(r["id"]),
                    "category": r["category"],
                    "amount_pence": r["amount_pence"],
                    "hashed_object_id": r["hashed_object_id"],
                    "status": r["status"],
                    "created_at": r["created_at"].isoformat(),
                    "confirmed": r["confirmation_id"] is not None,
                    "confirmed_at": r["confirmed_at"].isoformat() if r["confirmed_at"] else None,
                }
                for r in rows
            ],
        }
    else:  # retail
        rows = await conn.fetch(
            """SELECT vr.id, vr.voucher_id, vr.amount_pence, vr.status, vr.created_at,
                      v.partner_name, v.description,
                      c.id AS confirmation_id
               FROM voucher_redemptions vr
               LEFT JOIN vouchers v ON v.id = vr.voucher_id
               LEFT JOIN partner_confirmations c
                 ON c.request_id = vr.voucher_id AND c.partner_id = $1
               WHERE v.partner_name = $2
               ORDER BY vr.created_at DESC LIMIT 200""",
            partner["id"], pname,
        )
        return {
            "kind": "retail",
            "redemptions": [
                {
                    "id": str(r["id"]),
                    "voucher_id": str(r["voucher_id"]),
                    "amount_pence": r["amount_pence"],
                    "status": r["status"],
                    "description": r["description"],
                    "created_at": r["created_at"].isoformat(),
                    "confirmed": r["confirmation_id"] is not None,
                }
                for r in rows
            ],
        }


class ConfirmBody(BaseModel):
    confirmation_type: str = Field(default="settled", pattern="^(delivered|settled|disputed)$")
    note: str = Field(default="", max_length=500)


@router.post("/me/confirm/{request_id}")
async def confirm_request(
    request_id: str,
    body: ConfirmBody,
    partner: dict = Depends(require_partner),
    conn: asyncpg.Connection = Depends(get_conn),
):
    req = await conn.fetchrow("SELECT id FROM requests WHERE id = $1", request_id)
    if req is None:
        raise HTTPException(404, "Request not found")
    try:
        await conn.execute(
            """INSERT INTO partner_confirmations
               (partner_id, request_id, confirmation_type, note)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (partner_id, request_id) DO UPDATE
               SET confirmation_type = EXCLUDED.confirmation_type,
                   note = EXCLUDED.note""",
            partner["id"], request_id, body.confirmation_type, body.note,
        )
        return {"ok": True, "request_id": request_id, "confirmation_type": body.confirmation_type}
    except Exception as exc:
        raise HTTPException(500, f"Confirmation failed: {exc}")


@router.get("/me/statement.csv")
async def partner_statement(
    partner: dict = Depends(require_partner),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Monthly settlement statement as CSV."""
    rows = await conn.fetch(
        """SELECT r.id, r.category, r.amount_pence, r.hashed_object_id,
                  r.status, r.created_at, c.confirmation_type, c.created_at AS confirmed_at
           FROM requests r
           LEFT JOIN partner_confirmations c
             ON c.request_id = r.id AND c.partner_id = $1
           WHERE r.status IN ('submitted_to_partner', 'fulfilled', 'voucher_issued')
           ORDER BY r.created_at DESC""",
        partner["id"],
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "request_id", "category", "amount_pence", "hashed_object_id",
        "status", "created_at", "partner_confirmation", "confirmed_at",
    ])
    for r in rows:
        writer.writerow([
            str(r["id"]),
            r["category"],
            r["amount_pence"],
            r["hashed_object_id"] or "",
            r["status"],
            r["created_at"].isoformat(),
            r["confirmation_type"] or "pending",
            r["confirmed_at"].isoformat() if r["confirmed_at"] else "",
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="mutual-circle-statement-{partner["id"]}.csv"'},
    )