"""add requests.mpesa_payment_fields

Revision ID: 006_mpesa_payment_fields
Revises: 005_notification_read_at
Create Date: 2026-11-07

Adds three nullable columns to requests for M-PESA Daraja payment
tracking:

  - mpesa_checkout_request_id: the CheckoutRequestID returned by STK
    Push. Per the write-then-call contract, /pool/{id}/pay writes this
    BEFORE calling STK push. A callback for an unknown ID is therefore
    a permanent failure (spoof, DB wipe, or contract violation).
  - mpesa_receipt: the MpesaReceiptNumber from the callback. Unique
    enough for manual reconciliation if the app loses track.
  - payment_status: 'n/a' (default, no payment expected), 'pending_payment'
    (STK sent), 'paid' (callback success), 'payment_failed' (callback
    failure). CHECK constraint matches requests.status style.

Partial index on mpesa_checkout_request_id: only rows with a non-null
value need lookup by it. Cuts index size on the mostly-'n/a' table.
"""
from typing import Sequence, Union
from alembic import op


revision: str = "006_mpesa_payment_fields"
down_revision: Union[str, None] = "005_notification_read_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id TEXT
    """)
    op.execute("""
        ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT
    """)
    op.execute("""
        ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'n/a'
    """)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'requests_payment_status_check'
            ) THEN
                ALTER TABLE requests
                ADD CONSTRAINT requests_payment_status_check
                CHECK (payment_status IN (
                    'n/a','pending_payment','paid','payment_failed'
                ));
            END IF;
        END $$;
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_requests_mpesa_checkout
        ON requests (mpesa_checkout_request_id)
        WHERE mpesa_checkout_request_id IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_requests_mpesa_checkout")
    op.execute("ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_payment_status_check")
    op.execute("ALTER TABLE requests DROP COLUMN IF EXISTS payment_status")
    op.execute("ALTER TABLE requests DROP COLUMN IF EXISTS mpesa_receipt")
    op.execute("ALTER TABLE requests DROP COLUMN IF EXISTS mpesa_checkout_request_id")