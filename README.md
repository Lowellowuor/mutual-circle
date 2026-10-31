# Mutual Circle

Anonymous, blind-pooled resource sharing for Kenya. Requesters submit a need; donors pool gifts with no recipient linkage; fulfilment staff dispatch via partner settlement or voucher; requesters confirm physical collection with a PIN.

## Stack

- Backend: FastAPI + asyncpg + Postgres (Neon)
- Frontend: React 18 + Vite + TypeScript + Tailwind
- Ledger: HMAC-chained, publicly verifiable at GET /ledger/public
- Channels: Web, SMS, USSD, WhatsApp — all functional simulators, one backend

## Quick start

### Backend

    cd backend
    python -m venv .venv
    .venv\Scripts\activate
    pip install -e ".[dev]"
    Copy-Item .env.example .env
    python -m uvicorn mtc.main:app --host 127.0.0.1 --port 8000 --app-dir src --reload

### Frontend

    npm install
    npm run dev
    # open http://localhost:5173

### Tests

    & .\scripts\integration-test.ps1
    # expect: Total 37/37 passed

## Docs

- docs/auth.md — four auth schemes
- docs/tiers.md — tier 1-4 assignment
- docs/payout.md — voucher vs direct settlement
- docs/gaps.md — current state of known gaps