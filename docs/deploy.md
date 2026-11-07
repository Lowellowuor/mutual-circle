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
    npm install --legacy-peer-deps
    npm run dev

Open http://localhost:3000/mutual-circle/ — the /mutual-circle/ suffix is intentional (see vite.config.ts base).

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
| STAFF_*_PIN_HASH (3 vars) | bcrypt $2b$12$... | python -c "import bcrypt; print(bcrypt.hashpw(b'PIN', bcrypt.gensalt()).decode())" |

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
checkout -> Node 20 -> npm install --legacy-peer-deps -> npm run build -> copy dist/index.html to 404.html (SPA fallback) -> deploy-pages.

Live site: https://<owner>.github.io/mutual-circle/

### CRITICAL: VITE_API_URL is not set in CI

src/lib/apiClient.ts line 4:
    const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000';

VITE_API_URL is baked in at build time. The current workflow does not set it — meaning the deployed GitHub Pages frontend points at 127.0.0.1:8000, which fails from any browser not running the backend on the same machine.

Fix:
1. Add to .github/workflows/deploy.yml build step:
       - name: Build
         run: npm run build
         env:
           VITE_API_URL: ${{ secrets.VITE_API_URL }}
2. Add VITE_API_URL as a repo secret (Settings -> Secrets and variables -> Actions).
3. Backend CORS allow_origins must include the GitHub Pages origin.

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
