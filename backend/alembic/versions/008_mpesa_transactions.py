"""add centralized mpesa transactions

Revision ID: 008_mpesa_transactions
Revises: 007_voucher_lockout
Create Date: 2026-11-08
"""
from typing import Sequence, Union
from alembic import op

revision: str = "008_mpesa_transactions"
down_revision: Union[str, None] = "007_voucher_lockout"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("""
        ALTER TABLE donor_contributions
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid',
        ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS mpesa_transactions (
            checkout_request_id TEXT PRIMARY KEY,
            merchant_request_id TEXT,
            amount_pence INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            target_table TEXT NOT NULL,
            target_id UUID NOT NULL,
            mpesa_receipt TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS mpesa_transactions")
    op.execute("ALTER TABLE donor_contributions DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS mpesa_receipt")