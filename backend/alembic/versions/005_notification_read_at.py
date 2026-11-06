"""add notifications.read_at

Revision ID: 005_notification_read_at
Revises: 004_pledge_request_link
Create Date: 2026-11-06

Tracks when a requester actually reads a notification in the app.
The existing sent_at column tracks SMS dispatch; read_at tracks
in-app visibility.
"""
from typing import Sequence, Union
from alembic import op


revision: str = "005_notification_read_at"
down_revision: Union[str, None] = "004_pledge_request_link"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_notifications_unread
        ON notifications (token_hash) WHERE read_at IS NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_notifications_unread")
    op.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS read_at")
