"""FastAPI dependencies — session lookup + role enforcement."""
from fastapi import Depends, Header, HTTPException

import asyncpg

from mtc.auth.session import verify_session_token
from mtc.db.main import get_conn


async def get_current_session(
    authorization: str = Header(..., alias="Authorization"),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing or malformed Authorization header")
    token = authorization[7:].strip()
    session = await verify_session_token(conn, token)
    if session is None:
        raise HTTPException(401, "Invalid or expired session")
    return session


def require_role(role: str):
    async def dep(session: dict = Depends(get_current_session)) -> dict:
        if session["role"] != role:
            raise HTTPException(403, f"Role '{role}' required for this endpoint")
        return session
    return dep