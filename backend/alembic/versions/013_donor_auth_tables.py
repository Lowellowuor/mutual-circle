"""capture donor auth schema — orphan tables from a never-committed 011_donor_auth

These three tables existed in the live DB (created by a migration file
that was never committed) but no migration file creates them. A fresh
``alembic upgrade head`` on a new database left them missing, so the
donor OTP/login flow crashed with UndefinedTableError on first use.

Revision ID: 013_donor_auth_tables
Revises: 012_donations_status_fix
Create Date: 2026-11-13
"""
from typing import Sequence, Union
from alembic import op

revision: str = "013_donor_auth_tables"
down_revision: Union[str, None] = "012_donations_status_fix"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Order matters: donor_profiles must exist before donor_sessions
    # (FK reference). All IF NOT EXISTS so running against an existing
    # DB (like Neon) is a no-op.

    op.execute("""
        CREATE TABLE IF NOT EXISTS donor_profiles (
            donor_hash     TEXT PRIMARY KEY,
            display_name   TEXT,
            opt_in_ledger  BOOLEAN NOT NULL DEFAULT false,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS donor_sessions (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donor_hash  TEXT NOT NULL REFERENCES donor_profiles(donor_hash) ON DELETE CASCADE,
            phone_hash  TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at  TIMESTAMPTZ NOT NULL,
            revoked_at  TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_donor_sessions_expiry
        ON donor_sessions (expires_at)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_donor_sessions_hash
        ON donor_sessions (donor_hash)
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS donor_otp_challenges (
            phone_hash         TEXT PRIMARY KEY,
            code_hash          TEXT NOT NULL,
            expires_at         TIMESTAMPTZ NOT NULL,
            attempts           INTEGER NOT NULL DEFAULT 0,
            send_count         INTEGER NOT NULL DEFAULT 1,
            window_started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            resend_after       TIMESTAMPTZ NOT NULL,
            created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)


def downgrade() -> None:
    # Only drop the tables we are confident were created by this migration.
    # Both are empty-of-important-data in practice (sessions is always
    # short-lived; OTP challenges expire). donor_profiles is NOT dropped
    # because it holds persistent donor recognition data.
    op.execute("DROP TABLE IF EXISTS donor_sessions")
    op.execute("DROP TABLE IF EXISTS donor_otp_challenges")
