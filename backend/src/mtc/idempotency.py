"""Idempotency-Key support for POST endpoints that create records.

Pattern:

  1. Client sends `Idempotency-Key: <uuid>` header with the POST.
  2. Backend attempts to claim the key via INSERT (ON CONFLICT DO NOTHING).
  3. If claim succeeds: do the work, then UPDATE response_body.
  4. If claim fails: another request has it. Return cached response
     if the winner completed, else 409 (client should retry).

Callers do:
    cached = await check_or_claim(conn, key, "donation", donor_hash)
    if cached is not None:
        return cached
    try:
        response = do_actual_work()
        await complete(conn, key, "donation", donor_hash, response)
        return response
    except Exception:
        await release(conn, key, "donation", donor_hash)
        raise
"""
import json
import asyncpg
from fastapi import HTTPException

IDEMPOTENCY_TTL_HOURS = 24


async def check_or_claim(
    conn: asyncpg.Connection,
    key: str | None,
    scope: str,
    caller_id: str,
) -> dict | None:
    """Claim the idempotency key for this request.

    Returns:
      - None: this request owns the key; caller should do the work.
      - dict: a previous request with this key already completed; return it.
      - raises 409: another request is currently in flight for this key.

    If `key` is None/empty (header absent), returns None — no idempotency check.
    """
    if not key:
        return None

    claimed = await conn.fetchval(
        """INSERT INTO idempotency_keys (key, scope, caller_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (key) DO NOTHING
           RETURNING TRUE""",
        key, scope, caller_id,
    )

    if claimed:
        return None

    row = await conn.fetchrow(
        """SELECT response_body, created_at FROM idempotency_keys
           WHERE key = $1 AND scope = $2 AND caller_id = $3""",
        key, scope, caller_id,
    )

    if not row:
        raise HTTPException(409, "Idempotency key conflict")

    if row["response_body"] is not None:
        body = row["response_body"]
        if isinstance(body, str):
            body = json.loads(body)
        return body

    raise HTTPException(409, "Request in progress. Please retry in a moment.")


async def complete(
    conn: asyncpg.Connection,
    key: str | None,
    scope: str,
    caller_id: str,
    response: dict,
) -> None:
    """Store the response body for future duplicate requests."""
    if not key:
        return
    await conn.execute(
        """UPDATE idempotency_keys
           SET response_body = $1::jsonb
           WHERE key = $2 AND scope = $3 AND caller_id = $4""",
        json.dumps(response, default=str),
        key, scope, caller_id,
    )


async def release(
    conn: asyncpg.Connection,
    key: str | None,
    scope: str,
    caller_id: str,
) -> None:
    """Clean up a claimed-but-not-completed key (call on failure).

    Only deletes rows where response_body is still NULL, so a completed
    response is never wiped by a stale error path.
    """
    if not key:
        return
    await conn.execute(
        """DELETE FROM idempotency_keys
           WHERE key = $1 AND scope = $2 AND caller_id = $3
             AND response_body IS NULL""",
        key, scope, caller_id,
    )
