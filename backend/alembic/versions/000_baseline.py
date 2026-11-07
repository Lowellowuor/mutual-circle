"""Baseline: all 21 app tables at their post-005 shape.

Revision ID: 000_baseline
Revises: None (this is now the first migration)
Create Date: 2026-11-07

Companion to audit item C1: "The repo cannot rebuild its own database.
Code queries 23 tables, but only 2 are created by code."

Creates the 21 app tables at their live-schema shape. ledger_entries
(created by 001_ledger) and idempotency_keys (created by 003_idempotency_keys)
are deliberately excluded — those migrations run after this baseline
and are already idempotent (IF NOT EXISTS / IF EXISTS / early-return),
so they no-op safely on a fresh DB where the baseline has already
created the schema.

Historical migrations 001-005 chain unchanged; only 001's
down_revision is updated to '000_baseline'.

For EXISTING databases (e.g. Neon) that are already at 005:
  alembic stamp 000_baseline
  alembic upgrade head
That stamps the current DB as baseline-applied before continuing.
"""
from typing import Sequence, Union
from alembic import op

revision: str = '000_baseline'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""CREATE TABLE IF NOT EXISTS audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_role text NOT NULL, actor_id text, action text NOT NULL,
        target_hash text, metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS campaigns (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL, cohort_goal_text text NOT NULL,
        target_amount_pence integer NOT NULL,
        pooled_amount_pence integer NOT NULL DEFAULT 0,
        target_count integer NOT NULL,
        covered_count integer NOT NULL DEFAULT 0,
        days_remaining integer NOT NULL DEFAULT 0,
        is_closed boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS dedup_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        hashed_object_id text NOT NULL, object_type text NOT NULL,
        first_funded_by text NOT NULL,
        first_funded_date date NOT NULL,
        duplicate_attempt_date date NOT NULL,
        status text NOT NULL DEFAULT 'blocked',
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS depot_state (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        received_units integer NOT NULL DEFAULT 0,
        quality_checked_units integer NOT NULL DEFAULT 0,
        packed_bundles integer NOT NULL DEFAULT 0,
        loaded_locker_units integer NOT NULL DEFAULT 0,
        updated_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS donor_contributions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        donor_hash text NOT NULL, amount_pence integer NOT NULL,
        is_anonymous boolean NOT NULL DEFAULT true,
        opt_in_ledger boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS donor_profiles (
        donor_hash text PRIMARY KEY,
        display_name text,
        opt_in_ledger boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS helplines (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, number text NOT NULL, sub text NOT NULL,
        category text NOT NULL DEFAULT 'crisis',
        display_order integer NOT NULL DEFAULT 0,
        active boolean NOT NULL DEFAULT true)""")

    op.execute("""CREATE TABLE IF NOT EXISTS household_declarations (
        token_hash text PRIMARY KEY,
        household_size smallint NOT NULL,
        declared_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS locker_stock (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        location text NOT NULL, bundle_type text NOT NULL,
        available integer NOT NULL DEFAULT 0,
        capacity integer NOT NULL,
        low_stock_threshold integer NOT NULL DEFAULT 5)""")

    op.execute("""CREATE TABLE IF NOT EXISTS match_interests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id text NOT NULL, title text NOT NULL,
        token_hash text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash text NOT NULL, request_id uuid,
        template text NOT NULL, content text NOT NULL,
        status text NOT NULL DEFAULT 'queued',
        created_at timestamptz NOT NULL DEFAULT now(),
        sent_at timestamptz, read_at timestamptz)""")

    op.execute("""CREATE TABLE IF NOT EXISTS opportunities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL, title text NOT NULL, description text NOT NULL,
        locality text NOT NULL, commit_text text NOT NULL,
        posted_at timestamptz NOT NULL DEFAULT now(),
        active boolean NOT NULL DEFAULT true)""")

    op.execute("""CREATE TABLE IF NOT EXISTS partners (
        id text PRIMARY KEY, name text NOT NULL, type text NOT NULL,
        api_key text NOT NULL, contact_email text,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS pledges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        donor_hash text NOT NULL, type text NOT NULL,
        description text NOT NULL, max_value_pence integer,
        locality text NOT NULL,
        status text NOT NULL DEFAULT 'awaiting_match',
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS rate_counters (
        token_hash text NOT NULL, day date NOT NULL DEFAULT CURRENT_DATE,
        request_count integer NOT NULL DEFAULT 0,
        total_value_pence integer NOT NULL DEFAULT 0,
        PRIMARY KEY (token_hash, day))""")

    op.execute("""CREATE TABLE IF NOT EXISTS risk_flags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        target_hash text NOT NULL, severity text NOT NULL,
        title text NOT NULL, description text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        investigation_notes text, routed_by text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS staff_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id text NOT NULL, role text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL, revoked_at timestamptz)""")

    op.execute("""CREATE TABLE IF NOT EXISTS requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash text NOT NULL, type text NOT NULL, category text NOT NULL,
        amount_pence integer, hashed_object_id text,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        tier smallint NOT NULL, status text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        pledge_id uuid REFERENCES pledges(id) ON DELETE SET NULL,
        CONSTRAINT requests_status_check CHECK (status IN (
            'pending_check','verified','submitted_to_partner',
            'voucher_issued','fulfilled','withdrawn','collected')))""")

    op.execute("""CREATE TABLE IF NOT EXISTS vouchers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        token_hash text NOT NULL, partner_name text NOT NULL,
        partner_type text NOT NULL, description text NOT NULL,
        max_value_pence integer NOT NULL,
        pin_hash text NOT NULL, pin_last4 text NOT NULL,
        status text NOT NULL DEFAULT 'active',
        expires_at timestamptz NOT NULL, issued_by text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS partner_confirmations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id text NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        confirmation_type text NOT NULL, note text,
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("""CREATE TABLE IF NOT EXISTS voucher_redemptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        voucher_id uuid NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
        partner_name text NOT NULL, amount_pence integer NOT NULL,
        status text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now())""")

    op.execute("CREATE INDEX IF NOT EXISTS idx_requests_token ON requests(token_hash)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_token ON notifications(token_hash)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_request ON notifications(request_id) WHERE request_id IS NOT NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_donor_contrib_hash ON donor_contributions(donor_hash)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_pledges_donor ON pledges(donor_hash)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_vouchers_request ON vouchers(request_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_vouchers_pin_last4 ON vouchers(pin_last4)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_partner_confirmations_request ON partner_confirmations(request_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_match_interests_token ON match_interests(token_hash)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_risk_flags_status ON risk_flags(status)")


def downgrade() -> None:
    raise RuntimeError(
        "Baseline downgrade is unsafe - drop the database and re-create "
        "instead. Reversing 21 CREATE TABLE statements in dependency order "
        "is not a supported operation. For a fresh start: drop DB, "
        "alembic upgrade head."
    )
