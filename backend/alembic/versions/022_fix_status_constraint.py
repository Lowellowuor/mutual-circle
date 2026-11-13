"""force update requests_status_check constraint

Migration 021 attempted to drop the constraint by a hardcoded name.
In the CI database, the constraint had a different auto-generated name.
This migration finds and drops ANY check constraint on the requests table
that mentions 'status', ensuring the new 'pending_evidence' state is
universally accepted.
"""
from alembic import op

revision = "022_fix_status_constraint"
down_revision = "021_requests_evidence_fields"

def upgrade() -> None:
    op.execute("""
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'requests'::regclass
                  AND contype = 'c'
                  AND pg_get_constraintdef(oid) LIKE '%status%'
            LOOP
                EXECUTE 'ALTER TABLE requests DROP CONSTRAINT ' || quote_ident(r.conname);
            END LOOP;
        END$$;
    """)
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
    pass
