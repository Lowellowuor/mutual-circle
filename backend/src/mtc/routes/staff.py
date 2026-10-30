"""Staff authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

import asyncpg

from mtc.audit.log import append_audit
from mtc.auth.deps import get_current_session
from mtc.auth.session import create_session, revoke_session
from mtc.auth.staff import authenticate
from mtc.db.main import get_conn

router = APIRouter(prefix="/staff", tags=["staff"])


class LoginBody(BaseModel):
    role: str = Field(..., pattern="^(enrolment|fulfilment|audit)$")
    staff_id: str = Field(..., min_length=1, max_length=32)
    pin: str = Field(..., min_length=4, max_length=8)


@router.post("/login")
async def login(body: LoginBody, conn: asyncpg.Connection = Depends(get_conn)):
    cred = authenticate(body.role, body.staff_id, body.pin)
    if cred is None:
        # Deliberate: same message whether the ID is wrong or the PIN is wrong
        raise HTTPException(401, "Invalid credentials")
    session = await create_session(conn, staff_id=cred.staff_id, role=cred.role)
    await append_audit(
        conn, actor_role=cred.role, actor_id=cred.staff_id,
        action="Logged in", target_hash="system",
    )
    return session


@router.post("/logout")
async def logout(
    session: dict = Depends(get_current_session),
    conn: asyncpg.Connection = Depends(get_conn),
):
    await revoke_session(conn, session["session_id"])
    await append_audit(
        conn, actor_role=session["role"], actor_id=session["staff_id"],
        action="Logged out", target_hash="system",
    )
    return {"ok": True}


@router.get("/session")
async def current_session(session: dict = Depends(get_current_session)):
    return session