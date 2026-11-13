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
| 2 | pending_evidence | Requires photo evidence; staff reviews before verified |
| 3 | pending_check | Awaits OCR in audit queue |
| 4 | (assigned later) | Anomaly detection, not set at creation |

## Constants

- `TIER_3_THRESHOLD_PENCE = 500_000` — KES 5,000 threshold

## Flow

**Swap (food bundle):** always tier 1 â†’ verified â†’ fulfilment dispatches immediately.

**Pool (utility / school / hospital):**
- Under KES 5,000 â†’ tier 2 â†’ verified â†’ dispatch allowed
- At or over KES 5,000 â†’ tier 3 â†’ pending_check â†’ must pass
  `POST /audit/ocr/{id}/complete` (sets status='verified') before dispatch

## Tier 4

Anomaly-detection tier. Set by audit staff via
`POST /audit/flags/{id}/route-tier4`. Not auto-assigned. No amount or
category maps to tier 4 in `assign_tier`.

## Where used

- `create_pool` in `mtc/requests_/pool.py`
- `create_swap` in `mtc/requests_/swap.py`

## Test coverage

- A2: Tier 3 request â†’ status='pending_check'
- A7: Dispatch blocked (409) while tier 3 pending
- A10: OCR complete â†’ status='verified'
- A12: Dispatch succeeds after verification
## Tier 2 photo flow (R.U.T.H 4.3 fallback)

1. Requester submits pool request -> status=pending_evidence
2. PoolFlow shows photo step; requester uploads JPEG/PNG/PDF -> status=pending_check
3. Audit staff sees it in Console -> Queue -> Evidence sub-tab
4. Approve -> verified (requester notified). Reject -> rejected with reason.

Legacy rows without `metadata.raw_object_id` show the hash in audit review (raw value unavailable).
