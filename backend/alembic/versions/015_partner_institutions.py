"""partner_types + institutional payments

Aligns the schema with R.U.T.H Phase 1:
- Partners are now typed: retail (vouchers), locker (Chui), institution (KPLC).
- Add institutions table for direct bill payees (KPLC, schools, hospitals).
- Add institutional_payments table to track bank transfers and KPLC tokens.

Revision ID: 015_partner_institutions
Revises: 014_intake_surveys
"""
from typing import Sequence, Union
from alembic import op

revision: str = "015_partner_institutions"
down_revision: Union[str, None] = "014_intake_surveys"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Type the partners
    op.execute("""
        ALTER TABLE partners
        ADD COLUMN IF NOT EXISTS partner_type TEXT NOT NULL DEFAULT 'retail'
        CHECK (partner_type IN ('retail', 'locker', 'institution'))
    """)

    # 2. Institutions (KPLC, Schools, Hospitals)
    op.execute("""
        CREATE TABLE IF NOT EXISTS institutions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('utility', 'school', 'hospital')),
            paybill_number TEXT,
            account_number TEXT,
            active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    # 3. Direct Payouts (The Pool)
    op.execute("""
        CREATE TABLE IF NOT EXISTS institutional_payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID NOT NULL REFERENCES requests(id),
            institution_id UUID NOT NULL REFERENCES institutions(id),
            amount_pence INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
            bank_transaction_ref TEXT,
            kplc_token TEXT,
            paid_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS institutional_payments")
    op.execute("DROP TABLE IF EXISTS institutions")
    op.execute("ALTER TABLE partners DROP COLUMN IF EXISTS partner_type")
