/**
 * Thin backend client.
 *
 * In dev (npm run dev) or when VITE_API_URL is set, calls the real FastAPI
 * backend. In the deployed build without VITE_API_URL, every call fails
 * gracefully so AppContext can fall back to mock data.
 *
 * All errors are returned as null — callers decide whether to fall back.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000';

let backendKnownDown = false;

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (backendKnownDown) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
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
  call<{ id: string; tier: number; status: string; bundle_category: string; locker_location: string; created_at: string }>(
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