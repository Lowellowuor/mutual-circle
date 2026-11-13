"""separate payment_status from match status on pledges

Payments review issue #8: paying a pledge overwrote its match state.
Before this migration, the STK init wrote status='pending_payment' and
the M-PESA callback wrote status='paid', both destroying the
awaiting_match -> matched -> settled match state machine.

This migration adds a payment_status column so the two state machines
are independent:
  - status: awaiting_match -> matched -> settled
  - payment_status: unpaid -> pending_payment -> paid | payment_failed

Backfill:
  - Rows with status IN ('paid', 'pending_payment', 'payment_failed')
    are in a payment state, not a match state. Move the value to
    payment_status and reset status='awaiting_match'.
  - Service-credit pledges that are already matched/settled were
    implicitly paid before this column existed. Mark them paid so the
    new match guard does not retroactively block them.

Revision ID: 011_pledges_payment_status
Revises: 010_requests_pin_last4
Create Date: 2026-11-13
"""
from typing import Sequence, Union
from alembic import op

revision: str = "011_pledges_payment_status"
down_revision: Union[str, None] = "010_requests_pin_last4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE pledges
        ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    """)

    # Rows already matched/settled as service_credit were implicitly paid
    op.execute("""
        UPDATE pledges
        SET payment_status = 'paid'
        WHERE status IN ('matched', 'settled')
          AND type = 'service_credit'
          AND payment_status = 'unpaid'
    """)

    # Any row with a payment state in the status column -> move it out
    op.execute("""
        UPDATE pledges
        SET payment_status = status,
            status = 'awaiting_match'
        WHERE status IN ('paid', 'pending_payment', 'payment_failed')
    """)

    # CHECK constraint, idempotent
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'chk_pledges_payment_status'
            ) THEN
                ALTER TABLE pledges
                ADD CONSTRAINT chk_pledges_payment_status
                CHECK (payment_status IN ('unpaid', 'pending_payment', 'paid', 'payment_failed'));
            END IF;
        END$$
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE pledges DROP CONSTRAINT IF EXISTS chk_pledges_payment_status")
    op.execute("ALTER TABLE pledges DROP COLUMN IF EXISTS payment_status")
