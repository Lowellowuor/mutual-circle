SELECT COUNT(*) AS needs_fix FROM requests r
JOIN vouchers v ON v.request_id = r.id
WHERE v.status = 'redeemed' AND r.status = 'voucher_issued';

UPDATE requests r
SET status = 'collected', updated_at = now()
FROM vouchers v
WHERE v.request_id = r.id
  AND v.status = 'redeemed'
  AND r.status = 'voucher_issued';

SELECT COUNT(*) AS remaining FROM requests r
JOIN vouchers v ON v.request_id = r.id
WHERE v.status = 'redeemed' AND r.status = 'voucher_issued';
