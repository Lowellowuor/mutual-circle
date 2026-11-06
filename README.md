# Mutual Circle

**Resource-sharing network for Kenya.** Requesters submit a need — a food bundle or a bill to pay — and receive an outcome without ever being linked to a specific donor. Donors give to a blind pool, never to a person. Fulfilment staff settle requests with partner institutions. Every state change is on a public HMAC-chained ledger.

**Status:** Functional prototype. Production-ready architecture; pilot-ready operations. Waiting on: real payment integration, SMS provider, partner authentication hardening, and the security items in `SECURITY.md` before public deployment.

## What works today

- **Requesters** apply by phone (web), declare household size, and either reserve a food bundle or submit a bill for payment. Every request returns a reference and a collection PIN.
- **Staff** see a fulfilment queue, dispatch verified requests to partner institutions (KPLC, schools, hospitals), issue vouchers where the requester collects from a retail partner, and process the OCR queue for Tier 3 requests.
- **Donors** give to the blind pool, opt in to a public recognition ledger, pledge goods or services that fulfilment staff match to specific requests.
- **Partners** see only the redemptions and settlements that concern them, via a scoped API key.
- The **blind-pool invariant holds**: no field in the schema connects a specific donor to a specific disbursement. Enforced at the data model, not just the UI.

## What is stubbed or mocked

See the [Current Limitations](#current-limitations) section below. In short: payments, SMS, USSD, WhatsApp, and locker hardware are simulated. The code paths, contracts, and audit trail for those systems exist; they are not connected to live providers.

## Stack

- **Backend:** FastAPI + asyncpg + Postgres (Neon). Alembic for migrations.
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS.
- **Ledger:** HMAC-chained, publicly verifiable at `GET /ledger/public` with CSV export.
- **Testing:** 38-assertion PowerShell integration test, all passing.
- **Deployment:** Frontend on GitHub Pages, backend on any ASGI host.

## Quick start

See `docs/deploy.md` for the full walkthrough. Short version:

### Backend

    cd backend
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    .\.venv\Scripts\pip install -e .
    Copy-Item .env.example .env         # fill DATABASE_URL_MAIN and HMAC keys
    .\.venv\Scripts\alembic upgrade head
    .\.venv\Scripts\python -m uvicorn mtc.main:app --host 127.0.0.1 --port 8000 --app-dir src

### Frontend

    npm install
    npm run dev

Open http://localhost:3000/mutual-circle/ (or whichever URL Vite prints).

## Documentation

- **`docs/api.md`** — API reference with auth flows and sample requests
- `docs/auth.md` — four auth schemes and their roles
- `docs/roles.md` — six-actor permission matrix, blind-pool invariant
- `docs/payout.md` — when to dispatch vs. issue a voucher
- `docs/tiers.md` — tier 1-4 assignment logic
- `docs/deploy.md` — deployment walkthrough
- `SECURITY.md` — known security gaps before public deployment
- `ROADMAP.md` — what's shipped, what's planned

## Current limitations

**Payments are simulated.** No M-PESA Daraja integration. Donations are database rows; dispatch and voucher paths write placeholder receipt strings (`MPESA-XXXXXXXX`). The tier system, dispatch/voucher decision, and HMAC ledger entry are all real; only the actual money movement is missing. See `ROADMAP.md` Phase B.

**Messaging is simulated.** No SMS, USSD, or WhatsApp gateway connected. Notification templates exist and persist to the `notifications` table; they do not go out as SMS. OTP and PIN are displayed in the browser for the pilot.

**Locker hardware is simulated.** The locker service records the assignment but does not open a physical locker.

**Partner auth is pilot-grade.** `X-Partner-Key` is a static per-partner key. Real deployment needs per-partner JWTs with rotation. See `SECURITY.md`.

**Audit trail is partial.** Compliance-critical actions (dispatch, voucher issuance, OCR verification, flag resolution, partner confirm) write to `audit_log`. Some operator actions are local-only — see `SECURITY.md` for the full list.

**Bench tab is a stub.** The Requester Bench shows the top-level entry (helplines + "reach out directly") but is not the full peer-support experience.

**No CI pipeline yet.** Tests run locally; no GitHub Actions, no automated deploy. See `ROADMAP.md` Phase C.

## Blind-pool invariant

No donor is linked to a specific recipient anywhere in the schema. This is enforced at the data model, not just the UI. If you find a query that appears to link donor to recipient, that is a bug — report it.

## Integration test

    & .\scripts\integration-test.ps1

Expect `Total: 38 / 38 passed`. The test runs on port 8010 to isolate from a zombie socket on 8000.

## Deployment note (Windows)

The integration test kills all venv python during setup. Stop the demo backend with `Ctrl+C`, not `Stop-Process` — killing uvicorn with `Stop-Process` leaves the Windows socket in LISTEN state for hours.

## License

See `LICENSE`. Prototype — not for public deployment without addressing `SECURITY.md`.
