"""make intake_surveys.request_id nullable

Allows capturing household data at registration, before the user has
created their first request.
"""
from alembic import op
import sqlalchemy as sa

revision = "017_standalone_surveys"
down_revision = "016_encrypt_mpesa_phone"

def upgrade():
    op.alter_column("intake_surveys", "request_id", existing_type=sa.UUID(), nullable=True)
    # Drop the unique constraint if it exists, since we can't have unique request_id if it's null
    op.execute("ALTER TABLE intake_surveys DROP CONSTRAINT IF EXISTS intake_surveys_request_id_key")

def downgrade():
    op.alter_column("intake_surveys", "request_id", existing_type=sa.UUID(), nullable=False)
    op.create_unique_constraint("intake_surveys_request_id_key", "intake_surveys", ["request_id"])
