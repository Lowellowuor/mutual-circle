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

- **`jwt_secret` defaults to empty.** Nothing validates secrets at startup. If `JWT_SECRET` is unset in a deploy, staff JWTs are signed with the empty string and are forgeable. *Fix:* fail-fast startup validation that refuses to boot if any critical secret is empty or shorter than 32 bytes.

- **Locker PINs are generated with `Math.random()` in the browser.** JS `Math.random()` is not cryptographically secure. *Fix:* generate on the server using `secrets.token_digits()`, store the hash only, add expiry and attempt limit.

- **Object IDs are hashed in the browser with a key shipped in the JS bundle.** A bundle key is not secret — anyone can extract it from DevTools. If an attacker has a known bill number and the hash they can compute any hash. *Fix:* send the raw object number over HTTPS, hash on the server with a server-held HMAC key.

### Infrastructure

- **The repo cannot rebuild its own database.** 18+ tables are created by raw SQL outside Alembic. `alembic upgrade head` on a fresh Postgres produces a partially migrated database. *Fix:* baseline migration that includes every table, plus seed data.

- **No structured logging, request IDs, error tracking, or alerts.** `/health` returns a static response without checking the database. *Fix:* structured JSON logging, per-request UUIDs, `/health` that queries `SELECT 1`.

## P1 — fix before scaling beyond the pilot

- **Staff login uses three shared accounts with no lockout.** `FULF-08`, `AUDIT-02`, `ENROL-04` are shared across all users of each role. *Fix:* per-person accounts, lockout on failed attempts, TOTP for fulfilment and audit.

- **No API-wide rate limiting or security headers.** No `X-RateLimit-*`, no HSTS, no `Content-Security-Policy`, no `X-Content-Type-Options: nosniff`. *Fix:* add middleware for the standard headers, define limits per endpoint.

- **`settled_by_hash` in the ledger export is the staff ID.** An auditor reading the public ledger can map a settlement to the exact staff member. *Fix:* use a per-staff pseudonym, or omit from the public export.

- **The rate-limit history and request history live in `localStorage`.** A user can clear local storage to reset their rate limit; a compromised device can dump the full history. *Fix:* move both to server-side tables, clear local data on logout.

- **`previous_weekly_salt` is never used.** HMAC key rotation is described in `docs/auth.md` but not implemented. *Fix:* rotation job that promotes current to previous on a schedule, keeps both valid for a grace window.

## P2 — found in due diligence

- No PWA manifest or service worker.
- No security test coverage (XSS, SQL injection, CSRF).
- No secrets scanner in CI.
- No dependency audit — `python-jose` is poorly maintained; consider PyJWT.
- `catch {}` in ~10 places swallows errors silently. In a money flow this hides bugs.
- The Bench and messaging database URLs and `messaging_encryption_key` are defined in config but unused. Either wire them or remove them from the config.

## What is *not* a security issue

- The blind-pool invariant is enforced at the schema level. No field links a donor to a disbursement.
- HMAC-chained ledger entries are tamper-evident — altering any entry breaks the chain from that point forward.
- Requester phone numbers are never stored raw; only the HMAC hash is persisted.
- Voucher PINs are bcrypt-hashed in the database.

## Reporting

Report security issues to the maintainer directly. Do not open a public issue.
