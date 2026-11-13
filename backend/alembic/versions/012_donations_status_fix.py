"""fix donor_contributions.status default — was 'paid', now 'unpaid'

Payments review issue #2: every donation INSERT got status='paid' from
the column default, so the donor saw "already paid" before any M-PESA
prompt was sent. 37 rows in the live DB are in this state — all with
mpesa_receipt IS NULL, i.e. no real payment ever succeeded.

Revision ID: 012_donations_status_fix
Revises: 011_pledges_payment_status
Create Date: 2026-11-13
"""
from typing import Sequence, Union
from alembic import op

revision: str = "012_donations_status_fix"
down_revision: Union[str, None] = "011_pledges_payment_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Default is the root cause — fix it
    op.execute("ALTER TABLE donor_contributions ALTER COLUMN status SET DEFAULT \'unpaid\'")

    # 2. Backfill: any 'paid' row without a receipt is fake (created via default)
    op.execute("""
        UPDATE donor_contributions
        SET status = \'unpaid\'
        WHERE status = \'paid\' AND mpesa_receipt IS NULL
    """)

    # 3. CHECK constraint so a rogue INSERT can\'t skip validation (idempotent)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = \'chk_donor_contributions_status\'
            ) THEN
                ALTER TABLE donor_contributions
                ADD CONSTRAINT chk_donor_contributions_status
                CHECK (status IN (\'unpaid\', \'pending_payment\', \'paid\', \'payment_failed\', \'refunded\'));
            END IF;
        END$$
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE donor_contributions DROP CONSTRAINT IF EXISTS chk_donor_contributions_status")
    op.execute("ALTER TABLE donor_contributions ALTER COLUMN status SET DEFAULT \'paid\'")
