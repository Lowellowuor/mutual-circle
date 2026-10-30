"""Staff credentials — bcrypt-verified.

Each role has its own ID and PIN hash. The IDs are also used as a guard:
a correct PIN with the wrong staff ID (cross-role attempt) is rejected.
"""
import logging
from dataclasses import dataclass

import bcrypt

from mtc.config import settings

logger = logging.getLogger(__name__)


@dataclass
class StaffCredential:
    role: str
    staff_id: str
    pin_hash: str


def get_credential_for_role(role: str) -> StaffCredential | None:
    if role == "enrolment":
        return StaffCredential(role, settings.staff_enrol_id, settings.staff_enrol_pin_hash)
    if role == "fulfilment":
        return StaffCredential(role, settings.staff_fulf_id, settings.staff_fulf_pin_hash)
    if role == "audit":
        return StaffCredential(role, settings.staff_audit_id, settings.staff_audit_pin_hash)
    return None


def verify_pin(plain_pin: str, pin_hash: str) -> bool:
    if not pin_hash:
        return False
    try:
        return bcrypt.checkpw(plain_pin.encode("utf-8"), pin_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def authenticate(role: str, staff_id: str, pin: str) -> StaffCredential | None:
    cred = get_credential_for_role(role)
    if cred is None:
        return None
    if cred.staff_id.upper() != staff_id.strip().upper():
        return None
    if not verify_pin(pin, cred.pin_hash):
        return None
    return cred