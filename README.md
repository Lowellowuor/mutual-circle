# Mutual Circle

[![CI](https://github.com/Lowellowuor/mutual-circle/actions/workflows/ci.yml/badge.svg)](https://github.com/Lowellowuor/mutual-circle/actions/workflows/ci.yml)

**Resource-sharing network for Kenya.** Requesters submit a need  a food bundle or a bill to pay  and receive an outcome without ever being linked to a specific donor. Donors give to a blind pool, never to a person. Fulfilment staff settle requests with partner institutions. Every state change is on a public HMAC-chained ledger.

**Status:** Functional prototype. M-PESA Daraja (STK Push) and Africa's Talking (SMS) are wired end-to-end against sandbox APIs. Production-ready architecture; pilot-ready operations. Waiting on: B2C SecurityCredential, partner API access, and the security items in `SECURITY.md` before public deployment.

## Recent updates (2026-11)

**Integrations wired end-to-end (not simulated any more):**

- **M-PESA Daraja** — OAuth, STK Push, callback handler with 4-layer verification (transaction ID match, amount match, phone match, receipt format). Verify-by-query fallback. Callback URL must be internet-reachable (cloudflared tunnel for dev).
- **Africa's Talking** — SMS delivery for requester notifications (PIN, reference, status updates) via `notify()` calls, gated by `MOCK_SMS`.

**Audience apps split (one bundle per route):**

| Route | App | Audience |
|---|---|---|
| `/` | Requester (Mutual Circle) | End users |
| `/donor` | Donor Portal | Donors |
| `/admin` | Operations Console | Staff |
| `/sms`, `/ussd`, `/whatsapp` | Channel simulators | Demo / testing |
| `/bench` | The Bench | Peer support |
| `/architecture` | Spec and topology | Reviewers |
| `/pitch` | Full pitch harness | Dev / demo only |

Each app wraps itself in its own `AppProvider` + `ToastProvider` so lazy-loaded chunks do not share React context state.

**Tier 2 photo evidence flow (R.U.T.H 4.3 fallback):**

Tier 2 pool requests (< KES 5,000) now start in `pending_evidence` status. The requester uploads a photo of the bill in a new step in PoolFlow, then audit staff reviews and approves or rejects it in Console → Queue → Evidence. Approve: `verified`. Reject: `rejected` with reason sent to requester.

**object_id_display on request responses:**

`GET /requests/mine` and `POST /requests/pool` return both `hashed_object_id` (the HMAC hash used by partners and ledger) and `object_id_display` (the raw meter/invoice number the requester typed). Notifications and audit log render the raw value so requesters and audit staff can verify against physical bills.

## R.U.T.H compliance (section 4)

| Section | Requirement | Status |
|---|---|---|
| 4.1 | Intake and HMAC tokenisation | Weekly-rotating keyed HMAC; no raw phone stored |
| 4.2 | Swap via smart lockers | Reservation plus single-use PIN (locker API = spec 8 item 1) |
| 4.3 | Pool object-level verification | Format validation, Tier 2 photo evidence, Tier 3 OCR. External lookup = spec 8 item 2 |
| 4.4 | The Match, no direct donor to recipient | Goods pledges blocked from direct match; service credits settle via Pool |
| 4.5 | Partner vouchers | Single-use PIN, monthly reconciliation CSV |
| 4.6 | Blind pool and campaigns | Schema has no donation-to-disbursement link (verified) |
| 4.7 | Ledger, keyed hash of object IDs | HMAC-SHA256 of meter/invoice number; raw value in `metadata.raw_object_id` (requester and audit only) |
| 4.8 | Fraud tiers T1-T4 and separation of duties | Separate staff credentials, role gates, 4-layer M-PESA callback verification |
| 4.9 | Bench, isolated system | Separate `DATABASE_URL_BENCH` plumbed |

Spec section 8 open items are tracked in SECURITY.md and ROADMAP.md.

## CI

GitHub Actions runs `.github/workflows/ci.yml` on every push and pull request: pytest for backend, TypeScript check and build for frontend. Badge in the header.


## Landing page

The public page at `/` is the front door. Seven sections, solid surfaces, one serif headline per section, one primary action per section. No photography, no glass, no gradients.

| Section | Purpose |
|---|---|
| Header | Abstract circle mark, four nav links, one primary button (Open the app) |
| Hero | Headline, subtitle, phone mockup, trust row |
| Three doors | Reserve or pay / Give / Partner |
| How it works | Request / Verify / Collect tabs with keyboard nav and screen-reader labels |
| Private | Three icon rows + quiet M-Pesa note |
| The pool | Solid dark band, three icon points, request + gift cards, Give button |
| Partners | Icon rows, Talk to us opens a responsive modal with loading / success / error states |
| FAQ | Single accordion, all collapsed, multi-open |
| Footer | Tagline, three-column links, contact details |
| Mobile dock | Single Open the app button, safe-area padded |

All strings live in `frontend/src/i18n/en.ts`, read via `useLanguage()`. No hardcoded copy in JSX. 14px is the minimum font size. `prefers-reduced-motion` respected on every animation.

## What works today

- **Requesters** apply by phone (web), declare household size, and either reserve a food bundle or submit a bill for payment. Every request returns a reference and a collection PIN.
- **Staff** see a fulfilment queue, dispatch verified requests to partner institutions (KPLC, schools, hospitals), issue vouchers where the requester collects from a retail partner, and process the OCR queue for Tier 3 requests.
- **Donors** give to the blind pool, opt in to a public recognition ledger, pledge goods or services that fulfilment staff match to specific requests.
- **Partners** see only the redemptions and settlements that concern them, via a scoped API key.
- The **blind-pool invariant holds**: no field in the schema connects a specific donor to a specific disbursement. Enforced at the data model, not just the UI.

## Stack

- **Backend:** FastAPI + asyncpg + Postgres (Neon). Alembic for migrations.
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS.
- **Ledger:** HMAC-chained, publicly verifiable at `GET /ledger/public` with CSV export.
- **Testing:** 23-test pytest suite plus a PowerShell integration test, all passing.
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

    cd frontend
    npm install
    npm run dev

Open http://localhost:3000/mutual-circle/ (or whichever URL Vite prints).

## Documentation

- **`docs/api.md`**  API reference with auth flows and sample requests
- `docs/auth.md`  four auth schemes and their roles
- `docs/roles.md`  six-actor permission matrix, blind-pool invariant
- `docs/payout.md`  when to dispatch vs. issue a voucher
- `docs/tiers.md`  tier 1-4 assignment logic
- `docs/deploy.md`  deployment walkthrough
- `SECURITY.md`  known security gaps before public deployment
- `ROADMAP.md`  what's shipped, what's planned

## Current limitations

**Payments are wired (sandbox).** M-PESA Daraja STK Push, OAuth, and callback handling are implemented end-to-end. B2C payouts (disbursing to institutions) require Safaricom's public certificate for the SecurityCredential; that is pending. Sandbox STK prompts only fire for whitelisted test numbers. See `docs/deploy.md` for tunnel setup.

**Messaging is wired (sandbox).** Africa's Talking SMS delivery is implemented and called by `notify()` on every state change where a phone number is available. Sandbox only delivers to whitelisted test numbers; production requires a registered Sender ID.

**Locker hardware is simulated.** The locker service records the assignment but does not open a physical locker.

**Partner auth is pilot-grade.** `X-Partner-Key` is a static per-partner key. Real deployment needs per-partner JWTs with rotation. See `SECURITY.md`.

**Audit trail is partial.** Compliance-critical actions (dispatch, voucher issuance, OCR verification, flag resolution, partner confirm) write to `audit_log`. Some operator actions are local-only — see `SECURITY.md` for the full list.

**Bench tab is a stub.** The Requester Bench shows the top-level entry (helplines + "reach out directly") but is not the full peer-support experience.

**CI is active.** GitHub Actions runs `.github/workflows/ci.yml` on every push and pull request: pytest for backend, TypeScript check and build for frontend.

## Blind-pool invariant

No donor is linked to a specific recipient anywhere in the schema. This is enforced at the data model, not just the UI. If you find a query that appears to link donor to recipient, that is a bug — report it.

## Integration test

    & .\scripts\integration-test.ps1

Expect `Total: 47 / 47 passed`. The test runs on port 8010 to isolate from a zombie socket on 8000.

## Deployment note (Windows)

The integration test kills all venv python during setup. Stop the demo backend with `Ctrl+C`, not `Stop-Process` — killing uvicorn with `Stop-Process` leaves the Windows socket in LISTEN state for hours.

## License

See `LICENSE`. Prototype — not for public deployment without addressing `SECURITY.md`.
