# Production Deployment

This document describes what a human admin must do after a fresh
production deploy. Everything here is manual — there is no seed script.

## What migrations handle (automatic)

`alembic upgrade head` creates the full schema: all tables, columns,
indexes, and constraints. After migrations, the application starts and
serves requests.

## What a human must configure (one-time, after first deploy)

### 1. Staff credentials (environment variables, not DB)

Staff login reads from environment variables, not the database:

- `STAFF_ENROL_ID` / `STAFF_ENROL_PIN_HASH` — enrolment staff
- `STAFF_FULF_ID` / `STAFF_FULF_PIN_HASH` — fulfilment staff
- `STAFF_AUDIT_ID` / `STAFF_AUDIT_PIN_HASH` — audit staff

The `*_PIN_HASH` values are bcrypt hashes. Generate one with:

    python -c "import bcrypt; print(bcrypt.hashpw(b'YOUR_PIN', bcrypt.gensalt()).decode())"

The backend startup check fails hard in production/staging if any of
these are missing. In development it logs a warning and continues.

### 2. First partner (SQL, one-time)

Partners are real organisations. They are not seeded. Create the first
one with SQL after migrations:

    INSERT INTO partners (partner_key, name, active)
    VALUES ('real-partner-key-from-partner-org', 'Actual Partner Name', TRUE);

The `partner_key` is the secret the partner uses to authenticate.
Generate it as 32+ random characters and share it with the partner org
through a secure channel — never commit it to git.

### 3. Initial depot inventory (SQL or admin UI)

Depot stock is real inventory. Set initial values from the actual
supplier delivery:

    INSERT INTO depot_state (partner, item, total, reserved)
    VALUES
        ('Actual Partner Name', 'food_bundle', 0, 0),
        ('Actual Partner Name', 'hygiene_bundle', 0, 0);

    INSERT INTO locker_stock (partner, location, total, available)
    VALUES ('Actual Partner Name', 'Actual Locker Location', 0, 0);

Start at 0 and increment as real inventory arrives. The depot tab shows
"no inventory configured" until these rows exist — that is the correct
empty state, not a bug.

## Verify the deploy

- `GET /health` returns 200 with `{"ok": true}` — DB reachable, app live.
- `POST /staff/login` with any configured role returns a session token —
  proves staff auth works.
- Migrations at head: `alembic current` shows the latest revision.

## What we do NOT do

- No demo partners — a fake partner in production appears in partner
  lists and reconciliation reports, contaminating financial records.
- No seeded inventory — fake stock numbers produce phantom orders.
- No seeded donor profiles — fake donor recognition data contaminates
  the leaderboard.
- No seed_baseline.py — migrations handle schema. Humans handle
  business data.

## Testing fresh deploy

`pytest tests/test_fresh_deploy.py` asserts:

- Every live table is created by a migration (no orphans).
- Every expected table exists after migrations.
- Staff credentials are asserted in production/staging, skipped in dev.
- `verify_pin.py` uses bcrypt.

This runs in CI on every PR.
