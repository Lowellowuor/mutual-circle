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

    environment: str = "development"
    log_level: str = "info"

    database_url_main: str = ""
    database_url_bench: str = ""
    database_url_messaging: str = ""

    ledger_hmac_key: str = ""
    token_hmac_key_current: str = ""
    token_hmac_key_previous: str = ""
    messaging_encryption_key: str = ""
    jwt_secret: str = ""
    partner_hmac_key: str = ""


    # Paystack (donations + pledges). The secret key lives only in
    # backend/.env, which is gitignored. Test keys start with sk_test_.
    paystack_secret_key: str = ""
    # ISO currency sent to Paystack. Amounts are always sent in the
    # currency's lowest unit, which is what *_pence columns already hold.
    paystack_currency: str = "KES"
    # Frontend page Paystack redirects the donor to after checkout.
    # Paystack appends ?trxref=...&reference=... to this URL.
    paystack_callback_url: str = "http://localhost:3000/mutual-circle/donor/payment-return"

    at_environment: str = "sandbox"
    at_username: str = "sandbox"
    at_api_key: str = ""
    at_sender_id: str = ""
    # Tier 2 photo evidence (R.U.T.H §4.3 fallback path)
    evidence_storage_dir: str = "uploads/evidence"
    evidence_max_size_mb: int = 5

    staff_enrol_id: str = ""
    staff_enrol_pin_hash: str = ""
    staff_fulf_id: str = ""
    staff_fulf_pin_hash: str = ""
    staff_audit_id: str = ""
    staff_audit_pin_hash: str = ""


settings = Settings()