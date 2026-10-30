"""Server-side rate limiting, per token per day.

Atomic increment via INSERT ... ON CONFLICT. If the increment crosses a
threshold, we raise — the surrounding transaction rolls back, so the counter
stays at its previous value.

R.U.T.H Section 4.1: rate limits per token (frequency and value).
"""
from dataclasses import dataclass

import asyncpg

MAX_REQUESTS_PER_DAY = 25
MAX_VALUE_PENCE_PER_DAY = 10_000_000  # 100,000 KES


class RateLimitExceeded(Exception):
    def __init__(self, reason: str, count: int, value_pence: int):
        super().__init__(reason)
        self.reason = reason
        self.count = count
        self.value_pence = value_pence


@dataclass
class RateState:
    request_count: int
    total_value_pence: int


async def consume_quota(
    conn: asyncpg.Connection,
    *,
    token_hash: str,
    value_pence: int = 0,
) -> RateState:
    """Increment the counter and enforce limits. Raises RateLimitExceeded if
    the increment would breach either limit — in that case the transaction
    rolls back, so the counter is not incremented."""
    async with conn.transaction():
        row = await conn.fetchrow(
            """
            INSERT INTO rate_counters (token_hash, day, request_count, total_value_pence)
            VALUES ($1, CURRENT_DATE, 1, $2)
            ON CONFLICT (token_hash, day) DO UPDATE
            SET request_count = rate_counters.request_count + 1,
                total_value_pence = rate_counters.total_value_pence + EXCLUDED.total_value_pence
            RETURNING request_count, total_value_pence
            """,
            token_hash, value_pence,
        )
        count = row["request_count"]
        total = row["total_value_pence"]
        if count > MAX_REQUESTS_PER_DAY:
            raise RateLimitExceeded(
                f"Daily request limit ({MAX_REQUESTS_PER_DAY}) reached for this token.",
                count, total,
            )
        if total > MAX_VALUE_PENCE_PER_DAY:
            raise RateLimitExceeded(
                f"Daily value limit ({MAX_VALUE_PENCE_PER_DAY // 100:,} KES) reached.",
                count, total,
            )
        return RateState(request_count=count, total_value_pence=total)