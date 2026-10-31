# Payout paths

Two ways a fulfilled request becomes a real settlement. Both in backend/src/mtc/routes/fulfilment.py.

## 1. Direct settlement — POST /fulfilment/requests/{id}/dispatch

Auth: Bearer staff JWT, role fulfilment. Body: none.

Effect:
- Appends ledger entry with settled_by_hash = staff_id
- Sets requests.status = submitted_to_partner
- Writes metadata.receipt = MPESA-XXXXXXXX
- Notifies requester dispatched

Fails 409 if type != pool, status != verified, or object_hash already in ledger.

Use for: billers settling via MPESA (KPLC, school, hospital bank transfer).

## 2. Voucher issue — POST /fulfilment/requests/{id}/voucher

Auth: Bearer staff JWT, role fulfilment.
Body: partner_name, partner_type (retailer | hospital)

Effect:
- Creates voucher with 4-digit PIN
- Sets requests.status = voucher_issued
- Notifies requester voucher_issued

Redemption: partner POST /partner/redeem with pin.

Use for: retail shops or hospital cashiers the user physically visits.

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