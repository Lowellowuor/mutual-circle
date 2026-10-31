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

## 4. Partner — X-Partner-Key

Header: X-Partner-Key: <demo-key>

- Static per-partner key (e.g. kplc-demo-key-2026)
- NOT production-grade — a real deployment should issue partner JWTs
- Used by: /partners/me*, /partners/me/confirm/*, /partners/me/statement.csv

## Failure modes

Invalid token: 401. Wrong owner or role: 403.

## Key rotation

TOKEN_HMAC_KEY_CURRENT and _PREVIOUS allow zero-downtime rotation.
Suggested: rotate quarterly, retire previous key 30 days after.