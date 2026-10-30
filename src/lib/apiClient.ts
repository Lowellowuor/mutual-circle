/**
 * Thin backend client.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000';

// Session-expired event — AppContext subscribes and clears token
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

let backendKnownDown = false;

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (backendKnownDown) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (res.status === 401) {
      // Token invalid — trigger re-login, not a generic failure
      if (onSessionExpired) onSessionExpired();
      return null;
    }
    if (!res.ok) {
      if (res.status >= 500) backendKnownDown = true;
      return null;
    }
    return (await res.json()) as T;
  } catch {
    backendKnownDown = true;
    return null;
  }
}

export function isBackendActive(): boolean {
  return !backendKnownDown;
}

export function resetBackendProbe(): void {
  backendKnownDown = false;
}

// --- Public ---
export const issueToken = (phone: string) =>
  call<{ token: string }>('/tokens', { method: 'POST', body: JSON.stringify({ phone }) });

// --- Requester ---
export const createSwapRequest = (token: string, bundleCategory: string, lockerLocation: string) =>
  call<{ id: string; tier: number; status: string; bundle_category: string; locker_location: string; pin: string; qr_payload: string; created_at: string }>(
    '/requests/swap',
    { method: 'POST', headers: { 'X-Token': token }, body: JSON.stringify({ bundle_category: bundleCategory, locker_location: lockerLocation }) },
  );

export const createPoolRequest = (token: string, category: string, hashedObjectId: string, amountPence: number) =>
  call<{ id: string; tier: number; status: string; hashed_object_id: string; amount_pence: number; created_at: string }>(
    '/requests/pool',
    { method: 'POST', headers: { 'X-Token': token }, body: JSON.stringify({ category, hashed_object_id: hashedObjectId, amount_pence: amountPence }) },
  );

export const listMyRequests = (token: string) =>
  call<{ requests: any[] }>('/requests/mine', { headers: { 'X-Token': token } });

export const withdrawRequest = (token: string, requestId: string) =>
  call<{ id: string; status: string }>(`/requests/${requestId}/withdraw`, { method: 'POST', headers: { 'X-Token': token } });

export const listMyVouchers = (token: string) =>
  call<{ vouchers: any[] }>('/requests/vouchers/mine', { headers: { 'X-Token': token } });

// --- Staff ---
export const staffLogin = (role: string, staffId: string, pin: string) =>
  call<{ session_token: string; expires_at: string; session_id: string }>(
    '/staff/login', { method: 'POST', body: JSON.stringify({ role, staff_id: staffId, pin }) },
  );

export const staffLogout = (sessionToken: string) =>
  call<{ ok: boolean }>('/staff/logout', { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` } });

export const staffSession = (sessionToken: string) =>
  call<{ role: string; staff_id: string }>('/staff/session', { headers: { Authorization: `Bearer ${sessionToken}` } });

// --- Fulfilment ---
export const fulfilmentQueue = (sessionToken: string) =>
  call<{ pool: any[]; swap: any[] }>('/fulfilment/queue', { headers: { Authorization: `Bearer ${sessionToken}` } });

export const dispatchRequest = (sessionToken: string, requestId: string) =>
  call<{ request_id: string; receipt: string; status: string }>(
    `/fulfilment/requests/${requestId}/dispatch`, { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` } },
  );

export const issueVoucher = (sessionToken: string, requestId: string, partnerName: string, partnerType: 'retailer' | 'hospital') =>
  call<{ voucher_id: string; pin: string; partner_name: string; max_value_pence: number; expires_at: string }>(
    `/fulfilment/requests/${requestId}/voucher`,
    { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` }, body: JSON.stringify({ partner_name: partnerName, partner_type: partnerType }) },
  );

// --- Audit ---
export const auditFlags = (sessionToken: string) =>
  call<{ flags: any[] }>('/audit/flags', { headers: { Authorization: `Bearer ${sessionToken}` } });

export const routeFlagToTier4 = (sessionToken: string, flagId: string) =>
  call<{ id: string; status: string }>(`/audit/flags/${flagId}/route-tier4`, { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` } });

export const clearFlag = (sessionToken: string, flagId: string, note: string) =>
  call<{ id: string; status: string }>(
    `/audit/flags/${flagId}/clear`,
    { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` }, body: JSON.stringify({ note }) },
  );

export const ocrQueue = (sessionToken: string) =>
  call<{ requests: any[] }>('/audit/ocr-queue', { headers: { Authorization: `Bearer ${sessionToken}` } });

export const completeOcr = (sessionToken: string, requestId: string) =>
  call<{ request_id: string; status: string }>(`/audit/ocr/${requestId}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` } });

export const auditLog = (sessionToken: string, limit = 100) =>
  call<{ entries: any[] }>(`/audit/log?limit=${limit}`, { headers: { Authorization: `Bearer ${sessionToken}` } });

// --- Partner / till ---
export const redeemVoucher = (pin: string, partnerName: string, amountPence: number) =>
  call<{ ok: boolean; reason?: string; voucher_id?: string }>(
    '/partner/redeem',
    { method: 'POST', body: JSON.stringify({ pin, partner_name: partnerName, amount_pence: amountPence }) },
  );

// --- Enrolment ---
export const enrolmentMetrics = (sessionToken: string) =>
  call<{ tokens_today: number; rate_limit_hits_today: number; channels: Record<string, number> }>(
    '/enrolment/metrics', { headers: { Authorization: `Bearer ${sessionToken}` } },
  );
// --- Campaigns (public read) ---
export const listCampaigns = () =>
  call<{ campaigns: any[] }>('/campaigns');

// --- Donor contributions ---
export const createDonation = (donorHash: string, amountPence: number, isAnonymous: boolean, optInLedger: boolean) =>
  call<{ id: string; amount_pence: number; is_anonymous: boolean; opt_in_ledger: boolean; created_at: string }>(
    '/donations',
    { method: 'POST', headers: { 'X-Donor-Hash': donorHash }, body: JSON.stringify({ amount_pence: amountPence, is_anonymous: isAnonymous, opt_in_ledger: optInLedger }) },
  );

export const listMyDonations = (donorHash: string) =>
  call<{ donations: any[] }>('/donations/mine', { headers: { 'X-Donor-Hash': donorHash } });

// --- Pledges ---
export const createPledge = (donorHash: string, type: 'goods' | 'service_credit', description: string, locality: string, maxValuePence?: number) =>
  call<{ id: string; type: string; description: string; locality: string; max_value_pence: number | null; status: string; created_at: string }>(
    '/pledges',
    { method: 'POST', headers: { 'X-Donor-Hash': donorHash }, body: JSON.stringify({ type, description, locality, max_value_pence: maxValuePence }) },
  );

export const listMyPledges = (donorHash: string) =>
  call<{ pledges: any[] }>('/pledges/mine', { headers: { 'X-Donor-Hash': donorHash } });

// --- Match interests (requester side) ---
export const expressMatchInterest = (token: string, requestId: string, opportunityId: string, title: string) =>
  call<{ id: string; opportunity_id: string; title: string; status: string; created_at: string }>(
    `/requests/match/${requestId}/interest`,
    { method: 'POST', headers: { 'X-Token': token }, body: JSON.stringify({ opportunity_id: opportunityId, title }) },
  );

// --- Fulfilment: pledges + match interests + vouchers list ---
export const listFulfilmentPledges = (sessionToken: string) =>
  call<{ pledges: any[] }>('/fulfilment/pledges', { headers: { Authorization: `Bearer ${sessionToken}` } });

export const matchPledge = (sessionToken: string, pledgeId: string) =>
  call<{ id: string; status: string }>(`/fulfilment/pledges/${pledgeId}/match`, { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` } });

export const listMatchInterests = (sessionToken: string) =>
  call<{ interests: any[] }>('/fulfilment/match-interests', { headers: { Authorization: `Bearer ${sessionToken}` } });

export const closeMatchInterest = (sessionToken: string, interestId: string, status: 'contacted' | 'closed') =>
  call<{ id: string; status: string }>(
    `/fulfilment/match-interests/${interestId}/close`,
    { method: 'POST', headers: { Authorization: `Bearer ${sessionToken}` }, body: JSON.stringify({ status }) },
  );

export const listAllVouchers = (sessionToken: string) =>
  call<{ vouchers: any[] }>('/fulfilment/vouchers', { headers: { Authorization: `Bearer ${sessionToken}` } });

// --- Admin (staff - any role can read) ---
export const getDepot = (sessionToken: string) =>
  call<{ receivedUnits: number; qualityCheckedUnits: number; packedBundles: number; loadedLockerUnits: number }>(
    '/admin/depot', { headers: { Authorization: `Bearer ${sessionToken}` } },
  );

export const getLockerStock = (sessionToken: string) =>
  call<{ stocks: any[] }>('/admin/locker-stock', { headers: { Authorization: `Bearer ${sessionToken}` } });

export const getDedupItems = (sessionToken: string) =>
  call<{ items: any[] }>('/admin/dedup', { headers: { Authorization: `Bearer ${sessionToken}` } });

// --- Partner till ---
export const listPartnerRedemptions = () =>
  call<{ redemptions: any[] }>('/partner/redemptions');
/**
 * Strict token call that surfaces the backend's 4xx/5xx reason instead of
 * silently returning null. Used by the phone-verification flow so the user
 * sees "enter a valid number" rather than "Backend unavailable".
 */
export async function issueTokenStrict(phone: string): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    if (res.status === 422) {
      throw new Error('Please enter a valid phone number (at least 10 digits).');
    }
    if (res.status >= 500) {
      throw new Error('Backend is not reachable. Please try again in a moment.');
    }
    throw new Error(`Verification failed (${res.status}). Please try again.`);
  }
  return res.json();
}
// --- Household declaration ---
export const setHouseholdSize = (token: string, size: number) =>
  call<{ household_size: number; declared_at: string }>(
    '/requests/household',
    { method: 'POST', headers: { 'X-Token': token }, body: JSON.stringify({ household_size: size }) },
  );

export const getHouseholdSize = (token: string) =>
  call<{ household_size: number | null; declared: boolean }>(
    '/requests/household', { headers: { 'X-Token': token } },
  );
// --- Donor leaderboard + profile ---
export const getDonorLeaderboard = (limit = 20) =>
  call<{ leaderboard: { display_name: string; total_pence: number; gift_count: number }[] }>(
    `/donations/leaderboard?limit=${limit}`,
  );

export const getDonorProfile = (donorHash: string) =>
  call<{ display_name: string; opt_in_ledger: boolean; has_profile: boolean }>(
    '/donations/profile', { headers: { 'X-Donor-Hash': donorHash } },
  );

export const updateDonorProfile = (donorHash: string, displayName: string, optInLedger: boolean) =>
  call<{ display_name: string; opt_in_ledger: boolean }>(
    '/donations/profile',
    { method: 'POST', headers: { 'X-Donor-Hash': donorHash }, body: JSON.stringify({ display_name: displayName, opt_in_ledger: optInLedger }) },
  );
// --- Opportunities (The Match) ---
export const getOpportunities = () =>
  call<{ opportunities: { id: string; type: string; title: string; description: string; locality: string; commit: string; posted_at: string }[] }>(
    '/opportunities',
  );

// --- Helplines (Section 4.9) ---
export const getHelplines = () =>
  call<{ helplines: { id: string; name: string; number: string; sub: string; category: string }[] }>(
    '/helplines',
  );

// --- Public aggregate stats (no mocks — real DB state) ---
export const getImpactStats = () =>
  call<{ total_pooled_pence: number; bundles_delivered: number; utility_meters_paid: number; student_terms_paid: number }>(
    '/stats/impact',
  );

export const getDistribution = () =>
  call<{ total_pence: number; by_category: { category: string; label: string; count: number; total_pence: number; percentage: number }[] }>(
    '/stats/distribution',
  );
// --- Requester notifications (Gap 1) ---
export const getNotifications = (token: string) =>
  call<{ notifications: { id: string; request_id: string | null; template: string; content: string; status: string; created_at: string; sent_at: string | null }[] }>(
    '/notifications/mine', { headers: { 'X-Token': token } },
  );

export const getUnreadNotificationCount = (token: string) =>
  call<{ unread_count: number }>('/notifications/unread_count', { headers: { 'X-Token': token } });

// --- Public ledger (Gap 2) ---
export const getPublicLedger = (limit = 20) =>
  call<{
    total_pooled_pence: number;
    entry_count: number;
    chain_ok: boolean;
    broken_at: { index: number; reason: string } | null;
    last_entries: { id: string; object_hash: string; category: string; amount_pence: number; entry_hash_prefix: string; previous_hash_prefix: string; created_at: string }[];
  }>(`/ledger/public?limit=${limit}`);

// --- Partner API (Gap 3) ---
export const getPartnerMe = (partnerKey: string) =>
  call<{ id: string; name: string; type: string; contact_email: string }>(
    '/partners/me', { headers: { 'X-Partner-Key': partnerKey } },
  );

export const getPartnerRedemptions = (partnerKey: string) =>
  call<{ kind: string; redemptions: any[] }>(
    '/partners/me/redemptions', { headers: { 'X-Partner-Key': partnerKey } },
  );

export const confirmPartnerRequest = (partnerKey: string, requestId: string, confirmationType: 'delivered' | 'settled' | 'disputed', note = '') =>
  call<{ ok: boolean; request_id: string; confirmation_type: string }>(
    `/partners/me/confirm/${requestId}`,
    { method: 'POST', headers: { 'X-Partner-Key': partnerKey }, body: JSON.stringify({ confirmation_type: confirmationType, note }) },
  );
