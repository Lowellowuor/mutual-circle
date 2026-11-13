"""add token_hash to intake_surveys for standalone surveys"""
from alembic import op

revision = "018_survey_token_hash"
down_revision = "017_standalone_surveys"

def upgrade():
    op.execute("ALTER TABLE intake_surveys ADD COLUMN IF NOT EXISTS token_hash TEXT")
    op.execute("UPDATE intake_surveys s SET token_hash = r.token_hash FROM requests r WHERE s.request_id = r.id")
    op.execute("ALTER TABLE intake_surveys ALTER COLUMN token_hash SET NOT NULL")

def downgrade():
    op.execute("ALTER TABLE intake_surveys DROP COLUMN IF EXISTS token_hash")
