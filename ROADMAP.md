# Roadmap

## Shipped

### Core

- Requester auth (HMAC token from phone, never stores raw phone)
- Donor auth (persistent donor hash, survives logout/refresh)
- Staff auth (JWT with role claims)
- Partner auth (scoped API keys)
- Swap request flow with PIN and QR
- Pool request flow with tier 1-4 assignment
- Dispatch to partner with HMAC ledger entry
- Voucher issuance with partner redemption
- OCR queue for Tier 3 verification
- Public ledger with chain verification and CSV export

### Landing page (2026-11)

- 7-section marketing page: Header, Hero, Three doors, How it works, Private, The pool, Partners, FAQ, Footer
- Token system: canvas #FAF8F4, surface #FFFFFF, ink #111111, muted #4A4F4B, accent #1F6B4A, sage #DCE8E0, dark band #0F1E17
- Type scale: Cormorant Garamond 500 at 32px+, Inter for everything else, 14px minimum
- All copy in `frontend/src/i18n/en.ts`, no hardcoded strings in JSX
- How it works tabs: `role=tablist` + `tab` + `tabpanel`, Arrow/Home/End keyboard nav, roving tabindex
- Partner form: idle -> loading -> success -> error with `aria-busy` / `role=alert` / `aria-live` on state containers
- Button states: default, hover, focus-visible (2px green outline), pressed (scale 0.98), disabled (opacity 0.5)
- `prefers-reduced-motion` respected on every animation
- Landing-only CSS removed from `index.css`; BenchTab moved to its own stylesheet so the app keeps its orb drift
- Dead components removed: Reveal, AmbientBackdrop, Eyebrow, SectionArrow, WaveDivider, DotGrid, OrbGlow
- 8 landing photos removed from repo (~1.8MB)


### Phase 1 Hardening & Scale (2026-11-14)

- **PII Encryption:** All phone numbers encrypted at rest (Fernet) and hashed for lookup (HMAC-SHA256). Payments #9 closed.
- **Africa's Talking SMS:** Replaced the broken SMS stub with a real `httpx` async client, config guards, and 9 tests.
- **Intake Questionnaires:** Post-approval flow capturing family size, work status, industry, and primary need. Includes k-anonymity aggregate stats for funders.
- **KPLC Direct Payments:** Admin console flow to record bank transfers and automatically SMS KPLC tokens to requesters.
- **Chui Locker Webhooks:** Webhook integration with `X-Webhook-Secret` verification to mark bundles as collected.
- **UI Editorial Redesign:** Replaced legacy dashboard UI in Donor and Admin (Console) apps with the premium editorial design system (ScreenHeader, card-editorial, stat-display).
- **Migrations 011 - 022:** Standardized the schema (pledge status, donation defaults, phone encryption, standalone surveys, requesters table, institutional payments).
- **CI Pipeline:** 133 tests running against a fresh PostgreSQL container, enforcing schema contracts.

### Paystack donor payments (2026-11-18)

- Replaced M-PESA Daraja STK Push with Paystack hosted checkout for donations and pledges (`POST /donations/{id}/pay`, `POST /pledges/{id}/pay` return an `authorization_url`)
- Pending payment saved with a unique reference before Paystack is called; one live checkout per donation/pledge (partial unique index), stale ones re-verified after 30 minutes
- `POST /paystack/webhook`: HMAC-SHA512 signature check (401 on failure), `charge.success` confirmed with Paystack's verify API (reference, amount, currency), idempotent, 500 on errors so Paystack retries, no PII in logs
- `GET /payments/verify/{reference}` + frontend return page `/donor/payment-return`
- Migration 023 `paystack_payments`; `mpesa_transactions` kept for history, no longer written
- Removed: `mtc/mpesa/`, `/mpesa/stk/callback`, requester self-pay `/requests/{id}/pay`, `MPESA_*` config, MpesaModal
- KPLC institutional payment flow unchanged

### Collection confirmation


- POST /requests/{id}/collect — canonical, PIN in body
- POST /requests/collect — PIN-only, for channels without request_id
- bcrypt pin_hash in metadata (migration-safe rollout)
- Collect endpoints prefer pin_hash, fall back to plaintext pin
- App card "I've collected" action
- SMS COLLECTED <pin> command
- USSD menu option 4 -> PIN entry
- WhatsApp "I've collected" button
- collected notification template

### Donor surface

- Give to blind pool (anonymous / named)
- Public leaderboard with display name and opt-in
- Privacy card, impact delta card, public ledger verify modal
- Donations CSV export
- Pledge form (goods / service credit)
- Campaigns list with progress bars

### Household + channel features

- Household-size capture on all 4 channels
- Bundle variant by household size
- Real backend token in all 4 channels
- REF receipt on every channel after swap/collect

### Infrastructure

- Alembic bootstrap (greenlet, psycopg, WindowsSelectorEventLoopPolicy)
- 001_ledger and 002_collected_status migrations
- Integration test: 38 assertions, all passing
- Unique phone per run + aggressive pre-kill + A25 pin_hash invariant
- Backend-down banner + honest console logging
- .env.example with format hints
- package.json renamed mutual-circle-prototype -> mutual-circle
- MOCK_* env vars removed from .env.example and config.py (were dead)
- README + ROADMAP
## Phase B — backend correctness (not started)

- Idempotency keys on POST /donations, POST /requests/swap, POST /requests/pool. A double-tap or network retry creates duplicate records today. Fix: Idempotency-Key header + unique index on the server.
- Pledge-to-request linkage. Fulfilment matches pledges but nothing connects a matched pledge to the request that delivered it. Donor has no "your pledge was delivered" moment.
- pledge_settled notification fired on collection when a matched pledge funded the request.

## Phase C — polish (not started)

- Full Alembic coverage (18+ tables currently created via raw SQL)
- any -> real types across AppContext, DonorView, RequesterView (59 occurrences)
- Versioned history schema in localStorage
- Notification i18n (Swahili variants of the 8 templates)
- Currency formatting consistency
- Empty-state standardization
- "The Bench" naming clarification
- Three SMS simulator consolidation decision
- Kenya DPA 2019 compliance story
- catch {} -> catch (e) { console.error(...) } (~10 occurrences)
- Integration test should not kill demo backend (pre-kill to port 8010 only)

## Paystack go-live (not started — local/test mode only today)

- Live secret key in the production secret store; `PAYSTACK_CALLBACK_URL` pointing at the GitHub Pages return page
- Live webhook URL set to the deployed backend's `/paystack/webhook` (never a tunnel)
- Refund runbook for `PAYSTACK_DOUBLE_PAYMENT` log lines
- Optional donor email field in Give/Pledge (the API already accepts `email`) so Paystack receipts reach a real inbox
- Reconciliation job for `paystack_payments` rows left `pending` (today they are re-checked only when the donor pays again or opens the return page)

## Known operational gotcha

Windows leaves zombie sockets bound for hours after Stop-Process kills a listener. Symptom: [Errno 10048] address already in use even though Get-Process python shows nothing.

Fix: Ctrl+C to stop uvicorn, never Stop-Process. If a socket is stuck, reboot is the only reliable resolution.

The integration test runs on port 8010 to isolate itself from any zombie on 8000.

## Phase B1 — idempotency keys (shipped)

- [x] `idempotency_keys` table + `003_idempotency_keys` migration
- [x] `POST /donations`, `POST /requests/swap`, `POST /requests/pool` honor `Idempotency-Key` header
- [x] Cache 2xx response for 24h; return cached on retry with same key
- [x] `check_or_claim` / `complete` / `release` helpers in `backend/src/mtc/idempotency.py`
- [x] Frontend `apiClient.ts` generates fresh UUID per POST (`crypto.randomUUID` with fallback)
- [x] Integration tests A26–A28 (cache hit, single row, distinct key creates row)

## Phase B2 — pledge -> request linkage (shipped)

- [x] `requests.pledge_id` FK column (nullable, ON DELETE SET NULL)
- [x] `004_pledge_request_link` migration (+ widened `pledges.status` check to allow `settled`)
- [x] `POST /fulfilment/pledges/{id}/match` accepts `{request_id}` and creates the link atomically
- [x] Both collect routes (`/requests/{id}/collect`, `/requests/collect`) settle linked pledge on collection
- [x] Pledge status flow: `awaiting_match` -> `matched` -> `settled`
- [x] Frontend already renders `settled` status in pledge subtitle (no change needed)
- [x] Integration tests A29–A33 (create, match, verify, collect, verify settled)

**Not done in B2 (deferred to Phase C):**
- REF display next to "Settled" in pledge subtitle (nice-to-have, needs `/pledges/mine` to LEFT JOIN requests)
- Donor notification feed for `pledge_settled` (donor has no notification inbox today)
- Partial funding tracking (one pledge funding N requests not modeled — MVP is 1:1)
