# Verification tiers

Source of truth: `backend/src/mtc/requests_/tiers.py`

## Rules

`assign_tier(category, amount_pence)`:

| Condition | Tier |
|---|---|
| category == 'swap_bundle' | 1 |
| amount_pence >= 500_000 (KES 5,000) | 3 |
| otherwise | 2 |

`initial_status(tier)`:

| Tier | Initial status | Meaning |
|---|---|---|
| 1 | verified | Self-declared + rate limits + 5% audit |
| 2 | verified | Object-level check done upstream |
| 3 | pending_check | Awaits OCR in audit queue |
| 4 | (assigned later) | Anomaly detection, not set at creation |

## Constants

- `TIER_3_THRESHOLD_PENCE = 500_000` — KES 5,000 threshold

## Flow

**Swap (food bundle):** always tier 1 → verified → fulfilment dispatches immediately.

**Pool (utility / school / hospital):**
- Under KES 5,000 → tier 2 → verified → dispatch allowed
- At or over KES 5,000 → tier 3 → pending_check → must pass
  `POST /audit/ocr/{id}/complete` (sets status='verified') before dispatch

## Tier 4

Anomaly-detection tier. Set by audit staff via
`POST /audit/flags/{id}/route-tier4`. Not auto-assigned. No amount or
category maps to tier 4 in `assign_tier`.

## Where used

- `create_pool` in `mtc/requests_/pool.py`
- `create_swap` in `mtc/requests_/swap.py`

## Test coverage

- A2: Tier 3 request → status='pending_check'
- A7: Dispatch blocked (409) while tier 3 pending
- A10: OCR complete → status='verified'
- A12: Dispatch succeeds after verification