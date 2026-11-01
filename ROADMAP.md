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

## Known operational gotcha

Windows leaves zombie sockets bound for hours after Stop-Process kills a listener. Symptom: [Errno 10048] address already in use even though Get-Process python shows nothing.

Fix: Ctrl+C to stop uvicorn, never Stop-Process. If a socket is stuck, reboot is the only reliable resolution.

The integration test runs on port 8010 to isolate itself from any zombie on 8000.
