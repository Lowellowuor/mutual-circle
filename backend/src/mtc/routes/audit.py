"""Audit role endpoints — OCR queue, complete OCR, log, CSV export."""
from fastapi import APIRouter, Depends, HTTPException, Response

import asyncpg

from mtc.admin.export import export_audit_csv
from mtc.admin.ocr import OcrConflict, complete_ocr, list_ocr_queue
from mtc.audit.log import list_audit
from mtc.auth.deps import require_role
from mtc.db.main import get_conn

router = APIRouter(prefix="/audit", tags=["audit"])
require_audit = require_role("audit")


@router.get("/ocr-queue")
async def ocr_queue(
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"requests": await list_ocr_queue(conn)}


@router.post("/ocr/{request_id}/complete")
async def complete_ocr_route(
    request_id: str,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await complete_ocr(conn, request_id=request_id, staff_id=session["staff_id"])
    except LookupError:
        raise HTTPException(404, "Request not found")
    except OcrConflict as e:
        raise HTTPException(409, detail=e.reason)


@router.get("/log")
async def log(
    limit: int = 100,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"entries": await list_audit(conn, limit=limit)}


@router.get("/export.csv")
async def export_csv(
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    csv_text = await export_audit_csv(conn, staff_id=session["staff_id"])
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="mutual-circle-audit-log.csv"'},
    )