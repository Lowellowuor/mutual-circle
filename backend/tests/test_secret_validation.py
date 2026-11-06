"""Tests for _validate_secrets in mtc.main.

These tests were added AFTER the original commit (fd3aa83) because the
original verification via PowerShell env vars did not actually exercise
the fail-fast path -- the .env file provided real values that overrode
the empty env vars, so the `missing` list was empty and no RuntimeError
was raised. These tests bypass .env entirely by instantiating Settings
with env_file=None, so the validation logic is exercised in isolation.
"""
from unittest.mock import patch

import pytest

from mtc.config import Settings
from mtc.main import _validate_secrets


def _isolated_settings(**overrides) -> Settings:
    """Build a Settings instance that ignores .env and only uses overrides."""
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    for k, v in overrides.items():
        setattr(s, k, v)
    return s


def test_production_all_empty_raises():
    s = _isolated_settings(
        environment="production",
        jwt_secret="",
        ledger_hmac_key="",
        token_hmac_key_current="",
    )
    with patch("mtc.main.settings", s):
        with pytest.raises(RuntimeError) as exc:
            _validate_secrets()
    assert "JWT_SECRET" in str(exc.value)
    assert "LEDGER_HMAC_KEY" in str(exc.value)
    assert "TOKEN_HMAC_KEY_CURRENT" in str(exc.value)


def test_production_partial_empty_raises_naming_only_missing():
    s = _isolated_settings(
        environment="production",
        jwt_secret="a" * 64,
        ledger_hmac_key="",
        token_hmac_key_current="c" * 64,
    )
    with patch("mtc.main.settings", s):
        with pytest.raises(RuntimeError) as exc:
            _validate_secrets()
    msg = str(exc.value)
    assert "LEDGER_HMAC_KEY" in msg
    assert "JWT_SECRET" not in msg
    assert "TOKEN_HMAC_KEY_CURRENT" not in msg


def test_production_short_secret_raises():
    s = _isolated_settings(
        environment="production",
        jwt_secret="a" * 10,
        ledger_hmac_key="b" * 64,
        token_hmac_key_current="c" * 64,
    )
    with patch("mtc.main.settings", s):
        with pytest.raises(RuntimeError) as exc:
            _validate_secrets()
    assert "JWT_SECRET" in str(exc.value)


def test_production_all_valid_no_raise():
    s = _isolated_settings(
        environment="production",
        jwt_secret="a" * 64,
        ledger_hmac_key="b" * 64,
        token_hmac_key_current="c" * 64,
    )
    with patch("mtc.main.settings", s):
        _validate_secrets()


def test_development_empty_does_not_raise(caplog):
    s = _isolated_settings(
        environment="development",
        jwt_secret="",
        ledger_hmac_key="",
        token_hmac_key_current="",
    )
    with patch("mtc.main.settings", s):
        _validate_secrets()
    assert "Running in development mode" in caplog.text
    assert "weak or empty secrets" in caplog.text


def test_development_valid_no_warning(caplog):
    s = _isolated_settings(
        environment="development",
        jwt_secret="a" * 64,
        ledger_hmac_key="b" * 64,
        token_hmac_key_current="c" * 64,
    )
    with patch("mtc.main.settings", s):
        _validate_secrets()
    assert "weak or empty secrets" not in caplog.text
