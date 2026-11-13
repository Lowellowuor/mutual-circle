"""encrypt mpesa_transactions.expected_phone

R.U.T.H 4.1 [Rec] + alignment doc point 4: phone numbers must not sit
in the DB as plaintext. This migration:
  1. Adds expected_phone_encrypted (Fernet ciphertext)
  2. Adds expected_phone_hash (HMAC-SHA256 for lookup/verification)
  3. Backfills both for existing rows
  4. Drops the plaintext column

The callback verification path now compares hash(incoming) to
expected_phone_hash, so decryption is never needed for verification.

MESSAGING_ENCRYPTION_KEY must be set before running this migration.

Revision ID: 016_encrypt_mpesa_phone
Revises: 015_partner_institutions
"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy import text

revision: str = "016_encrypt_mpesa_phone"
down_revision: Union[str, None] = "015_partner_institutions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE mpesa_transactions ADD COLUMN IF NOT EXISTS expected_phone_encrypted TEXT")
    op.execute("ALTER TABLE mpesa_transactions ADD COLUMN IF NOT EXISTS expected_phone_hash TEXT")

    # Backfill: read plaintext, encrypt + hash, write back
    from mtc.crypto import encrypt_phone, hash_phone
    bind = op.get_bind()
    rows = bind.execute(text(
        "SELECT checkout_request_id, expected_phone FROM mpesa_transactions "
        "WHERE expected_phone IS NOT NULL AND expected_phone <> ''"
    )).fetchall()

    for row in rows:
        plain = row.expected_phone
        try:
            enc = encrypt_phone(plain)
            h = hash_phone(plain)
        except Exception as exc:
            raise RuntimeError(
                f"Cannot encrypt existing row {row.checkout_request_id}: {exc}. "
                f"MESSAGING_ENCRYPTION_KEY must be set before this migration."
            ) from exc
        bind.execute(
            text(
                "UPDATE mpesa_transactions "
                "SET expected_phone_encrypted = :enc, expected_phone_hash = :h "
                "WHERE checkout_request_id = :cid"
            ),
            {"enc": enc, "h": h, "cid": row.checkout_request_id},
        )

    op.execute("ALTER TABLE mpesa_transactions DROP COLUMN IF EXISTS expected_phone")

    # Not NULL enforcement going forward
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'chk_mpesa_phone_hash_not_null_when_pending'
            ) THEN
                ALTER TABLE mpesa_transactions
                ADD CONSTRAINT chk_mpesa_phone_hash_not_null_when_pending
                CHECK (expected_phone_hash IS NOT NULL OR status IN ('callback_rejected', 'expired'));
            END IF;
        END$$
    """)


def downgrade() -> None:
    # Downgrade restores the column shape but cannot restore plaintext from
    # ciphertext without the key. We re-decrypt with the current key.
    op.execute("ALTER TABLE mpesa_transactions ADD COLUMN IF NOT EXISTS expected_phone TEXT")

    from mtc.crypto import decrypt_phone
    bind = op.get_bind()
    rows = bind.execute(text(
        "SELECT checkout_request_id, expected_phone_encrypted FROM mpesa_transactions "
        "WHERE expected_phone_encrypted IS NOT NULL AND expected_phone_encrypted <> ''"
    )).fetchall()
    for row in rows:
        try:
            plain = decrypt_phone(row.expected_phone_encrypted)
        except Exception:
            plain = ""  # cannot recover
        bind.execute(
            text("UPDATE mpesa_transactions SET expected_phone = :p WHERE checkout_request_id = :cid"),
            {"p": plain, "cid": row.checkout_request_id},
        )

    op.execute("ALTER TABLE mpesa_transactions DROP CONSTRAINT IF EXISTS chk_mpesa_phone_hash_not_null_when_pending")
    op.execute("ALTER TABLE mpesa_transactions DROP COLUMN IF EXISTS expected_phone_hash")
    op.execute("ALTER TABLE mpesa_transactions DROP COLUMN IF EXISTS expected_phone_encrypted")
