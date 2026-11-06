-- Backfill: voucher_issued requests where voucher was already redeemed
-- Run BEFORE (count), THEN (update), THEN AFTER (verify)

-- STEP 1: Count affected rows (read-only, safe)
SELECT COUNT(*) AS needs_fix FROM requests r
JOIN vouchers v ON v.request_id = r.id
WHERE v.status = 'redeemed' AND r.status = 'voucher_issued';

-- STEP 2: Apply the fix (run only if count from step 1 > 0)
UPDATE requests r
SET status = 'collected', updated_at = now()
FROM vouchers v
WHERE v.request_id = r.id
  AND v.status = 'redeemed'
  AND r.status = 'voucher_issued';

-- STEP 3: Verify (should be 0)
SELECT COUNT(*) AS remaining FROM requests r
JOIN vouchers v ON v.request_id = r.id
WHERE v.status = 'redeemed' AND r.status = 'voucher_issued';
