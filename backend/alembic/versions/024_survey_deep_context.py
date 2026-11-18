"""add urgency and duration to intake surveys

Adds deeper context for funder reporting:
- urgency (how soon they need it)
- duration_in_need (how long they've been struggling)

Revision ID: 024_survey_deep_context
Revises: 023_paystack_payments
"""
from alembic import op

revision = "024_survey_deep_context"
down_revision = "023_paystack_payments"


def upgrade() -> None:
    op.execute("ALTER TABLE intake_surveys ADD COLUMN IF NOT EXISTS urgency TEXT")
    op.execute("ALTER TABLE intake_surveys ADD COLUMN IF NOT EXISTS duration_in_need TEXT")


def downgrade() -> None:
    op.execute("ALTER TABLE intake_surveys DROP COLUMN IF EXISTS duration_in_need")
    op.execute("ALTER TABLE intake_surveys DROP COLUMN IF EXISTS urgency")
