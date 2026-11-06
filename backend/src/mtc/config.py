"""Application configuration.

Loads from .env at the backend root. Secrets default to empty strings for
local development convenience. Production startup fails if any required
secret is missing or shorter than 32 characters -- see
`mtc.main._validate_secrets` for the exact set of validated keys.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment
    environment: str = "development"
    log_level: str = "info"

    # Database connections (three separate databases)
    database_url_main: str = ""
    database_url_bench: str = ""
    database_url_messaging: str = ""

    # Cryptographic keys
    ledger_hmac_key: str = ""
    token_hmac_key_current: str = ""
    token_hmac_key_previous: str = ""
    messaging_encryption_key: str = ""
    jwt_secret: str = ""

    # Staff credentials
    staff_enrol_id: str = ""
    staff_enrol_pin_hash: str = ""
    staff_fulf_id: str = ""
    staff_fulf_pin_hash: str = ""
    staff_audit_id: str = ""
    staff_audit_pin_hash: str = ""


settings = Settings()