"""paystack_payments: one row per Paystack checkout attempt

Replaces mpesa_transactions as the payment record for donations and
pledges. mpesa_transactions is left in place (historical rows); nothing
writes to it any more.

- reference is ours, generated and saved BEFORE Paystack is called.
- At most one 'pending' checkout per target (partial unique index), so a
  second payment cannot start while one is in progress.
- No PII: no email, no phone, no card data.

Revision ID: 023_paystack_payments
Revises: 022_fix_status_constraint
Create Date: 2026-11-18
"""
from typing import Sequence, Union

from alembic import op

revision: str = "023_paystack_payments"
down_revision: Union[str, None] = "022_fix_status_constraint"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS paystack_payments (
            reference               TEXT PRIMARY KEY,
            target_table            TEXT NOT NULL
                CONSTRAINT chk_paystack_payments_target
                CHECK (target_table IN ('donor_contributions', 'pledges')),
            target_id               UUID NOT NULL,
            donor_hash              TEXT NOT NULL,
            amount_pence            BIGINT NOT NULL
                CONSTRAINT chk_paystack_payments_amount CHECK (amount_pence > 0),
            currency                TEXT NOT NULL,
            status                  TEXT NOT NULL DEFAULT 'pending'
                CONSTRAINT chk_paystack_payments_status
                CHECK (status IN ('pending', 'paid', 'failed', 'abandoned')),
            paystack_transaction_id BIGINT,
            channel                 TEXT,
            paid_at                 TIMESTAMPTZ,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_paystack_payments_one_pending
        ON paystack_payments (target_table, target_id)
        WHERE status = 'pending'
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_paystack_payments_target
        ON paystack_payments (target_table, target_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS paystack_payments")
