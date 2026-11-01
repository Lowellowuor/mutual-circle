from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '003_idempotency_keys'
down_revision: Union[str, None] = '002_collected_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            key           text PRIMARY KEY,
            scope         text NOT NULL,
            caller_id     text NOT NULL,
            response_body jsonb,
            created_at    timestamptz NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_idempotency_created_at
        ON idempotency_keys (created_at)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_idempotency_created_at")
    op.execute("DROP TABLE IF EXISTS idempotency_keys")
