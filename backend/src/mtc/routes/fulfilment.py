"""Fulfilment role endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

import asyncpg

from mtc.admin.dispatch import DispatchConflict, dispatch_pool_request, list_fulfilment_queue
from mtc.auth.deps import require_role
from mtc.db.main import get_conn
from mtc.ledger.append import DuplicateObjectError
from mtc.vouchers.issue import VoucherConflict, issue_voucher

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


@router.post("/pledges/{pledge_id}/match")
async def match_pledge(pledge_id: str, session: dict = Depends(require_fulfilment), conn: asyncpg.Connection = Depends(get_conn)):
    await conn.execute("UPDATE pledges SET status = 'matched' WHERE id = $1 AND status = 'awaiting_match'", pledge_id)
    return {"id": pledge_id, "status": "matched"}


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
