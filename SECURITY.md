# Security notes

**This is a prototype.** Do not deploy publicly without resolving the items below.

Items are grouped by how they would be caught. **P0** = a security audit or a curious developer will find it in the first hour. **P1** = caught in review. **P2** = found in due diligence.

## P0 — must fix before any public deployment

### Authentication gaps

- **Requester OTP is generated in the browser and displayed on screen.** `POST /tokens` accepts a phone number without rate limiting. A malicious actor can enumerate tokens or brute-force OTPs. *Fix:* server-issued SMS OTP, per-phone and per-IP attempt limits, rate-limit `/tokens` to 5/hour.

- **Donor identity is a client-chosen `X-Donor-Hash` header.** A 4+ character string is accepted. Any client can impersonate any donor or fabricate donations. *Fix:* real donor sessions — OTP login, then a signed session cookie or JWT.

- **Partner key is static and unrotated.** `X-Partner-Key` values are seeded at onboarding and never expire. `docs/auth.md` explicitly flags this. *Fix:* per-partner JWT with rotation on the same schedule as requester HMAC keys.

- **`/partner/redeem` is unauthenticated.** Any caller can attempt voucher redemptions; only the 4-digit PIN gates success. PINs have no attempt limit. *Fix:* require `X-Partner-Key`, 6-digit PINs with expiry (already in the schema), lockout after 3 failed attempts, per-partner rate limit.

### Cryptography

- ~~**`jwt_secret` defaults to empty.**~~ **FIXED in `fd3aa83`.** The config still defaults to empty strings (for local dev convenience), but `_validate_secrets()` in `main.py` now refuses to start in production if `JWT_SECRET`, `LEDGER_HMAC_KEY`, or `TOKEN_HMAC_KEY_CURRENT` is missing or shorter than 32 characters. In development/other environments, it logs a warning listing the weak secrets but allows startup. Covered by 6 tests in `backend/tests/test_secret_validation.py`.

- **Locker PINs are generated with `Math.random()` in the browser.** JS `Math.random()` is not cryptographically secure. *Fix:* generate on the server using `secrets.token_digits()`, store the hash only, add expiry and attempt limit.

- **Object IDs are hashed in the browser with a key shipped in the JS bundle.** A bundle key is not secret — anyone can extract it from DevTools. If an attacker has a known bill number and the hash they can compute any hash. *Fix:* send the raw object number over HTTPS, hash on the server with a server-held HMAC key.

### Infrastructure

- **The repo cannot rebuild its own database.** 18+ tables are created by raw SQL outside Alembic. `alembic upgrade head` on a fresh Postgres produces a partially migrated database. *Fix:* baseline migration that includes every table, plus seed data.

- **No structured logging, request IDs, error tracking, or alerts.** `/health` returns a static response without checking the database. *Fix:* structured JSON logging, per-request UUIDs, `/health` that queries `SELECT 1`.

## P1 — fix before scaling beyond the pilot

- **Staff login uses three shared accounts with no lockout.** `FULF-08`, `AUDIT-02`, `ENROL-04` are shared across all users of each role. *Fix:* per-person accounts, lockout on failed attempts, TOTP for fulfilment and audit.

- **No API-wide rate limiting or security headers.** No `X-RateLimit-*`, no HSTS, no `Content-Security-Policy`, no `X-Content-Type-Options: nosniff`. *Fix:* add middleware for the standard headers, define limits per endpoint.

- ~~**`settled_by_hash` in the ledger export is the staff ID.**~~ **FIXED.** The public JSON endpoint never exposed it (only fetched the column for chain verification). The public CSV did — removed in the current commit. `settled_by_hash` remains in the DB and in `compute_entry_hash()` because removing it from either would break append-only chain integrity. Only the public CSV output is stripped. Verified: grep of CSV function shows no data-column reference. (Audit item A9.)

- **The rate-limit history and request history live in `localStorage`.** A user can clear local storage to reset their rate limit; a compromised device can dump the full history. *Fix:* move both to server-side tables, clear local data on logout.

- **`previous_weekly_salt` is never used.** HMAC key rotation is described in `docs/auth.md` but not implemented. *Fix:* rotation job that promotes current to previous on a schedule, keeps both valid for a grace window.

## P2 — found in due diligence

- No PWA manifest or service worker.
- No security test coverage (XSS, SQL injection, CSRF).
- No secrets scanner in CI.
- No dependency audit — `python-jose` is poorly maintained; consider PyJWT.
- `catch {}` in ~10 places swallows errors silently. In a money flow this hides bugs.
- The Bench and messaging database URLs and `messaging_encryption_key` are defined in config but unused. Either wire them or remove them from the config.

## What is and isn't logged

**Server-triggered state changes are logged.** Every dispatch, voucher
issuance, OCR verification, partner confirmation, and flag resolution
writes to the `audit_log` table via `append_audit`. Readable at
`GET /audit/log` (JSON) and `GET /audit/export.csv` (CSV), and shown
in the Console under Audit > Log.

**Client-initiated actions that don't change server state are not
logged.** Filter changes, view resets, and modal opens are not
persisted. The Console's CSV export (Audit > Export) now routes through
`GET /audit/export.csv` -- the same source of truth as the JSON audit
log -- instead of a client-generated file built from local state.

**Compliance-critical actions must be audited server-side.** If you add
a new action a compliance auditor would care about, add a backend route
that writes to `audit_log` -- do not add a client-side placeholder
function.

## What is *not* a security issue

- The blind-pool invariant is enforced at the schema level. No field links a donor to a disbursement.
- HMAC-chained ledger entries are tamper-evident — altering any entry breaks the chain from that point forward.
- Requester phone numbers are never stored raw; only the HMAC hash is persisted.
- Voucher PINs are bcrypt-hashed in the database.

## Reporting

Report security issues to the maintainer directly. Do not open a public issue.


## Webhook attack surface — M-PESA Daraja callback

`POST /mpesa/stk/callback` receives Safaricom STK Push callbacks. The
endpoint is unauthenticated by design: Safaricom does not sign payloads,
and their egress IP ranges change. The only verification is that the
`CheckoutRequestID` in the callback matches a request we initiated
(write-then-call contract in `/pool/{id}/pay`).

Mitigations:

1. **Idempotency on CheckoutRequestID.** A duplicate callback returns
   the cached response from the first. A malformed or spoofed
   CheckoutRequestID returns 200 with `{"status": "unknown_checkout_id"}`
   and does NOT update any request row.

2. **Always return 200.** Permanent failures and in-flight states would
   trigger Safaricom retries that cannot succeed. We return 200 to stop
   retries, and log the full payload. Manual reconciliation via
   `mpesa_receipt` is deferred to a future operations runbook.

3. **No trusted data from the callback alone.** `requests.mpesa_receipt`
   is stored but never used as an authorization signal. The
   `payment_status` column reflects Safaricom's claim, not a verified
   fact. Downstream business logic (voucher issuance, tier checks) does
   not read `payment_status` yet.

Residual risks accepted for pilot:

- A spoofed callback with a valid CheckoutRequestID (obtained from a
  real STK push) could mark a request as `paid`. Mitigation requires a
  secondary confirmation via the Daraja transaction status API, which
  is deferred to Phase 3 proper.
- A DB error during callback processing logs and returns 200 (no
  retry), potentially leaving the request in `pending_payment`. Manual
  reconciliation is required.

When `/pool/{id}/pay` lands:

- Add `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, and `AT_API_KEY` to
  `_REQUIRED_SECRETS` in `main.py` — the fail-fast logic must be
  promoted at the same time as the callers.
- Implement the transaction status API as a secondary verification for
  callbacks with a receipt above a threshold (e.g. > KES 5,000).
