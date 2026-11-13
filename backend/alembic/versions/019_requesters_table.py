"""create requesters table for encrypted phone storage

R.U.T.H 4.1: requesters are represented by a token. But to send them
KPLC tokens or Locker PINs, we must store their phone encrypted at rest.
This table links a token_hash to the encrypted phone.
"""
from alembic import op
import sqlalchemy as sa

revision = "019_requesters_table"
down_revision = "018_survey_token_hash"

def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS requesters (
            token_hash TEXT PRIMARY KEY,
            phone_encrypted TEXT NOT NULL,
            phone_hash TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

def downgrade():
    op.execute("DROP TABLE IF EXISTS requesters")
