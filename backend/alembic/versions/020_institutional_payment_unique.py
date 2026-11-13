"""unique constraint on institutional_payments.request_id

Needed for the ON CONFLICT upsert in the admin confirm route. A request
can only have one institutional payment at a time.

Revision ID: 020_institutional_payment_unique
Revises: 019_requesters_table
"""
from alembic import op

revision = "020_institutional_payment_unique"
down_revision = "019_requesters_table"


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'institutional_payments_request_id_key'
            ) THEN
                ALTER TABLE institutional_payments
                ADD CONSTRAINT institutional_payments_request_id_key
                UNIQUE (request_id);
            END IF;
        END$$
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE institutional_payments DROP CONSTRAINT IF EXISTS institutional_payments_request_id_key")
