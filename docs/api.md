# Mutual Circle API Â— Developer Reference

Complete reference for building against the Mutual Circle backend.

## Base URL

- Local dev: http://127.0.0.1:8000
- Interactive docs: /docs (Swagger UI) and /redoc
- OpenAPI schema: /openapi.json
- API version: 0.6.0

## Quickstart

Step 1 - Issue a requester token from a phone number:

    curl -X POST http://127.0.0.1:8000/tokens -H "Content-Type: application/json" -d "{\"phone\":\"+254712345678\"}"

Returns: {"token":"a1b2c3d4e5f6a7b8"}

Step 2 - Reserve a food bundle:

    curl -X POST http://127.0.0.1:8000/requests/swap -H "Content-Type: application/json" -H "X-Token: a1b2c3d4e5f6a7b8" -d "{\"bundle_category\":\"family\",\"locker_location\":\"Kibera Hub A\"}"

Step 3 - View your requests:

    curl http://127.0.0.1:8000/requests/mine -H "X-Token: a1b2c3d4e5f6a7b8"

## Error responses

Every failure returns the same JSON envelope:

    {"ok": false, "reason": "human-readable message", "status": 401}

HTTP status codes preserved. Business failures return HTTP 200 with ok: false.

## Authentication

Four schemes, one per actor type.

Requester - X-Token header (16-char hex, issued by POST /tokens)
Donor - X-Donor-Hash header (client-generated persistent hash)
Staff - Authorization: Bearer <jwt> (issued by POST /staff/login)
Partner - X-Partner-Key header (static, per-partner, e.g. kplc-demo-key-2026)

## Endpoints by actor

Requester (X-Token): POST /tokens, POST /requests/swap, POST /requests/pool, GET /requests/mine, POST /requests/{id}/pay, POST /requests/pool/{id}/evidence, GET /requests/pool/{id}/evidence, POST /requests/{id}/collect, GET /notifications/mine, PATCH /notifications/{id}/read, PATCH /notifications/read-all

Donor (X-Donor-Hash): POST /donations, GET /donations/mine, GET /donations/leaderboard, POST /pledges, GET /pledges/mine

Staff (Bearer): POST /staff/login, GET /fulfilment/queue, POST /fulfilment/requests/{id}/dispatch, POST /fulfilment/requests/{id}/voucher, GET /audit/flags, POST /audit/ocr/{id}/complete, GET /audit/evidence-queue, POST /audit/evidence/{id}/approve, POST /audit/evidence/{id}/reject

Partner (X-Partner-Key): GET /partners/me, GET /partners/me/redemptions, POST /partners/me/confirm/{id}, POST /partner/redeem

## Request status lifecycle

Swap path: reserved -> dispatched (optional) -> collected
Pool path (Tier 2): pending_evidence -> pending_check -> verified -> submitted_to_partner -> fulfilled
Pool path (Tier 3): pending_check -> verified -> submitted_to_partner -> fulfilled
           or verified -> voucher_issued -> collected

Terminal: collected, fulfilled, withdrawn, rejected.

## Money

All amounts in pence (amount_pence, max_value_pence, total_pooled_pence). KES 5,000 = 500000 pence.

## Reference

- docs/auth.md - full auth reference
- docs/roles.md - six-actor permission matrix
- docs/tiers.md - tier assignment rules
- docs/payout.md - dispatch vs voucher decision
- /docs (Swagger UI) - interactive endpoint explorer
- /openapi.json - machine-readable schema
## Payment and evidence endpoints (added 2026-11)

Paystack (donations and pledges):
- POST /donations/{id}/pay, POST /pledges/{id}/pay — `X-Donor-Hash` auth, optional `Idempotency-Key`. Body optional: `{"email": "..."}` (passed to Paystack, never stored; without it a placeholder `donor-<id>@example.com` is used). Saves a pending payment with a unique `reference`, then opens a Paystack checkout. Returns `{"ok": true, "reference": "mc-don-...", "authorization_url": "https://checkout.paystack.com/..."}`; redirect the browser to `authorization_url`. Amount comes from the donation (`amount_pence`) or pledge (`max_value_pence`), never the body. 409 if already paid or a checkout is in progress (a pending checkout older than 30 minutes is re-checked with Paystack first), 400 if a pledge has no cash value, 503 if Paystack is unreachable.
- POST /paystack/webhook — Paystack posts here. Requires `x-paystack-signature` = HMAC-SHA512 of the raw body keyed with `PAYSTACK_SECRET_KEY`, else 401. Acts only on `charge.success`, and only after `verify_transaction` confirms reference, amount and currency. Idempotent (a duplicate returns `{"status": "duplicate"}` and changes nothing). Responses: `paid`, `duplicate`, `rejected` (mismatch, not marked paid), `ignored`, `unknown_reference`. 500 on unexpected errors so Paystack retries.
- GET /payments/verify/{reference} — `X-Donor-Hash` auth (404 for anyone else's reference). Used by the frontend return page `/mutual-circle/donor/payment-return`. Confirms with Paystack unless already paid. Returns `{"reference", "status": "pending|paid|failed|abandoned", "kind": "donation|pledge", "target_id", "amount_pence", "currency"}`.

Payment state: `paystack_payments.status` pending -> paid | failed | abandoned (a late success still moves failed/abandoned to paid). Targets: `donor_contributions.status` and `pledges.payment_status` go unpaid -> pending_payment -> paid | payment_failed. A pledge's match `status` is never touched by payment.

Requester self-pay (`POST /requests/{id}/pay`) and the M-PESA callback (`POST /mpesa/stk/callback`) were removed. Bills are paid to institutions by fulfilment staff; see docs/payout.md.

Tier 2 photo evidence:
- POST /requests/pool/{id}/evidence — multipart `file`. jpeg/png/pdf, max 5 MB.
- GET /requests/pool/{id}/evidence — token-authenticated serve.
- GET /audit/evidence-queue — audit role.
- POST /audit/evidence/{id}/approve — pending_check -> verified.
- POST /audit/evidence/{id}/reject — body `{\"reason\": \"...\"}`. -> rejected.

object_id_display:
`GET /requests/mine` and `POST /requests/pool` return `hashed_object_id` (64-char hash, used by partners) AND `object_id_display` (raw value requester typed, for requester and audit display only).
