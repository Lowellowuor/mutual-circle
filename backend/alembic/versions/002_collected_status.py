"""Add 'collected' to requests.status CHECK constraint

Revision ID: 002_collected_status
Revises: 001_ledger
Create Date: 2026-11-01

Collection-confirmation introduced 'collected' status, but the
original CHECK constraint rejected it (500 on UPDATE). The ALTER was
applied out-of-band; this migration records it for reproducibility.

Idempotent — safe on a DB where the constraint already includes
'collected' (out-of-band ALTER already applied).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '002_collected_status'
down_revision: Union[str, None] = '001_ledger'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(sa.text("""
        SELECT pg_get_constraintdef(c.oid) AS def
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'requests' AND c.conname = 'requests_status_check'
    """)).fetchone()

    if row and 'collected' in row[0]:
        return

    op.execute("ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check")
    op.execute("""
        ALTER TABLE requests
        ADD CONSTRAINT requests_status_check
        CHECK (status = ANY (ARRAY[
            'pending_check'::text,
            'verified'::text,
            'submitted_to_partner'::text,
            'voucher_issued'::text,
            'fulfilled'::text,
            'withdrawn'::text,
            'collected'::text
        ]))
    """)


def downgrade() -> None:
    raise RuntimeError(
        "Downgrade of 002_collected_status is unsafe: any rows with "
        "status='collected' would violate the narrower constraint. "
        "Manually migrate those rows first (SET status='fulfilled'), "
        "then run alembic downgrade."
    )