"""add pin_last4 to requests for locker webhook lookup

Revision ID: 010_requests_pin_last4
Revises: 009_sms_sessions
Create Date: 2026-11-08
"""
from typing import Sequence, Union
from alembic import op

revision: str = "010_requests_pin_last4"
down_revision: Union[str, None] = "009_sms_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS pin_last4 TEXT
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_requests_pin_last4_active
        ON requests (pin_last4)
        WHERE status IN ('reserved', 'verified', 'submitted_to_partner', 'voucher_issued')
    """)
    # Backfill from existing metadata
    op.execute("""
        UPDATE requests
        SET pin_last4 = RIGHT(metadata->>'pin', 4)
        WHERE type = 'swap'
          AND metadata->>'pin' IS NOT NULL
          AND pin_last4 IS NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_requests_pin_last4_active")
    op.execute("ALTER TABLE requests DROP COLUMN IF EXISTS pin_last4")