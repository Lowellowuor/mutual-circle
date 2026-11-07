# Roles

Six users interact with Mutual Circle. Separate credentials, separate scope, separate data visibility. No role can escalate into another's view — enforced at the API layer.

## 1. Requester

**Who:** End beneficiary. Needs a food bundle or bill payment.

**Auth:** POST /tokens issues an HMAC token from phone number. Raw phone hashed and discarded — never stored.

**Day in life:**
1. Contacts via SMS / USSD / WhatsApp / web.
2. Declares household size (1, 2-3, 4-6, 7+).
3. Either reserves a bundle (Tier 1, gets PIN) or submits a bill (Tier 2/3 based on amount; Tier 3 needs OCR).
4. Receives REF-XXXXXXXX + PIN.
5. Collects at locker, enters PIN, confirms collection.

**Can do:** submit swap/pool requests; view own requests; confirm collection (POST /requests/{id}/collect or /requests/collect with PIN); view notifications; set household size; express match interest; withdraw before dispatch.

**Cannot do:** see other requesters; see donor identity; see partner reconciliation data; see staff audit log.

**Never sees:** their own name (not stored); the donor-recipient link (doesn't exist).

## 2. Donor

**Who:** Individual giving to the blind pool.

**Auth:** Persistent donorHash in localStorage. Survives logout/refresh. No server-side issuance — the hash is the identity.

**Day in life:**
1. Opens Donor Portal, browses campaigns + impact.
2. Either gives cash (anonymous by default) or pledges goods/credit (matched by fulfilment).
3. Optionally joins leaderboard with display name.
4. Views donation history, pledges (with linked REFs), impact delta.
5. Can verify public ledger chain status.

**Can do:** give to pool (POST /donations); view own history; opt in/out leaderboard (POST /donations/profile); create pledges (POST /pledges); view pledges with linked REFs; verify ledger (GET /ledger/public + CSV).

**Cannot do:** see which specific request their gift funded (field doesn't exist); see other donors; see recipient names or clinical data.

**Never sees:** the recipient of any specific gift — donation-to-disbursement link is architecturally absent.

## 3. Enrolment staff

**Who:** Front-line intake at a hub.

**Auth:** POST /staff/login with role=enrolment, staff_id=ENROL-04, pin=****.

**Day in life:** logs in -> helps walk-in issue a token -> monitors enrolment metrics -> hands off to fulfilment or pool flow.

**Can do:** view enrolment metrics (GET /enrolment/metrics); issue tokens.

**Cannot do:** dispatch, issue vouchers, clear flags, see individual request details, see donor data.

**Sees:** aggregate metrics only.

## 4. Fulfilment staff

**Who:** Operations queue processor.

**Auth:** POST /staff/login with role=fulfilment, staff_id=FULF-08, pin=****.

**Day in life:** logs in -> Queue tab -> filters (All / Pool / Swap / Pending / Sent) -> dispatch verified requests OR issue vouchers -> match incoming pledges to specific requests -> check Depot (locker stock) and Partner till -> download statements.

**Can do:** view fulfilment queue (GET /fulfilment/queue); dispatch (POST /fulfilment/requests/{id}/dispatch); issue voucher (POST /fulfilment/requests/{id}/voucher); match pledge with request_id (POST /fulfilment/pledges/{id}/match); close match interests; view all vouchers; download partner statement CSV.

**Cannot do:** complete OCR, clear/route risk flags, issue tokens, see donor identities.

## 5. Audit staff

**Who:** Fraud / compliance reviewer.

**Auth:** POST /staff/login with role=audit, staff_id=AUDIT-02, pin=****.

**Day in life:** logs in -> Queue tab -> Audit sub-tabs -> reviews flags (clear false positive with note or route to Tier 4) -> processes OCR queue (verify bill photo, mark complete) -> reviews dedup items -> exports audit log CSV.

**Can do:** view flags (GET /audit/flags); route to Tier 4 or clear (POST /audit/flags/{id}/route-tier4, /clear); complete OCR (POST /audit/ocr/{id}/complete); view/export log (GET /audit/log, /audit/export.csv); view dedup items.

**Cannot do:** dispatch, issue vouchers, issue tokens.

## 6. Partner (external institution)

**Who:** KPLC, CHUI, schools, hospitals.

**Auth:** Static X-Partner-Key header (e.g. kplc-demo-key-2026). NOT production-grade — real deployment should issue partner JWTs. Documented limitation.

**Day in life:** receives settlement notification (out-of-band) -> checks own redemption list -> confirms delivery / settled / disputed -> downloads statement CSV.

**Can do:** view own profile (GET /partners/me); view own redemptions; confirm delivery/settlement/dispute (POST /partners/me/confirm/{request_id}); download own statement CSV.

**Cannot do:** see other partners; see requester identity; see donor data; query DB directly.

**Sees:** only own settlements, with masked requester tokens. Never names, never phone numbers, never clinical details.

## Permission matrix

| Action | Requester | Donor | Enrolment | Fulfilment | Audit | Partner |
|---|---|---|---|---|---|---|
| Create request | own | - | - | - | - | - |
| Confirm collection | own | - | - | - | - | - |
| Give to pool | - | yes | - | - | - | - |
| Create pledge | - | yes | - | - | - | - |
| Issue token | own | - | yes | - | - | - |
| Dispatch request | - | - | - | yes | - | - |
| Issue voucher | - | - | - | yes | - | - |
| Complete OCR | - | - | - | - | yes | - |
| Clear risk flag | - | - | - | - | yes | - |
| Confirm partner settlement | - | - | - | - | - | own |
| View public ledger | yes | yes | yes | yes | yes | yes |

## The blind-pool invariant

No field in the database connects a specific donor to a specific disbursement. Enforced by schema, not policy.

- requests.pledge_id links a request to the pledge that funded it.
- A pledge belongs to a donor.
- No code path joins donation -> request.
- Donor recognition is aggregate only.

If you find a query that appears to link donor to recipient, that is a bug. Report it.
