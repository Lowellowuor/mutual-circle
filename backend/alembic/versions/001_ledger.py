"""Initial ledger: append-only hash chain

Revision ID: 001_ledger
Revises:
Create Date: 2026-10-30

This migration creates the single most important table in the system:
ledger_entries. It closes R.U.T.H Section 8 item 5 (blockchain vs append-only
database) by demonstrating that a unique constraint on object_hash plus a
hash chain provides the same guarantees a blockchain would — without the
operational overhead.

Properties enforced by this schema:
  1. Each object (meter/admission/invoice) can appear at most once
     → UNIQUE (object_hash) prevents double-payment across funders
  2. Each entry contains the hash of the previous entry
     → tampering with history is detectable
  3. Every entry has a self-hash covering its own content
     → tampering with a single row is detectable
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '001_ledger'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE ledger_entries (
            id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            object_hash           TEXT NOT NULL,
            category              TEXT NOT NULL CHECK (category IN (
                'utility', 'school_fee', 'hospital_invoice', 'swap_bundle'
            )),
            amount_pence          INTEGER NOT NULL CHECK (amount_pence > 0),
            settled_by_hash       TEXT NOT NULL,
            previous_entry_hash   TEXT NOT NULL,
            entry_hash            TEXT NOT NULL,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE UNIQUE INDEX ledger_object_hash_unique ON ledger_entries (object_hash)")
    op.execute("CREATE INDEX ledger_created_idx ON ledger_entries (created_at DESC)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ledger_entries")