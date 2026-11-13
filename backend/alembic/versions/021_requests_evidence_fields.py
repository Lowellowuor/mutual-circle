"""add pending_evidence status and evidence columns to requests

Fixes the fresh deploy schema gaps:
- pending_evidence was manually added to the live DB but never captured
  in a migration.
- evidence_photo_path and evidence_submitted_at were manually added.

Revision ID: 021_requests_evidence_fields
Revises: 020_institutional_payment_unique
"""
from alembic import op

revision = "021_requests_evidence_fields"
down_revision = "020_institutional_payment_unique"


def upgrade() -> None:
    op.execute("ALTER TABLE requests ADD COLUMN IF NOT EXISTS evidence_photo_path TEXT")
    op.execute("ALTER TABLE requests ADD COLUMN IF NOT EXISTS evidence_submitted_at TIMESTAMPTZ")
    
    # Update the status CHECK constraint to include 'pending_evidence'
    op.execute("ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check")
    op.execute("""
        ALTER TABLE requests ADD CONSTRAINT requests_status_check CHECK (
            status IN (
                'reserved', 'pending_check', 'pending_evidence', 'verified', 
                'submitted_to_partner', 'voucher_issued', 'fulfilled', 
                'collected', 'withdrawn', 'rejected'
            )
        )
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check")
    op.execute("""
        ALTER TABLE requests ADD CONSTRAINT requests_status_check CHECK (
            status IN (
                'reserved', 'pending_check', 'verified', 
                'submitted_to_partner', 'voucher_issued', 'fulfilled', 
                'collected', 'withdrawn', 'rejected'
            )
        )
    """)
    op.execute("ALTER TABLE requests DROP COLUMN IF EXISTS evidence_submitted_at")
    op.execute("ALTER TABLE requests DROP COLUMN IF EXISTS evidence_photo_path")
