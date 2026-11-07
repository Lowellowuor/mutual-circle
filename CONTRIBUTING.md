# Contributing

This is a prototype in active development. Contributions are welcome
under the terms in `LICENSE`.

## Reporting bugs

Open a GitHub issue with:
- What you did
- What you expected
- What actually happened
- Your environment (OS, browser, Python/Node version if relevant)

For security vulnerabilities, do **not** open a public issue. See
`SECURITY.md` for the reporting channel.

## Setting up a dev environment

See `README.md` > "Quick start". Summary:

**Backend:**
- `cd backend`
- `python -m venv .venv`
- Activate: `.venv\Scripts\Activate.ps1` (Windows) or `source .venv/bin/activate` (Unix)
- `pip install -e .`
- `pip install pytest pytest-asyncio`
- `cp .env.example .env` then fill in real values

**Frontend** (from repo root):
- `npm install --legacy-peer-deps`

You need a Postgres instance (Neon or local) for the full backend.
`DATABASE_URL_MAIN` in `.env` points at it.

## Before submitting a change

The CI gate runs on every push. Locally, run the same three checks
first:

From repo root:
- `npm run lint` (TypeScript — must be 0 errors)
- `npm run build` (Vite production build)

From `backend/`:
- `pytest tests/test_secret_validation.py -v`

Tests that need a live DB (auth, dispatch, ledger, flags, requests)
need `DATABASE_URL_MAIN` set. Run them locally with `pytest tests/ -v`.

## Code style

**Frontend:** TypeScript, functional React, Tailwind for styling.
No CSS-in-JS. Match existing component structure in `src/components/`.

**Backend:** Python 3.11+, FastAPI, asyncpg. Ruff and mypy are
configured in `backend/pyproject.toml` but not yet enforced in CI.
Run locally if you're changing backend logic: `ruff check src/` and
`mypy src/`.

## Commit messages

Follow the pattern in this repo's history:

    <type>(<scope>): <subject>

Types used here: `feat`, `fix`, `style`, `chore`, `docs`, `ci`,
`test`, `refactor`. Scopes are the file or feature being changed
(`console`, `donor`, `requester`, `api`, `readme`, `env`, `types`,
`observability`).

Every commit message explains **what changed and why**, not just what.

## What gets rejected

- Changes to the blind-pool invariant (any field connecting a donor
  to a disbursement). See `docs/roles.md`.
- Additions that store names, addresses, or clinical data.
- Dark patterns on the requester side (fake urgency, guilt copy,
  infinite scroll, streaks).
- Any commit that makes `npm run lint` or `npm run build` fail.

## Product rules — read before contributing

Five rules that shape every design decision:

1. **Verify the object, not the person.** The object number is what
   gets checked. No PII is stored.
2. **No component holds both identity and disbursement history.**
   Enforced at the schema level.
3. **Anonymity is from the aid chain, not the state.** The telecom
   and regulator can trace an account. Staff, donors, partners,
   neighbours cannot.
4. **Nothing distinguishes a person in need from an ordinary user.**
   Branding is "resource-sharing network," not charity.
5. **Never store names, addresses, clinical data, or any link
   between a donor contribution and a recipient disbursement.**

See `docs/roles.md` for the full explanation.
