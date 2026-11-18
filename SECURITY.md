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


## Webhook attack surface — Paystack

Donations and pledges are paid through Paystack hosted checkout. The
M-PESA Daraja integration (unsigned STK callback at
`/mpesa/stk/callback`, requester self-pay at `/requests/{id}/pay`) was
removed.

`POST /paystack/webhook` receives Paystack events. Controls:

1. **Signed requests only.** `x-paystack-signature` must equal the
   HMAC-SHA512 of the raw request body keyed with `PAYSTACK_SECRET_KEY`
   (constant-time compare). Missing or wrong signature -> 401, checked
   before a database connection is taken. If the key is not configured
   the endpoint returns 500 instead of accepting anything.
2. **The event body is not trusted.** Only `charge.success` is acted on,
   and only the `reference` is read from it. The backend then calls
   Paystack's verify API and marks a payment paid only if the verified
   `status` is `success` and `reference`, `amount` (exact, lowest
   currency unit) and `currency` all match the pending row we saved. A
   mismatch is logged at ERROR and nothing changes.
3. **Write-then-call.** The pending `paystack_payments` row, with our own
   unguessable reference, is committed before Paystack is called, so
   every reference Paystack knows about is in our table. Unknown
   references are acknowledged (200) and ignored.
4. **Idempotent, and nothing can block the real payment.** `paid` is set
   with `UPDATE ... WHERE status <> 'paid'`, so duplicate deliveries and
   races do nothing. Failed, cancelled, rejected or forged events never
   write a state that stops a later genuine success from being recorded.
5. **Retries on our errors.** Unexpected errors (DB down, Paystack verify
   unreachable) return 500 so Paystack retries.
6. **One live checkout per target.** A partial unique index allows one
   `pending` payment per donation or pledge. A pending checkout older than
   30 minutes is re-verified with Paystack before a new one may start.
7. **No PII in logs or tables.** Request bodies and verify responses
   (customer email, phone, card details) are never logged; logs carry the
   reference and outcome only. `paystack_payments` stores no email, phone
   or card data. A donor email, if a client sends one, is passed to
   Paystack and not stored. Without one, a placeholder
   `donor-<sha256(donor_hash)[:16]>@example.com` is used, so
   the `X-Donor-Hash` credential is never sent to Paystack.

`GET /payments/verify/{reference}` (frontend return page) requires the
`X-Donor-Hash` that created the payment (404 otherwise) and uses the
same verify-then-record logic. It never trusts the `reference` or
`trxref` query string Paystack appends to the redirect beyond using it
as a lookup key.

Residual risks / open items:

- `PAYSTACK_SECRET_KEY` is both the API key and the webhook signing key.
  Leaking it allows forged webhooks, though step 2 still requires
  Paystack's own verify API to report a matching successful charge.
  Rotate it in the Paystack dashboard if exposed.
- If a donor completes an old checkout after starting a new one for the
  same target, both charges are recorded and a
  `PAYSTACK_DOUBLE_PAYMENT` CRITICAL log is written. Refunds are manual.
- `X-Donor-Hash` is a bearer credential held in localStorage (see
  Authentication gaps above); anyone holding it can check that donor's
  payment status.
- Local development exposes the webhook through a cloudflared quick
  tunnel (docs/deploy.md). Use test keys only, and never point the live
  webhook URL at a laptop.
