"""Staff session management — JWT + DB-backed revocation.

The JWT payload carries only:
  - sub  (staff_id)
  - role
  - sid  (session row id, used for revocation)
  - exp

No PHI, no phone numbers, nothing sensitive. If a session needs to be
revoked, set revoked_at on the session row — the token becomes inert
without needing to blacklist the JWT itself.
"""
import logging
from datetime import datetime, timedelta, timezone

import asyncpg
from jose import JWTError, jwt

from mtc.config import settings

logger = logging.getLogger(__name__)

SESSION_HOURS = 8
ALGORITHM = "HS256"


async def create_session(
    conn: asyncpg.Connection,
    *,
    staff_id: str,
    role: str,
) -> dict:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS)
    row = await conn.fetchrow(
        """INSERT INTO staff_sessions (staff_id, role, expires_at)
           VALUES ($1, $2, $3)
           RETURNING id""",
        staff_id, role, expires_at,
    )
    session_id = str(row["id"])
    token = jwt.encode(
        {
            "sub": staff_id,
            "role": role,
            "sid": session_id,
            "exp": expires_at,
        },
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )
    return {"session_token": token, "expires_at": expires_at.isoformat(), "session_id": session_id}


async def verify_session_token(conn: asyncpg.Connection, token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        return None

    session_id = payload.get("sid")
    role = payload.get("role")
    staff_id = payload.get("sub")
    if not session_id or not role or not staff_id:
        return None

    row = await conn.fetchrow(
        """SELECT id, staff_id, role, expires_at, revoked_at
           FROM staff_sessions WHERE id = $1""",
        session_id,
    )
    if row is None:
        return None
    if row["revoked_at"] is not None:
        return None
    if row["expires_at"] < datetime.now(timezone.utc):
        return None
    if row["staff_id"] != staff_id or row["role"] != role:
        return None

    return {
        "session_id": str(row["id"]),
        "staff_id": row["staff_id"],
        "role": row["role"],
        "expires_at": row["expires_at"].isoformat(),
    }


async def revoke_session(conn: asyncpg.Connection, session_id: str) -> None:
    await conn.execute(
        "UPDATE staff_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
        session_id,
    )