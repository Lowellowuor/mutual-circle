"""add voucher lockout fields

Revision ID: 007_voucher_lockout
Revises: 006_mpesa_payment_fields
Create Date: 2026-11-08

A3-b: PIN hardening. Adds failed_attempts and locked_until to allow
locking a voucher for 15 minutes after 3 failed entry attempts.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "007_voucher_lockout"
down_revision: Union[str, None] = "006_mpesa_payment_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("""
        ALTER TABLE vouchers
        ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
    """)

def downgrade() -> None:
    op.execute("ALTER TABLE vouchers DROP COLUMN IF EXISTS failed_attempts")
    op.execute("ALTER TABLE vouchers DROP COLUMN IF EXISTS locked_until")