"""Basket recommendation — per-family-size defaults for each category.

Family size sets the baseline. A request inside the tolerance band serves
at the category's normal tier. Above the band → escalate to tier 3
(photo evidence required) but still serve. Below the band → confirm with
the requester but proceed.

Rationale (R.U.T.H 4.2 + payments review notes):
- Hard caps punish genuine need (in-laws visiting, displaced families).
- Zero friction invites abuse.
- Progressive friction (tier escalation) catches the tail without
  blocking honest edge cases.

The k-anonymity and outlier-detection anti-fraud work lives at the
aggregate/review layer, not here. This module only produces the tier
and flag that shape the request workflow.
"""
from __future__ import annotations


# Amounts in KES pence. Category → {family_size → baseline total}.
# Keys must match PoolBody.category (plus 'food'/'hygiene' when those
# become selectable in the UI).
CATEGORY_BASELINES: dict[str, dict[int, int]] = {
    "food":              {1: 100_000, 2: 160_000, 3: 220_000, 4: 280_000,
                          5: 340_000, 6: 400_000, 7: 460_000, 8: 520_000},
    "hygiene":           {1:  20_000, 2:  30_000, 3:  40_000, 4:  50_000,
                          5:  60_000, 6:  70_000, 7:  80_000, 8:  90_000},
    "utility":           {1:  50_000, 2:  80_000, 3: 110_000, 4: 140_000,
                          5: 170_000, 6: 200_000, 7: 230_000, 8: 260_000},
    "school_fee":        {1: 200_000, 2: 350_000, 3: 500_000, 4: 650_000,
                          5: 800_000, 6: 950_000, 7: 1_100_000, 8: 1_250_000},
    "hospital_invoice":  {1: 150_000, 2: 250_000, 3: 350_000, 4: 450_000,
                          5: 550_000, 6: 650_000, 7: 750_000, 8: 850_000},
}

# Tier by family size (applies to every category)
TIER_BY_SIZE = {1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 3, 7: 3, 8: 3}

# Tolerance window
TOLERANCE_LOW = 0.70
TOLERANCE_HIGH = 1.40


def _clamp(size: int) -> int:
    return max(1, min(int(size), 8))


def recommend_basket(family_size: int) -> dict:
    """Return the full recommended basket for a household of ``family_size``.

    Used by the frontend to pre-populate amount fields and by the survey
    route's ``/basket-preview`` endpoint.
    """
    size = _clamp(family_size)
    items = [
        {
            "category": cat,
            "amount_pence": baselines[size],
            "amount_kes": baselines[size] // 100,
        }
        for cat, baselines in CATEGORY_BASELINES.items()
    ]
    total_pence = sum(i["amount_pence"] for i in items)
    return {
        "family_size": size,
        "tier": TIER_BY_SIZE[size],
        "items": items,
        "total_pence": total_pence,
        "total_kes": total_pence // 100,
    }


def evaluate_amount(family_size: int, category: str, requested_pence: int) -> dict:
    """Score a single request against the household baseline.

    Returns:
        {
          "ok": bool,              # always True — we don't reject, we tier
          "tier": int,             # 1..3 (3 = photo evidence required)
          "flag": str | None,      # 'over_baseline' | 'under_baseline_confirm'
          "baseline_pence": int,
          "ratio": float,
          "message": str,
        }
    """
    size = _clamp(family_size)
    baselines = CATEGORY_BASELINES.get(category)
    if baselines is None:
        # Unknown category — no basis for evaluation, serve at normal tier
        return {
            "ok": True,
            "tier": TIER_BY_SIZE[size],
            "flag": None,
            "baseline_pence": 0,
            "ratio": 0.0,
            "message": f"No baseline for category '{category}'; standard tier applied.",
        }

    baseline = baselines[size]
    ratio = requested_pence / baseline if baseline else 0.0

    if ratio < TOLERANCE_LOW:
        return {
            "ok": True,
            "tier": TIER_BY_SIZE[size],
            "flag": "under_baseline_confirm",
            "baseline_pence": baseline,
            "ratio": round(ratio, 2),
            "message": (
                f"{requested_pence // 100} KES is {ratio*100:.0f}% of baseline for a "
                f"family of {size}. Confirm the amount is correct."
            ),
        }
    if ratio <= TOLERANCE_HIGH:
        return {
            "ok": True,
            "tier": TIER_BY_SIZE[size],
            "flag": None,
            "baseline_pence": baseline,
            "ratio": round(ratio, 2),
            "message": "Within tolerance.",
        }
    return {
        "ok": True,
        "tier": max(TIER_BY_SIZE[size], 3),
        "flag": "over_baseline",
        "baseline_pence": baseline,
        "ratio": round(ratio, 2),
        "message": (
            f"{requested_pence // 100} KES is {ratio*100:.0f}% of baseline for a "
            f"family of {size}. Photo evidence required."
        ),
    }
