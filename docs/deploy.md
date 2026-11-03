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
- Migration chain: 001_ledger -> 002_collected_status -> 003_idempotency_keys -> 004_pledge_request_link.
- Fresh DB: alembic upgrade head.
- Existing DB (created by raw SQL before Alembic bootstrap):
      alembic stamp 001_ledger
      alembic upgrade head
- Always pg_dump before touching a live DB.

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
