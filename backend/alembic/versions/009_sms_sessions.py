"""add sms_sessions table for stateful SMS flows

Revision ID: 009_sms_sessions
Revises: 008_mpesa_transactions
Create Date: 2026-11-08
"""
from typing import Sequence, Union
from alembic import op

revision: str = "009_sms_sessions"
down_revision: Union[str, None] = "008_mpesa_transactions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS sms_sessions (
            token_hash TEXT PRIMARY KEY,
            current_step TEXT NOT NULL,
            context JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS sms_sessions")