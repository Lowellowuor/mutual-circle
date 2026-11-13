"""intake_surveys — household context + giving-back intent

Captures post-approval context that shapes basket size and provides
funder-grade aggregate data. Two submit points:
  - Intake (family_size, work_status, industry, primary_need) — after
    the request is approved, before delivery
  - Followup (willing_to_give_back, willing_channels) — after the
    request is collected

Anti-fraud signals stored per row: submitted_via, time_to_complete_ms,
revision_count, ip_hash, verification_status.

Revision ID: 014_intake_surveys
Revises: 013_donor_auth_tables
Create Date: 2026-11-13
"""
from typing import Sequence, Union
from alembic import op

revision: str = "014_intake_surveys"
down_revision: Union[str, None] = "013_donor_auth_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS intake_surveys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,

            -- Intake (submitted post-approval)
            family_size SMALLINT NOT NULL CHECK (family_size BETWEEN 1 AND 20),
            work_status TEXT NOT NULL CHECK (work_status IN (
                'employed','self_employed','casual','unemployed','student','retired'
            )),
            industry TEXT NOT NULL CHECK (industry IN (
                'formal','informal','agriculture','services','manufacturing','none'
            )),
            primary_need TEXT NOT NULL CHECK (primary_need IN (
                'food','utilities','school_fees','hospital','rent'
            )),

            -- Followup (submitted post-collection, nullable until then)
            willing_to_give_back BOOLEAN,
            willing_channels TEXT[],

            -- Consent (aggregate gated; followup gated)
            consent_to_aggregate BOOLEAN NOT NULL DEFAULT false,
            consent_to_followup  BOOLEAN NOT NULL DEFAULT false,

            -- Anti-fraud signals
            submitted_via TEXT NOT NULL CHECK (submitted_via IN (
                'whatsapp','sms','ussd','web','in_person'
            )),
            ip_hash TEXT,
            time_to_complete_ms INTEGER,
            revision_count SMALLINT NOT NULL DEFAULT 0,

            -- Verification workflow
            verification_status TEXT NOT NULL DEFAULT 'unverified'
                CHECK (verification_status IN (
                    'unverified','phone_verified','in_person','flagged'
                )),
            verification_notes TEXT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_intake_aggregate
        ON intake_surveys (industry, work_status, primary_need)
        WHERE consent_to_aggregate = true
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_intake_verification_queue
        ON intake_surveys (verification_status)
        WHERE verification_status IN ('unverified','flagged')
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_intake_aggregate")
    op.execute("DROP INDEX IF EXISTS idx_intake_verification_queue")
    op.execute("DROP TABLE IF EXISTS intake_surveys")
