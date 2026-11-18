const DONOR_HASH_KEY = 'mtc-donor-hash';

/** The donor hash saved in this browser, or null if there is none yet. */
export function readDonorHash(): string | null {
  try {
    return localStorage.getItem(DONOR_HASH_KEY);
  } catch {
    return null;
  }
}

export function getOrCreateDonorHash(): string {
  try {
    let h = localStorage.getItem(DONOR_HASH_KEY);
    if (!h) {
      h = 'donor-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(DONOR_HASH_KEY, h);
    }
    return h;
  } catch (e) {
    console.warn('[donor-hash] localStorage unavailable, falling back to shared anonymous hash', e);
    return 'donor-anonymous';
  }
}
