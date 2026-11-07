from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '004_pledge_request_link'
down_revision: Union[str, None] = '003_idempotency_keys'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS pledge_id uuid REFERENCES pledges(id) ON DELETE SET NULL
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_requests_pledge_id
        ON requests (pledge_id) WHERE pledge_id IS NOT NULL
    """)
    op.execute("""
        DO $$
        DECLARE cdef text;
        BEGIN
            SELECT pg_get_constraintdef(c.oid) INTO cdef
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            WHERE t.relname = 'pledges' AND c.conname = 'pledges_status_check';
            IF cdef IS NOT NULL AND cdef NOT LIKE '%settled%' THEN
                EXECUTE 'ALTER TABLE pledges DROP CONSTRAINT pledges_status_check';
                EXECUTE 'ALTER TABLE pledges ADD CONSTRAINT pledges_status_check CHECK (status = ANY (ARRAY[''awaiting_match''::text, ''matched''::text, ''settled''::text]))';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_requests_pledge_id")
    op.execute("ALTER TABLE requests DROP COLUMN IF EXISTS pledge_id")
