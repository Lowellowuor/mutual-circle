# Deployment

Frontend on GitHub Pages. Backend on any ASGI host. Database on Neon Postgres.

## Local development

### Prerequisites
- Python 3.11+ (https://www.python.org/downloads/)
- Node.js 20+ (https://nodejs.org/)
- Neon Postgres account (https://neon.tech/)

### Backend
    cd backend
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    .\.venv\Scripts\pip install -e .
    Copy-Item .env.example .env
    .\.venv\Scripts\alembic upgrade head
    .\.venv\Scripts\python -m uvicorn mtc.main:app --host 127.0.0.1 --port 8000 --app-dir src

Wait for "Application startup complete." Leave running.

### Frontend (second terminal)
    cd frontend
    npm install --legacy-peer-deps
    npm run dev

Open http://localhost:3000/mutual-circle/ — the /mutual-circle/ suffix is intentional (see frontend/vite.config.ts base).

### Integration test (third terminal)
Stop demo backend first — the test kills all venv python during setup.

    & .\scripts\integration-test.ps1

Expected: Total: 47 / 47 passed.

## Environment variables (backend)

| Variable | Format | Generate with |
|---|---|---|
| DATABASE_URL_MAIN | postgresql://user:pass@host/db?sslmode=require | Neon dashboard |
| LEDGER_HMAC_KEY | 64 hex chars | python -c "import secrets; print(secrets.token_hex(32))" |
| TOKEN_HMAC_KEY_CURRENT | 64 hex chars | same |
| TOKEN_HMAC_KEY_PREVIOUS | 64 hex chars | same |
| MESSAGING_ENCRYPTION_KEY | 64 hex chars | same |
| JWT_SECRET | 64 hex chars | same |
| PARTNER_HMAC_KEY | 64 hex chars | same |
| STAFF_*_PIN_HASH (3 vars) | bcrypt $2b$12$... | python -c "import bcrypt; print(bcrypt.hashpw(b'PIN', bcrypt.gensalt()).decode())" |
| PAYSTACK_SECRET_KEY | sk_test_... (local) / sk_live_... (production) | Paystack dashboard -> Settings -> API Keys & Webhooks. Only in backend/.env. Required (32+ chars) in production. |
| PAYSTACK_CURRENCY | ISO code, default KES | Must be a currency your Paystack account can charge |
| PAYSTACK_CALLBACK_URL | URL, default http://localhost:3000/mutual-circle/donor/payment-return | The frontend return page; production: https://<owner>.github.io/mutual-circle/donor/payment-return |

## Database (Neon)

- DATABASE_URL_MAIN must include ?sslmode=require for Neon.
- Migration chain (linear):
      000_baseline         -> 21 app tables + 13 indexes (post-005 shape)
      001_ledger           -> ledger_entries (append-only hash chain)
      002_collected_status -> ensures 'collected' in requests.status CHECK
      003_idempotency_keys -> idempotency_keys
      004_pledge_request_link -> requests.pledge_id FK
      005_notification_read_at -> notifications.read_at
- All 001-005 are idempotent (IF NOT EXISTS / IF EXISTS / early-return).
  000_baseline is first, so 002/004/005 no-op on a fresh DB where 000
  already created the schema at post-005 shape.
- **Fresh DB:** `alembic upgrade head` — one command creates the entire
  schema (21 tables from 000_baseline, then ledger_entries from 001,
  then idempotency_keys from 003, plus all indexes). 002/004/005 are
  no-ops because 000 already created the schema at post-005 shape.

- **Existing DB already at 005** (e.g. the current Neon instance):
  **do nothing.** Alembic sees the DB at 005 = head of the chain. 000
  is an ancestor Alembic infers was applied — you cannot be at 005
  without having gone through it. `alembic upgrade head` returns
  "already at head, nothing to do".

- **Never stamp backwards on an existing DB.** Stamping to 000 (or
  any earlier revision) resets the version tracker, and the next
  `upgrade head` will attempt to re-run migrations against a schema
  that already exists. 001 has no IF NOT EXISTS on its CREATE TABLE,
  so this fails with "relation ledger_entries already exists". A prior
  version of this doc recommended stamping to an older revision —
  same problem, same failure mode.

- **The correct way to inspect state is `alembic current`.** It reads
  the DB's version table, not the migration files, so it always
  reflects reality. If `current` says `005_notification_read_at
  (head)` and `heads` says the same, you're done.

- Always `pg_dump` before touching a live DB.

## Verifying the migration on a fresh Postgres

To confirm a fresh install produces the same schema as the current
Neon instance:

    # 1. Create a scratch Postgres (Neon free tier, or local)
    #    Take the connection URL, including ?sslmode=require

    # 2. Point DATABASE_URL_MAIN at it in backend/.env, then:
    cd backend
    .\.venv\Scripts\alembic.exe upgrade head

    # Expected: 6 "Running upgrade" lines (000 -> 001 -> 002 -> 003 -> 004 -> 005)
    # with no errors.

    # 3. Count tables in the scratch DB:
    psql $env:DATABASE_URL_MAIN -c "\dt"
    # Expected: 25 tables
    #   21 from 000_baseline
    #   + ledger_entries (from 001)
    #   + idempotency_keys (from 003)
    #   + alembic_version (Alembic's own)

    # 4. Spot-check the requests table:
    psql $env:DATABASE_URL_MAIN -c "\d requests"
    # Expected: 12 columns including id, token_hash, type, category,
    # amount_pence, hashed_object_id, metadata, tier, status,
    # created_at, updated_at, pledge_id

    # 5. Compare to production:
    #    Regenerate _c1_dump/live_schema.txt against Neon and diff
    #    the two \dt outputs. They should match exactly (aside from
    #    alembic_version contents).

If a migration fails on the fresh DB, the error names the specific
ALTER or CREATE that drifted. Fix 000_baseline to match, re-run
`alembic downgrade base && alembic upgrade head` on the scratch DB.

## Frontend deployment (GitHub Pages)

.github/workflows/deploy.yml runs on every push to main:
checkout -> Node 20 -> npm install --legacy-peer-deps in frontend/ -> npm run build -> copy frontend/dist/index.html to 404.html (SPA fallback) -> deploy-pages.

Live site: https://<owner>.github.io/mutual-circle/

### VITE_API_URL in CI

frontend/src/lib/apiClient.ts:
    const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000';

VITE_API_URL is baked in at build time. The deploy workflow passes the `VITE_API_URL` repository secret to the build. If the secret is unset, the build warns and the frontend falls back to 127.0.0.1:8000, which won't work for remote users.

To configure deployment:
1. Add `VITE_API_URL` as a repository secret (Settings -> Secrets and variables -> Actions).
2. Ensure backend CORS `allow_origins` includes the GitHub Pages origin.

## Backend deployment

Backend is stateless — all state in Neon. Any ASGI host works.

- Railway: pip install -e . as build, uvicorn mtc.main:app --host 0.0.0.0 --port $PORT --app-dir src as start.
- Render: same shape, uses $PORT env var.
- Fly.io: requires Dockerfile (none in repo).
- Traditional VM (Lightsail / DO): full control, more ops work.

Production start command (no --reload):
    uvicorn mtc.main:app --host 0.0.0.0 --port 8000 --app-dir src

## Post-deploy smoke test

1. Invoke-RestMethod "https://your-backend/health" — expect ok=True, db=connected.
2. GET /stats/impact and /partners/public — expect JSON with data.
3. Open https://<owner>.github.io/mutual-circle/ — impact numbers should appear (proves CORS works).
4. Full swap round-trip: phone -> OTP -> swap -> PIN -> collect.

## Operational gotchas

### Windows: zombie socket on port 8000
Stop uvicorn with Ctrl+C. Never Stop-Process — it leaves the port in LISTEN state for hours. If already stuck: reboot (only reliable fix). Integration test runs on port 8010 to avoid this.

### Pycache staleness
If source changes don't take effect:
    Get-ChildItem "backend\src" -Recurse -Filter "__pycache__" -Directory | Remove-Item -Recurse -Force
Then restart uvicorn.

### Integration test kills port 8000
The test pre-kills all venv python. Order: stop demo backend -> run test -> start demo backend.

### CORS 127.0.0.1 vs localhost
Different origins to a browser. Backend CORS allow_origins must contain both if you use both.

## What is not in this repo
No Dockerfile. No Terraform. No backend CI. No secrets manager. No APM / error tracking. No log aggregation.

## Paystack webhook locally (cloudflared)

Donations and pledges are paid through Paystack's hosted checkout. Two
things confirm a payment, and both ask Paystack's verify API before
marking anything paid:

1. **Return page** — after checkout Paystack redirects the browser to
   `PAYSTACK_CALLBACK_URL` (`/mutual-circle/donor/payment-return`), which
   calls `GET /payments/verify/{reference}`. This works on localhost with
   no tunnel, because it is the donor's own browser making the call.
2. **Webhook** — Paystack POSTs `charge.success` to
   `POST /paystack/webhook`. This catches payments where the donor closed
   the tab before being redirected. Paystack's servers must reach it, so
   locally you need a tunnel.

```bash
# Terminal 1: backend on :8000 (see "Backend" above)

# Terminal 2: cloudflared quick tunnel to the backend
cloudflared tunnel --url http://localhost:8000
# copy the https://<random>.trycloudflare.com URL it prints
```

Then in the Paystack dashboard, **Test mode** -> Settings -> API Keys &
Webhooks -> **Test Webhook URL**:

```text
https://<random>.trycloudflare.com/paystack/webhook
```

Notes:

- No `.env` change or uvicorn restart is needed: the webhook URL lives in
  the Paystack dashboard, and signatures are checked with
  `PAYSTACK_SECRET_KEY` (HMAC-SHA512 of the raw body, header
  `x-paystack-signature`). Requests with a bad or missing signature get 401.
- Quick tunnels get a new URL every time cloudflared restarts. Paste the
  new one into the dashboard each time.
- To check it works: make a test donation, pay with a Paystack test card,
  and look for `Paystack webhook: reference=... outcome=paid` in the
  uvicorn log. A second delivery of the same event logs `duplicate` and
  changes nothing.
- The tunnel exposes your local backend to the internet while it runs.
  Stop it when you are done.
- Never point the **Live** webhook URL at a laptop tunnel.

## SPA fallback for /donor and /admin

One build serves all apps. /donor and /admin return the same index.html as /; the client router picks which app to lazy-load.

- GitHub Pages: copy dist/index.html to dist/404.html after build
- Vercel/Netlify: rewrite all paths to /index.html
- nginx: try_files $uri $uri/ /index.html;

## Evidence uploads

Tier 2 photo files write to backend/uploads/evidence/ (gitignored). In production, mount to persistent storage or set EVIDENCE_STORAGE_DIR outside the app bundle.
