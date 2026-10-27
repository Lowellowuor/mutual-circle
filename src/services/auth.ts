// Mock staff credentials. In production these come from an IdP.
export const STAFF_CREDS: Record<'enrolment' | 'fulfilment' | 'audit', { id: string; pin: string; label: string }> = {
  enrolment:  { id: 'ENROL-04', pin: '4821', label: 'Enrolment' },
  fulfilment: { id: 'FULF-08',  pin: '7355', label: 'Fulfilment' },
  audit:      { id: 'AUDIT-02', pin: '9142', label: 'Audit / Tier 4' },
};

export function verifyStaffCredentials(role: keyof typeof STAFF_CREDS, id: string, pin: string): boolean {
  const c = STAFF_CREDS[role];
  return !!c && c.id.toUpperCase() === id.trim().toUpperCase() && c.pin === pin.trim();
}

export const MAX_DAILY_REQUESTS = 25;
export const MAX_DAILY_VALUE = 100000;

export interface RateState { count: number; value: number; lastReset: string }

const rateKey = (token: string) => `mtc-rate-${token}`;

export function peekRate(token: string): RateState {
  try {
    const raw = localStorage.getItem(rateKey(token));
    if (!raw) return { count: 0, value: 0, lastReset: new Date().toISOString() };
    const r = JSON.parse(raw) as RateState;
    const last = new Date(r.lastReset).getTime();
    if (Date.now() - last > 24 * 60 * 60 * 1000) {
      return { count: 0, value: 0, lastReset: new Date().toISOString() };
    }
    return r;
  } catch { return { count: 0, value: 0, lastReset: new Date().toISOString() }; }
}

export function saveRate(token: string, r: RateState) {
  try { localStorage.setItem(rateKey(token), JSON.stringify(r)); } catch {}
}

export function consumeRate(token: string, value: number = 0): { ok: boolean; reason?: string; state: RateState } {
  const state = peekRate(token);
  if (state.count + 1 > MAX_DAILY_REQUESTS) {
    return { ok: false, reason: `Daily request limit (${MAX_DAILY_REQUESTS}) reached for this token. Try again tomorrow.`, state };
  }
  if (state.value + value > MAX_DAILY_VALUE) {
    return { ok: false, reason: `Daily value limit (KES ${MAX_DAILY_VALUE.toLocaleString()}) reached. ${(MAX_DAILY_VALUE - state.value).toLocaleString()} KES remaining.`, state };
  }
  const next = { count: state.count + 1, value: state.value + value, lastReset: state.lastReset };
  saveRate(token, next);
  return { ok: true, state: next };
}

export const historyKey = (token: string) => `mtc-req-${token}`;
export const seenKey = (token: string) => `mtc-seen-${token}`;

export function loadHistory(token: string): any[] {
  try {
    const raw = localStorage.getItem(historyKey(token));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveHistory(token: string, history: any[]) {
  try { localStorage.setItem(historyKey(token), JSON.stringify(history.slice(0, 30))); } catch {}
}

export function appendHistory(token: string, entry: any) {
  const h = loadHistory(token);
  h.unshift(entry);
  saveHistory(token, h);
}

export function loadSeen(token: string): string[] {
  try {
    const raw = localStorage.getItem(seenKey(token));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSeen(token: string, ids: string[]) {
  try { localStorage.setItem(seenKey(token), JSON.stringify(ids)); } catch {}
}
