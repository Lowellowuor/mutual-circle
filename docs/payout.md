# Payout paths

Money in and money out are separate:

- **Money in** (donors): donations and pledges are paid through Paystack
  hosted checkout (`POST /donations/{id}/pay`, `POST /pledges/{id}/pay`,
  confirmed by `POST /paystack/webhook` and `GET /payments/verify/{reference}`).
  See docs/api.md. Paystack is not used for payouts.
- **Money out** (to institutions): fulfilment staff pay the biller
  directly, outside the app, and record it. Requesters never pay and
  never receive cash for bills; the requester self-pay route was removed.

The paths below are the money-out side. Dispatch and voucher are in
backend/src/mtc/routes/fulfilment.py; the KPLC flow is in
backend/src/mtc/routes/institutional.py.

## 1. Direct settlement — POST /fulfilment/requests/{id}/dispatch

Auth: Bearer staff JWT, role fulfilment. Body: none.

Effect:
- Appends ledger entry with settled_by_hash = staff_id
- Sets requests.status = submitted_to_partner
- Writes metadata.receipt = MPESA-XXXXXXXX (a generated placeholder
  reference, not a real M-PESA receipt; no payment API is called)
- Notifies requester dispatched

Fails 409 if type != pool, status != verified, or object_hash already in ledger.

Use for: billers the team pays outside the app by bank transfer or
paybill (KPLC, school, hospital).

## 2. Voucher issue — POST /fulfilment/requests/{id}/voucher

Auth: Bearer staff JWT, role fulfilment.
Body: partner_name, partner_type (retailer | hospital)

Effect:
- Creates voucher with 4-digit PIN
- Sets requests.status = voucher_issued
- Notifies requester voucher_issued

Redemption: partner POST /partner/redeem with pin.

Use for: retail shops or hospital cashiers the user physically visits.

## 3. KPLC token delivery — POST /admin/institutional-payments/{request_id}/confirm

Auth: Bearer staff JWT, role fulfilment.
Body: bank_transaction_ref, kplc_token, optional institution_id.

Staff pay KPLC by bank transfer, then record it here. Effect, in one
transaction:

- Upserts institutional_payments (status paid, bank ref, KPLC token)
- Sets requests.status = fulfilled
- Then SMSes the KPLC token to the requester (best effort; a failed SMS
  never rolls back the payment)

Queue: GET /admin/institutional-payments/queue. Register the utility
first with POST /admin/institutions (type utility).

## Which path

| Request type | Partner | Path |
|---|---|---|
| Food bundle (swap) | Locker hub | Neither — swap PIN at locker |
| Utility bill | KPLC/Water | Dispatch |
| School fee | School | Dispatch |
| Hospital invoice | Hospital | Voucher or dispatch |
| Retail pickup | Retailer | Voucher |

## Audit

Both paths call append_audit. Public ledger shows entry but not staff identity.