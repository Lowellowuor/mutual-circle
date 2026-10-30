"""Requester outcome notifications — the state-change → message pipeline.

Every request state change generates a notification row. In production these
are delivered via SMS on the same shortcode the requester came in on. Here
they are stored and shown in the requester's Messages tab.

R.U.T.H Gap 1 fix: the requester always knows what happened to their request.
"""
import logging

import asyncpg

logger = logging.getLogger(__name__)

TEMPLATES = {
    "swap_submitted":  "Mutual Circle: Bundle reserved at {location}. PIN: {pin}. Collect anytime.",
    "pool_submitted":  "Mutual Circle: Request received. Ref: {ref}. We will notify you when verified.",
    "pool_pending":    "Mutual Circle: Your bill requires extra verification. We will update you within 24 hours. Ref: {ref}.",
    "verified":        "Mutual Circle: Verified. Ref: {ref}. Payment queued.",
    "dispatched":      "Mutual Circle: Payment sent to the institution. Ref: {ref}. Confirmation within 2 hours.",
    "withdrawn":       "Mutual Circle: Request withdrawn. Ref: {ref}.",
    "collected":       "Mutual Circle: Bundle collected. Thank you.",
}


async def notify(
    conn: asyncpg.Connection,
    token_hash: str,
    request_id: str | None,
    template_key: str,
    context: dict | None = None,
) -> None:
    """Create a notification. Best-effort — never breaks the caller."""
    template = TEMPLATES.get(template_key)
    if template is None:
        logger.warning("Unknown notification template: %s", template_key)
        return
    try:
        content = template.format(**(context or {}))
    except (KeyError, IndexError) as exc:
        logger.warning("Notification template fill failed (%s): %s", template_key, exc)
        return
    try:
        await conn.execute(
            """INSERT INTO notifications (token_hash, request_id, template, content)
               VALUES ($1, $2, $3, $4)""",
            token_hash, request_id, template_key, content,
        )
    except Exception as exc:
        logger.error("Notification insert failed (%s): %s", template_key, exc)