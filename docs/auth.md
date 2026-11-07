# Authentication

Four auth schemes, one per user class.

## 1. Requester — X-Token

Header: X-Token: 16-hex

- Issued by POST /tokens
- Derived from HMAC(phone), raw phone never stored
- No explicit expiry (session = browser lifetime)
- Rotation via TOKEN_HMAC_KEY_CURRENT / _PREVIOUS
- Used by: /requests/*, /notifications/*, /requests/household

## 2. Donor — X-Donor-Hash

Header: X-Donor-Hash

- Client-generated, stored in localStorage
- Stable identity across sessions
- Used by: /donations, /pledges

## 3. Staff — Authorization: Bearer JWT

Header: Authorization: Bearer <jwt>

- Issued by POST /staff/login
- Roles: enrolment, fulfilment, audit
- Signed with JWT_SECRET
- Used by: /staff/*, /fulfilment/*, /audit/*, /admin/*

## 4. Partner — X-Partner-Key (signed)

Header: X-Partner-Key: <raw-key>.<hex-signature>

Signed format: HMAC-SHA256(PARTNER_HMAC_KEY, raw-key) appended after a
dot. Server verifies before accepting the key.

- Used by: /partner/redeem, /partner/redemptions
- Development: unsigned keys accepted if PARTNER_HMAC_KEY is unset
- Production: PARTNER_HMAC_KEY is required; unsigned keys rejected

**Signing tool:** python -c "from mtc.auth.partner_signing import sign_partner_key; print(sign_partner_key('kplc-demo-key-2026'))"

The `/partners/me*` endpoints (a different prefix) still accept unsigned
keys for now — hardening those is a separate follow-up.

## Failure modes

Invalid token: 401. Wrong owner or role: 403.

## Key rotation

TOKEN_HMAC_KEY_CURRENT and _PREVIOUS allow zero-downtime rotation.
Suggested: rotate quarterly, retire previous key 30 days after.