# Mutual Circle

Anonymous, blind-pooled resource sharing for Kenya. Requesters submit a need — a food bundle or a bill to pay — and receive an outcome without ever being linked to a specific donor. Donors give to a pool, never to a person. Fulfilment staff settle requests with partner institutions. Every state change is on a public HMAC-chained ledger.

## What it does

- **Requesters** apply by phone (SMS, USSD, WhatsApp, or web), declare household size, and either reserve a food bundle or submit a bill for payment. Every request returns a reference and a collection PIN.
- **Staff** see a fulfilment queue, dispatch verified requests to partner institutions (KPLC, schools, hospitals), or issue vouchers where the requester collects from a retail partner. Audit staff run OCR verification on Tier 3 requests.
- **Donors** give to the blind pool. They can opt in to a public recognition ledger, edit their display name, or stay fully anonymous. They can also pledge goods or services which fulfilment staff match to requests.
- **Partners** see only the redemptions and settlements that concern them, via a scoped API key.

No donor is linked to a specific recipient anywhere in the schema. The blind-pool invariant is enforced at the data model, not just the UI.

## Stack

- **Backend:** FastAPI + asyncpg + Postgres (Neon), Alembic for migrations
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Ledger:** HMAC-chained, publicly verifiable at GET /ledger/public with CSV export
- **Testing:** 38-assertion PowerShell integration test, all passing
- **Deployment:** GitHub Pages for the frontend, backend on any ASGI host

## Quick start

### Backend

    cd backend
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    .\.venv\Scripts\pip install -e .
    Copy-Item .env.example .env         # fill DATABASE_URL_MAIN and HMAC keys
    .\.venv\Scripts\alembic upgrade head
    .\.venv\Scripts\python -m uvicorn mtc.main:app --host 127.0.0.1 --port 8000 --app-dir src

Wait for Application startup complete. Leave this terminal open.

### Frontend

In a second terminal:

    cd mutual-circle
    npm install
    npm run dev

Open http://localhost:3000/mutual-circle/ (or whichever URL Vite prints — it may be 3001).

### Integration test

In a third terminal. Stop the demo backend first — the test kills all venv python during setup:

    & .\scripts\integration-test.ps1

Expect Total: 38 / 38 passed.
## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /tokens | none | Issue HMAC token from phone |
| POST | /requests/swap | X-Token | Create food-bundle request |
| POST | /requests/pool | X-Token | Create bill-payment request (tier 1-4) |
| POST | /requests/{id}/collect | X-Token | Confirm collection with PIN |
| POST | /requests/collect | X-Token | PIN-only collection (SMS/USSD/WA) |
| GET | /requests/mine | X-Token | Requester's requests |
| GET | /notifications/mine | X-Token | Requester notification feed |
| POST | /donations | X-Donor-Hash | Donor gives to pool |
| GET | /donations/mine | X-Donor-Hash | Donor's giving history |
| POST | /donations/profile | X-Donor-Hash | Join or leave leaderboard |
| GET | /donations/leaderboard | none | Public recognition ledger |
| POST | /pledges | X-Donor-Hash | Pledge goods or services |
| POST | /staff/login | none | Issue staff JWT |
| GET | /fulfilment/queue | Bearer | Fulfilment queue (tier-appropriate) |
| POST | /fulfilment/requests/{id}/dispatch | Bearer | Settle to institution (direct) |
| POST | /fulfilment/requests/{id}/voucher | Bearer | Issue retail voucher |
| GET | /audit/ocr-queue | Bearer | Pending OCR verification |
| POST | /audit/ocr/{id}/complete | Bearer | Mark OCR verified |
| GET | /ledger/public | none | Chain verification + recent entries |
| GET | /ledger/public.csv | none | CSV export of full ledger |
| GET | /partners/me | X-Partner-Key | Partner profile |
| GET | /partners/me/redemptions | X-Partner-Key | Partner's scope |

## Documentation

- docs/auth.md — four auth schemes and their roles
- docs/tiers.md — tier 1-4 assignment logic
- docs/payout.md — when to dispatch vs. issue a voucher
- ROADMAP.md — what's shipped and what's pending

## Status

Working end-to-end:

- 38-assertion integration test, all passing
- 4 channels functional (SMS, USSD, WhatsApp, web)
- Collection confirmation across all 4 channels with bcrypt PIN verification
- HMAC ledger verification with public proof page and CSV export
- Household-size capture and bundle sizing
- Donor portal with privacy state, impact deltas, and donations CSV
- Alembic migrations reproducible (001_ledger -> 002_collected_status)

Not yet built (see ROADMAP.md):

- Idempotency keys on POST endpoints (double-tap risk)
- Pledge-to-request linkage (donor cannot see whether their pledge was delivered)
- Notification i18n (English only today)
- Full Alembic coverage (18+ tables still created by raw SQL)

## Operational note

The integration test runs on port 8010 to isolate from any zombie socket on 8000. Stop the demo backend with Ctrl+C, not Stop-Process — killing uvicorn with Stop-Process leaves the Windows socket in LISTEN state for hours.

## License

Internal prototype — not for public distribution.
