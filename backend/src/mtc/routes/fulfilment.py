"""Fulfilment role endpoints — dispatch + queue."""
from fastapi import APIRouter, Depends, HTTPException

import asyncpg

from mtc.admin.dispatch import DispatchConflict, dispatch_pool_request, list_fulfilment_queue
from mtc.auth.deps import require_role
from mtc.db.main import get_conn
from mtc.ledger.append import DuplicateObjectError

router = APIRouter(prefix="/fulfilment", tags=["fulfilment"])
require_fulfilment = require_role("fulfilment")


@router.get("/queue")
async def get_queue(
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return await list_fulfilment_queue(conn)


@router.post("/requests/{request_id}/dispatch")
async def dispatch(
    request_id: str,
    session: dict = Depends(require_fulfilment),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await dispatch_pool_request(
            conn, request_id=request_id, staff_id=session["staff_id"],
        )
    except LookupError:
        raise HTTPException(404, "Request not found")
    except DispatchConflict as e:
        raise HTTPException(409, detail=e.reason)
    except DuplicateObjectError as e:
        raise HTTPException(409, detail=f"Already settled: {e.object_hash}")