"""Shared fakes for the no-DB Paystack tests.

FakeConn answers asyncpg calls by matching a SQL fragment, so tests do
not depend on query order, and records every call so tests can assert
what was (and was not) written.
"""
import hashlib
import hmac
import json
import uuid
from typing import Any

TEST_SECRET = "sk_test_" + "0123456789abcdef" * 2 + "01234567"
DONOR = "test-donor-hash-paystack"
DONATION_ID = uuid.UUID("00000000-0000-0000-0000-0000000000d1")
PLEDGE_ID = uuid.UUID("00000000-0000-0000-0000-0000000000a1")
CHECKOUT_URL = "https://checkout.paystack.com/test-access-code"


class _Tx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


class FakeConn:
    def __init__(
        self,
        fetchrow: dict[str, Any] | None = None,
        execute: dict[str, Any] | None = None,
    ):
        # fragment -> value | callable(*args) | Exception instance
        self.fetchrow_map: dict[str, Any] = dict(fetchrow or {})
        self.execute_map: dict[str, Any] = dict(execute or {})
        self.log: list[tuple[str, str, tuple]] = []

    def transaction(self):
        return _Tx()

    @staticmethod
    def _answer(mapping: dict[str, Any], sql: str, args: tuple, default: Any) -> Any:
        for fragment, value in mapping.items():
            if fragment in sql:
                if isinstance(value, Exception):
                    raise value
                return value(*args) if callable(value) else value
        if isinstance(default, AssertionError):
            raise default
        return default

    async def fetchrow(self, sql: str, *args):
        self.log.append(("fetchrow", sql, args))
        return self._answer(self.fetchrow_map, sql, args, AssertionError(f"unexpected fetchrow: {sql}"))

    async def execute(self, sql: str, *args):
        self.log.append(("execute", sql, args))
        return self._answer(self.execute_map, sql, args, "UPDATE 1")

    async def fetchval(self, sql: str, *args):
        self.log.append(("fetchval", sql, args))
        return True

    async def fetch(self, sql: str, *args):
        self.log.append(("fetch", sql, args))
        return []

    def sql(self) -> str:
        return " | ".join(entry[1] for entry in self.log)

    def ran(self, fragment: str) -> bool:
        return any(fragment in entry[1] for entry in self.log)


def payment_row(
    reference: str = "mc-don-abc123",
    *,
    status: str = "pending",
    amount_pence: int = 250_000,
    currency: str = "KES",
    target_table: str = "donor_contributions",
    target_id: uuid.UUID = DONATION_ID,
    donor_hash: str = DONOR,
    stale: bool | None = None,
) -> dict[str, Any]:
    row = {
        "reference": reference,
        "target_table": target_table,
        "target_id": target_id,
        "donor_hash": donor_hash,
        "amount_pence": amount_pence,
        "currency": currency,
        "status": status,
    }
    if stale is not None:
        row["stale"] = stale
    return row


def paystack_tx(
    reference: str = "mc-don-abc123",
    *,
    status: str = "success",
    amount: Any = 250_000,
    currency: str = "KES",
) -> dict[str, Any]:
    """Shape of verify_transaction()'s return value (Paystack's data object)."""
    return {
        "id": 4099260516,
        "status": status,
        "reference": reference,
        "amount": amount,
        "currency": currency,
        "channel": "card",
        "paid_at": "2026-11-18T10:00:00.000Z",
        "customer": {"email": "real.person@example.com", "phone": "+254711000001"},
    }


def sign(body: bytes, secret: str = TEST_SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()


def webhook_request(event: dict[str, Any], secret: str = TEST_SECRET) -> tuple[bytes, dict[str, str]]:
    raw = json.dumps(event).encode()
    return raw, {"x-paystack-signature": sign(raw, secret), "Content-Type": "application/json"}


def charge_success(reference: str = "mc-don-abc123", amount: int = 250_000) -> dict[str, Any]:
    return {
        "event": "charge.success",
        "data": {
            "id": 4099260516,
            "status": "success",
            "reference": reference,
            "amount": amount,
            "currency": "KES",
            "customer": {"email": "real.person@example.com", "phone": "+254711000001"},
            "authorization": {"last4": "4081", "bank": "TEST BANK"},
        },
    }
