"""Fulfilment role endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

import asyncpg

from mtc.admin.dispatch import DispatchConflict, dispatch_pool_request, list_fulfilment_queue
from mtc.auth.deps import require_role
from mtc.db.main import get_conn
from mtc.ledger.append import DuplicateObjectError
from mtc.vouchers.issue import VoucherConflict, issue_voucher
from mtc.vouchers.redeem import redeem_voucher

router = APIRouter(prefix="/fulfilment", tags=["fulfilment"])
require_fulfilment = require_role("fulfilment")


@router.get("/queue")
async def get_queue(session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn)):
    return await list_fulfilment_queue(conn)


@router.post("/requests/{request_id}/dispatch")
async def dispatch(request_id: str, session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn)):
    try:
        return await dispatch_pool_request(conn, request_id=request_id, staff_id=session["staff_id"])
    except LookupError:
        raise HTTPException(404, "Request not found")
    except DispatchConflict as e:
        raise HTTPException(409, detail=e.reason)
    except DuplicateObjectError as e:
        raise HTTPException(409, detail=f"Already settled: {e.object_hash}")


class IssueVoucherBody(BaseModel):
    partner_name: str = Field(..., min_length=1, max_length=80)
    partner_type: str = Field(..., pattern="^(retailer|hospital)$")


@router.post("/requests/{request_id}/voucher")
async def issue_voucher_route(
    request_id: str, body: IssueVoucherBody,
    session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await issue_voucher(conn, request_id=request_id, partner_name=body.partner_name, partner_type=body.partner_type, staff_id=session["staff_id"])
    except LookupError:
        raise HTTPException(404, "Request not found")
    except VoucherConflict as e:
        raise HTTPException(409, detail=e.reason)


@router.get("/pledges")
async def get_pledges(session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch("SELECT * FROM pledges WHERE status = 'awaiting_match' ORDER BY created_at ASC")
    return {"pledges": [
        {"id": str(r["id"]), "type": r["type"], "description": r["description"],
         "locality": r["locality"], "max_value_pence": r["max_value_pence"],
         "status": r["status"], "created_at": r["created_at"].isoformat()}
        for r in rows
    ]}


class MatchPledgeBody(BaseModel):
    request_id: str | None = None


@router.post("/pledges/{pledge_id}/match")
async def match_pledge(
    pledge_id: str,
    body: MatchPledgeBody | None = None,
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    request_id = body.request_id if body else None

    pledge = await conn.fetchrow("SELECT id, status FROM pledges WHERE id = $1", pledge_id)
    if not pledge:
        raise HTTPException(404, "Pledge not found")
    if pledge["status"] != "awaiting_match":
        raise HTTPException(409, f"Pledge in status '{pledge['status']}' cannot be matched")

    if request_id:
        request_row = await conn.fetchrow(
            "SELECT id, pledge_id FROM requests WHERE id = $1",
            request_id,
        )
        if not request_row:
            raise HTTPException(404, "Request not found")
        if request_row["pledge_id"]:
            raise HTTPException(409, "Request already linked to a pledge")

        async with conn.transaction():
            await conn.execute(
                "UPDATE requests SET pledge_id = $1, updated_at = now() WHERE id = $2",
                pledge_id, request_id,
            )
            await conn.execute(
                "UPDATE pledges SET status = 'matched' WHERE id = $1",
                pledge_id,
            )
    else:
        await conn.execute(
            "UPDATE pledges SET status = 'matched' WHERE id = $1 AND status = 'awaiting_match'",
            pledge_id,
        )

    return {"id": pledge_id, "status": "matched", "request_id": request_id}


@router.get("/match-interests")
async def get_match_interests(session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch("SELECT * FROM match_interests ORDER BY created_at DESC LIMIT 50")
    return {"interests": [
        {"id": str(r["id"]), "opportunityId": r["opportunity_id"], "title": r["title"],
         "tokenHash": r["token_hash"], "status": r["status"], "timestamp": r["created_at"].isoformat()}
        for r in rows
    ]}


class CloseInterestBody(BaseModel):
    status: str = Field(..., pattern="^(contacted|closed)$")


@router.post("/match-interests/{interest_id}/close")
async def close_interest(interest_id: str, body: CloseInterestBody, session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn)):
    await conn.execute("UPDATE match_interests SET status = $1 WHERE id = $2", body.status, interest_id)
    return {"id": interest_id, "status": body.status}


@router.get("/vouchers")
async def list_all_vouchers(session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch("SELECT id, partner_name, partner_type, description, max_value_pence, pin_last4, status, expires_at, created_at FROM vouchers ORDER BY created_at DESC LIMIT 50")
    return {"vouchers": [
        {"voucher_id": str(r["id"]), "partner_name": r["partner_name"], "partner_type": r["partner_type"],
         "description": r["description"], "max_value_pence": r["max_value_pence"],
         "pin_last4": r["pin_last4"], "status": r["status"],
         "expires_at": r["expires_at"].isoformat(), "created_at": r["created_at"].isoformat()}
        for r in rows
    ]}


class StaffRedeemBody(BaseModel):
    pin: str = Field(..., min_length=6, max_length=6)
    partner_name: str = Field(..., min_length=1, max_length=80)
    amount_pence: int = Field(..., gt=0, le=10_000_000)


@router.post("/redeem")
async def staff_redeem(
    body: StaffRedeemBody,
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    """Staff-initiated voucher redemption (Console Till).

    Auth: Bearer JWT, fulfilment role. The partner_name comes from the
    request body because staff are manually processing a walk-in
    redemption on behalf of whichever partner they select. Contrast with
    POST /partner/redeem where partner identity is derived from the
    signed key, not the body.

    Both this and /partner/redeem call the same underlying redeem_voucher.
    The auth gate and where the partner identity comes from are the
    only differences.
    """
    return await redeem_voucher(
        conn,
        pin=body.pin,
        partner_name=body.partner_name,
        amount_pence=body.amount_pence,
    )
