"""Verification tier assignment — pure functions, testable in isolation.

R.U.T.H Section 4.8:
  - Tier 1: new token, low value → self-declared + rate limits + 5% audit
  - Tier 2: utility / school / hospital under KES 5,000 → object-level check
  - Tier 3: repeat or ≥ KES 5,000 → automated OCR of bill photo
  - Tier 4: assigned later by anomaly detection (not here)
"""
from typing import Literal

Category = Literal["utility", "school_fee", "hospital_invoice", "swap_bundle"]
Tier = int  # 1-4

TIER_3_THRESHOLD_PENCE = 500_000  # 5,000 KES


def assign_tier(category: Category, amount_pence: int) -> Tier:
    if category == "swap_bundle":
        return 1
    if amount_pence >= TIER_3_THRESHOLD_PENCE:
        return 3
    return 2


def initial_status(tier: Tier) -> str:
    """Tier 3 requires OCR before dispatch. Other tiers auto-verify."""
    if tier >= 3:
        return "pending_check"
    return "verified"