/**
 * AppContext - every list is backend-sourced. No mocks.
 *
 * Demo convenience: poolRequests/swapRequests are the UNION of the requester's
 * own requests and the fulfilment queue. This is because the prototype runs
 * both roles in one browser session. In production, requesters and staff hit
 * separate endpoints as separate authenticated users.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { generateHMAC } from '../lib/hash';
import * as api from '../lib/apiClient';
import { setSessionExpiredHandler } from '../lib/apiClient';
import {
  PoolRequest, SwapRequest, RiskFlag, Campaign, Pledge, AuditLogEntry,
  DedupItem, LockerStock, DepotCounts, DonorContribution, StaffRole,
  Voucher, VoucherRedemption, MatchInterest,
} from '../types';

interface AppContextType {
  tokenHash: string | null;
  initializeSession: (phone: string, channel?: 'web' | 'sms' | 'ussd') => Promise<string>;
  logout: () => void;

  staffRole: StaffRole | null;
  staffId: string | null;
  loginStaff: (role: StaffRole, id: string, pin: string) => Promise<boolean>;
  logoutStaff: () => Promise<void>;

  swapRequests: SwapRequest[];
  poolRequests: PoolRequest[];
  riskFlags: RiskFlag[];
  campaigns: Campaign[];
  pledges: Pledge[];
  auditLog: AuditLogEntry[];
  dedupItems: DedupItem[];
  lockerStocks: LockerStock[];
  depotCounts: DepotCounts;
  donorContributions: DonorContribution[];
  donorHash: string;
  vouchers: Voucher[];
  voucherRedemptions: VoucherRedemption[];
  matchInterests: MatchInterest[];

  emptyQueueMode: boolean;
  setEmptyQueueMode: (v: boolean) => void;

  executeSwap: (category: string, location: string, tokenOverride?: string) => Promise<SwapRequest | null>;
  executePool: (category: PoolRequest['category'], objectId: string, amount: number, tokenOverride?: string) => Promise<PoolRequest | null>;
  withdrawRequest: (id: string, type: 'swap' | 'pool') => void;
  collectRequest: (id: string, pin: string) => Promise<boolean>;
  dispatchRequest: (id: string, type?: 'swap' | 'pool') => Promise<string | null>;
  issueVoucher: (requestId: string, partnerName: string, partnerType: 'retailer' | 'hospital') => Promise<Voucher | null>;
  redeemVoucher: (pin: string, amountPence: number, partnerName: string) => Promise<{ ok: boolean; reason?: string }>;
  completeOcrCheck: (requestId: string) => void;
  routeFlagToTier4: (flagId: string) => void;
  clearFlagAsFalsePositive: (flagId: string, note: string) => void;
  matchPledge: (pledgeId: string) => void;
  closeMatchInterest: (id: string, status: 'contacted' | 'closed') => void;
  expressInterest: (opportunityId: string, title: string) => void;
  addDonorContribution: (amount: number, isAnonymous: boolean, optInLedger: boolean) => void;
  addPledge: (type: 'goods' | 'service_credit', description: string, locality: string, maxValue?: number) => void;
  downloadAuditCsv: () => Promise<boolean>;

  refetchAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Donor identity (persists per browser so "my donations" work) ---
function getOrCreateDonorHash(): string {
  try {
    let h = localStorage.getItem('mtc-donor-hash');
    if (!h) {
      h = 'donor-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('mtc-donor-hash', h);
    }
    return h;
  } catch {
    return 'donor-anonymous';
  }
}

// --- Mappers (backend snake_case ? frontend camelCase) ---
function parseMeta(v: unknown): Record<string, unknown> {
  if (typeof v === 'string') { try { return JSON.parse(v) as Record<string, unknown>; } catch { return {}; } }
  return (v as Record<string, unknown>) || {};
}
function mapSwapFromBackend(r: unknown, tokenHash: string): SwapRequest {
  const o = (r || {}) as Record<string, unknown>;
  const meta = parseMeta(o.metadata);
  return {
    id: String(o.id ?? ''),
    tokenHash,
    bundleCategory: (meta.bundle as string) || (o.category as string) || 'Standard Pantry',
    lockerLocation: (meta.location as string) || '',
    status: ((o.status === 'verified' ? 'reserved' : o.status) as SwapRequest['status']),
    pin: (meta.pin as string) || (o.pin as string) || '----',
    qrPayload: (meta.qr as string) || (o.qr_payload as string) || '',
    timestamp: (o.created_at as string) || new Date().toISOString(),
  };
}

function mapPoolFromBackend(r: unknown, tokenHash: string): PoolRequest {
  const o = (r || {}) as Record<string, unknown>;
  const meta = parseMeta(o.metadata);
  return {
    id: String(o.id ?? ''),
    tokenHash,
    category: (o.category as PoolRequest['category']) || 'utility',
    hashedObjectId: (o.hashed_object_id as string) || (meta.object_hash as string) || '',
    amount: Number(o.amount_pence ?? 0) / 100,
    tier: Number(o.tier ?? 1) as PoolRequest['tier'],
    status: (o.status as PoolRequest['status']) || 'pending_check',
    timestamp: (o.created_at as string) || new Date().toISOString(),
  };
}

function mapCampaigns(r: unknown): Campaign[] {
  const obj = (r || {}) as { campaigns?: Array<Record<string, unknown>> };
  return (obj.campaigns || []).map((c) => ({
    id: String(c.id ?? ''),
    title: String(c.title ?? ''),
    cohortGoalText: String(c.cohortGoalText ?? ''),
    targetAmount: Number(c.targetAmount ?? 0),
    pooledAmount: Number(c.pooledAmount ?? 0),
    targetCount: Number(c.targetCount ?? 0),
    coveredCount: Number(c.coveredCount ?? 0),
    daysRemaining: Number(c.daysRemaining ?? 0),
    isClosed: Boolean(c.isClosed),
  }));
}

function mapPledges(r: unknown): Pledge[] {
  const obj = (r || {}) as { pledges?: Array<Record<string, unknown>> };
  return (obj.pledges || []).map((p) => ({
    id: String(p.id ?? ''),
    donorHash: (p.donorHash as string) || (p.donor_hash as string) || '',
    type: (p.type as Pledge['type']) || 'goods',
    description: String(p.description ?? ''),
    locality: String(p.locality ?? ''),
    maxValue: p.maxValue !== undefined ? Number(p.maxValue) : (p.max_value_pence ? Number(p.max_value_pence) / 100 : undefined),
    status: (p.status as Pledge['status']) || 'awaiting_match',
    linkedRequestId: (p.linked_request_id as string) || (p.linkedRequestId as string) || null,
    timestamp: (p.timestamp as string) || (p.created_at as string) || '',
  }));
}

function mapDonations(r: unknown): DonorContribution[] {
  const obj = (r || {}) as { donations?: Array<Record<string, unknown>> };
  return (obj.donations || []).map((d) => ({
    id: String(d.id ?? ''),
    amount: Number(d.amount_pence ?? 0) / 100,
    isAnonymous: Boolean(d.is_anonymous),
    optInLedger: Boolean(d.opt_in_ledger),
    timestamp: String(d.created_at ?? ''),
  }));
}

function mapVouchers(r: unknown): Voucher[] {
  const obj = (r || {}) as { vouchers?: Array<Record<string, unknown>> };
  return (obj.vouchers || []).map((v) => {
    const voucherId = String(v.voucher_id || v.id || '');
    const pin = (v.pin as string) || localStorage.getItem('mtc-voucher-pin-' + voucherId) || '';
    return {
      id: voucherId,
      partnerName: String(v.partner_name ?? ''),
      partnerType: (v.partner_type as Voucher['partnerType']) || 'retailer',
      description: String(v.description ?? ''),
      maxValue: Number(v.max_value_pence ?? 0) / 100,
      status: (v.status as Voucher['status']) || 'active',
      issuedToken: String(v.issued_token ?? ''),
      pin: pin || '****',
      expiresAt: String(v.expires_at ?? ''),
    };
  });
}

function mapRedemptions(r: unknown): VoucherRedemption[] {
  const obj = (r || {}) as { redemptions?: Array<Record<string, unknown>> };
  return (obj.redemptions || []).map((x) => ({
    id: String(x.id ?? ''),
    voucherId: String(x.voucherId ?? ''),
    pin: '',
    amount: Number(x.amount_pence ?? 0) / 100,
    partnerName: String(x.partnerName ?? ''),
    timestamp: String(x.timestamp ?? ''),
    status: (x.status as VoucherRedemption['status']) || 'success',
  }));
}

function mapFlags(r: unknown): RiskFlag[] {
  const obj = (r || {}) as { flags?: Array<Record<string, unknown>> };
  return (obj.flags || []).map((f) => ({
    id: String(f.id ?? ''),
    targetHash: (f.target_hash as string) || (f.targetHash as string) || '',
    severity: (f.severity as RiskFlag['severity']) || 'routine',
    title: String(f.title ?? ''),
    description: String(f.description ?? ''),
    status: (f.status as RiskFlag['status']) || 'pending',
    timestamp: (f.created_at as string) || (f.timestamp as string) || '',
    investigationNotes: f.investigation_notes as string | undefined,
  }));
}

function mapAuditLog(r: unknown): AuditLogEntry[] {
  const obj = (r || {}) as { entries?: Array<Record<string, unknown>> };
  return (obj.entries || []).map((e) => ({
    id: String(e.id ?? ''),
    timestamp: (e.created_at as string) || (e.timestamp as string) || '',
    actorRole: ((e.actor_role || e.actorRole) as AuditLogEntry['actorRole']),
    action: String(e.action ?? ''),
    targetHash: (e.target_hash as string) || (e.targetHash as string) || '',
  }));
}

function mapMatchInterests(r: unknown): MatchInterest[] {
  const obj = (r || {}) as { interests?: Array<Record<string, unknown>> };
  return (obj.interests || []).map((m) => ({
    id: String(m.id ?? ''),
    opportunityId: String(m.opportunityId ?? ''),
    title: String(m.title ?? ''),
    tokenHash: String(m.tokenHash ?? ''),
    timestamp: String(m.timestamp ?? ''),
    status: (m.status as MatchInterest['status']) || 'pending',
  }));
}

function mapDedup(r: unknown): DedupItem[] {
  const obj = (r || {}) as { items?: Array<Record<string, unknown>> };
  return (obj.items || []).map((d) => ({
    id: String(d.id ?? ''),
    hashedObjectId: String(d.hashedObjectId ?? ''),
    objectType: String(d.objectType ?? ''),
    firstFundedBy: String(d.firstFundedBy ?? ''),
    firstFundedDate: String(d.firstFundedDate ?? ''),
    duplicateAttemptDate: String(d.duplicateAttemptDate ?? ''),
    status: (d.status as DedupItem['status']) || 'under_review',
  }));
}

function mapLockerStocks(r: unknown): LockerStock[] {
  const obj = (r || {}) as { stocks?: Array<Record<string, unknown>> };
  return (obj.stocks || []).map((s) => ({
    location: String(s.location ?? ''),
    bundleType: String(s.bundleType ?? ''),
    available: Number(s.available ?? 0),
    capacity: Number(s.capacity ?? 0),
    lowStockThreshold: Number(s.lowStockThreshold ?? 0),
  }));
}

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of [...a, ...b]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenHash, setTokenHash] = useState<string | null>(() => {
    try { return localStorage.getItem('mtc-token'); } catch { return null; }
  });
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [emptyQueueMode, setEmptyQueueMode] = useState(false);
  const [donorHash] = useState<string>(() => getOrCreateDonorHash());

  // Internal source-of-truth slices
  const [myRequests, setMyRequests] = useState<PoolRequest[]>([]);
  const [mySwaps, setMySwaps] = useState<SwapRequest[]>([]);
  const [queuePool, setQueuePool] = useState<PoolRequest[]>([]);
  const [queueSwap, setQueueSwap] = useState<SwapRequest[]>([]);
  const [myVouchersList, setMyVouchersList] = useState<Voucher[]>([]);
  const [staffVouchersList, setStaffVouchersList] = useState<Voucher[]>([]);
  const [myDonationsList, setMyDonationsList] = useState<DonorContribution[]>([]);
  const [myPledgesList, setMyPledgesList] = useState<Pledge[]>([]);
  const [staffPledgesList, setStaffPledgesList] = useState<Pledge[]>([]);

  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [dedupItems, setDedupItems] = useState<DedupItem[]>([]);
  const [lockerStocks, setLockerStocks] = useState<LockerStock[]>([]);
  const [depotCounts, setDepotCounts] = useState<DepotCounts>({ receivedUnits: 0, qualityCheckedUnits: 0, packedBundles: 0, loadedLockerUnits: 0 });
  const [voucherRedemptions, setVoucherRedemptions] = useState<VoucherRedemption[]>([]);
  const [matchInterests, setMatchInterests] = useState<MatchInterest[]>([]);

  const refetchAll = useCallback(async () => {
    // Campaigns (public)
    const c = await api.listCampaigns();
    if (c) setCampaigns(mapCampaigns(c));

    // Redemptions (public)
    const r = await api.listPartnerRedemptions();
    if (r) setVoucherRedemptions(mapRedemptions(r));

    // Requester data
    if (tokenHash) {
      const [reqs, vouchers, donations] = await Promise.all([
        api.listMyRequests(tokenHash),
        api.listMyVouchers(tokenHash),
        api.listMyDonations(donorHash),
      ]);
      if (reqs) {
        const mapped = (reqs.requests || []).map((x: Record<string, unknown>) =>
          (x.type as string) === 'swap' ? null : mapPoolFromBackend(x, tokenHash)
        ).filter(Boolean) as PoolRequest[];
        setMyRequests(mapped);
        const swaps = (reqs.requests || []).filter((x: Record<string, unknown>) => (x.type as string) === 'swap')
          .map((x: Record<string, unknown>) => mapSwapFromBackend(x, tokenHash));
        setMySwaps(swaps);
      }
      if (vouchers) setMyVouchersList(mapVouchers(vouchers));
      if (donations) setMyDonationsList(mapDonations(donations));
    } else {
      setMyRequests([]);
      setMySwaps([]);
      setMyVouchersList([]);
      setMyDonationsList([]);
    }

    // Donor pledges (uses donor identity, works even without requester token)
    const donorPledges = await api.listMyPledges(donorHash);
    if (donorPledges) setMyPledgesList(mapPledges(donorPledges));

    // Staff data
    if (sessionToken && staffRole) {
      const common = await Promise.all([
        api.getDepot(sessionToken),
        api.getLockerStock(sessionToken),
        api.getDedupItems(sessionToken),
      ]);
      if (common[0]) setDepotCounts(common[0]);
      if (common[1]) setLockerStocks(mapLockerStocks(common[1]));
      if (common[2]) setDedupItems(mapDedup(common[2]));

      if (staffRole === 'fulfilment') {
        const [q, pledges, interests, staffVouchers] = await Promise.all([
          api.fulfilmentQueue(sessionToken),
          api.listFulfilmentPledges(sessionToken),
          api.listMatchInterests(sessionToken),
          api.listAllVouchers(sessionToken),
        ]);
        if (q) {
          setQueuePool((q.pool || []).map((x: Record<string, unknown>) => mapPoolFromBackend(x, (x.token_hash as string) || '')));
          setQueueSwap((q.swap || []).map((x: Record<string, unknown>) => mapSwapFromBackend(x, (x.token_hash as string) || '')));
        }
        if (pledges) setStaffPledgesList(mapPledges(pledges));
        if (interests) setMatchInterests(mapMatchInterests(interests));
        if (staffVouchers) setStaffVouchersList(mapVouchers(staffVouchers));
      } else {
        setQueuePool([]);
        setQueueSwap([]);
        setStaffPledgesList([]);
        setStaffVouchersList([]);
      }

      if (staffRole === 'audit') {
        const [flags, log] = await Promise.all([
          api.auditFlags(sessionToken),
          api.auditLog(sessionToken),
        ]);
        if (flags) setRiskFlags(mapFlags(flags));
        if (log) setAuditLog(mapAuditLog(log));
      } else {
        setRiskFlags([]);
        setAuditLog([]);
      }
    } else {
      setQueuePool([]);
      setQueueSwap([]);
      setStaffPledgesList([]);
      setStaffVouchersList([]);
      setRiskFlags([]);
      setAuditLog([]);
      setDepotCounts({ receivedUnits: 0, qualityCheckedUnits: 0, packedBundles: 0, loadedLockerUnits: 0 });
      setLockerStocks([]);
      setDedupItems([]);
      setMatchInterests([]);
    }
  }, [tokenHash, sessionToken, staffRole, donorHash]);

  // Fetch on any session change
  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  // On any 401 from the backend, clear the session so the UI returns to intake
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setTokenHash(null);
      setSessionToken(null);
      setStaffRole(null);
      setStaffId(null);
      try { sessionStorage.removeItem('mtc-session-token'); } catch { /* session teardown: silent */ }
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // Restore staff session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('mtc-session-token');
    if (!stored) return;
    api.staffSession(stored).then(r => {
      if (r) {
        setSessionToken(stored);
        setStaffRole(r.role as StaffRole);
        setStaffId(r.staff_id);
      } else {
        sessionStorage.removeItem('mtc-session-token');
      }
    });
  }, []);

  // Union for demo (see file header)
  const poolRequests = useMemo(() => emptyQueueMode ? myRequests : mergeById(myRequests, queuePool), [myRequests, queuePool, emptyQueueMode]);
  const swapRequests = useMemo(() => emptyQueueMode ? mySwaps : mergeById(mySwaps, queueSwap), [mySwaps, queueSwap, emptyQueueMode]);
  const vouchers = useMemo(() => mergeById(myVouchersList, staffVouchersList), [myVouchersList, staffVouchersList]);
  const pledges = useMemo(() => mergeById(myPledgesList, staffPledgesList), [myPledgesList, staffPledgesList]);
  const donorContributions = myDonationsList;

  // --- Actions ---
  const initializeSession = async (phone: string, channel: 'web' | 'sms' | 'ussd' = 'web'): Promise<string> => {
    const r = await api.issueTokenStrict(phone);
    setTokenHash(r.token);
    try { localStorage.setItem('mtc-token', r.token); } catch (e) { console.error('[auth] token persist failed', e); }
    return r.token;
  };

  const logout = () => {
    setTokenHash(null);
    try { localStorage.removeItem('mtc-token'); } catch { /* logout: silent */ }
  };

  const loginStaff = async (role: StaffRole, id: string, pin: string): Promise<boolean> => {
    const r = await api.staffLogin(role, id, pin);
    if (!r) return false;
    try { sessionStorage.setItem('mtc-session-token', r.session_token); } catch (e) { console.error('[auth] session persist failed', e); }
    setSessionToken(r.session_token);
    setStaffRole(role);
    setStaffId(id.toUpperCase());
    return true;
  };

  const logoutStaff = async () => {
    if (sessionToken) await api.staffLogout(sessionToken);
    try { sessionStorage.removeItem('mtc-session-token'); } catch { /* session teardown: silent */ }
    setSessionToken(null);
    setStaffRole(null);
    setStaffId(null);
  };

  const executeSwap = async (category: string, location: string, tokenOverride?: string): Promise<SwapRequest | null> => {
    const t = tokenOverride || tokenHash;
    if (!t) return null;
    const r = await api.createSwapRequest(t, category, location);
    if (!r) return null;
    await refetchAll();
    return {
      id: r.id,
      tokenHash: t,
      bundleCategory: r.bundle_category || category,
      lockerLocation: r.locker_location || location,
      status: 'reserved',
      pin: ((r as Record<string, unknown>).pin as string) || '----',
      qrPayload: ((r as Record<string, unknown>).qr_payload as string) || '',
      timestamp: r.created_at,
    };
  };

  const executePool = async (category: PoolRequest['category'], objectId: string, amount: number, tokenOverride?: string): Promise<PoolRequest | null> => {
    const t = tokenOverride || tokenHash;
    if (!t) return null;
    const hashed = await generateHMAC(objectId);
    const pence = Math.round(amount * 100);
    const r = await api.createPoolRequest(t, category, hashed, pence);
    if (!r) return null;
    await refetchAll();
    return mapPoolFromBackend(r, t);
  };

  const withdrawRequest = (id: string, type: 'swap' | 'pool') => {
    if (!tokenHash) return;
    (async () => {
      await api.withdrawRequest(tokenHash, id);
      await refetchAll();
    })().catch(() => {});
  };

  const collectRequest = async (id: string, pin: string): Promise<boolean> => {
    if (!tokenHash) return false;
    const r = await api.collectSwap(tokenHash, id, pin);
    // refresh-on-fail: always refetch so stale history auto-corrects
    await refetchAll();
    return !!(r && r.status === 'collected');
  };

  const dispatchRequest = async (id: string, _type?: 'swap' | 'pool'): Promise<string | null> => {
    if (!sessionToken) return null;
    const r = await api.dispatchRequest(sessionToken, id);
    if (!r) return null;
    await refetchAll();
    return r.receipt;
  };

  const issueVoucher = async (requestId: string, partnerName: string, partnerType: 'retailer' | 'hospital'): Promise<Voucher | null> => {
    if (!sessionToken) return null;
    const r = await api.issueVoucher(sessionToken, requestId, partnerName, partnerType);
    if (!r) return null;
    try { localStorage.setItem('mtc-voucher-pin-' + r.voucher_id, r.pin); } catch (e) { console.error('[voucher] PIN persist failed', e); }
    await refetchAll();
    return {
      id: r.voucher_id,
      partnerName: r.partner_name,
      partnerType,
      description: '',
      maxValue: r.max_value_pence / 100,
      status: 'active',
      issuedToken: '',
      pin: r.pin,
      expiresAt: r.expires_at,
    };
  };

  const redeemVoucher = async (pin: string, amountPence: number, partnerName: string): Promise<{ ok: boolean; reason?: string }> => {
    const r = await api.redeemVoucher(pin, partnerName, amountPence);
    if (!r) return { ok: false, reason: 'Backend unavailable' };
    await refetchAll();
    return { ok: r.ok, reason: r.reason };
  };

  const completeOcrCheck = async (requestId: string): Promise<{ ok: boolean; reason?: string }> => {
    if (!sessionToken) return { ok: false, reason: 'Session expired' };
    const r = await api.completeOcr(sessionToken, requestId).catch(() => null);
    if (!r) return { ok: false, reason: 'Backend unreachable' };
    await refetchAll();
    return { ok: true };
  };

  const routeFlagToTier4 = async (flagId: string): Promise<{ ok: boolean; reason?: string }> => {
    if (!sessionToken) return { ok: false, reason: 'Session expired' };
    const r = await api.routeFlagToTier4(sessionToken, flagId).catch(() => null);
    if (!r) return { ok: false, reason: 'Backend unreachable' };
    await refetchAll();
    return { ok: true };
  };

  const clearFlagAsFalsePositive = async (flagId: string, note: string): Promise<{ ok: boolean; reason?: string }> => {
    if (!sessionToken) return { ok: false, reason: 'Session expired' };
    const r = await api.clearFlag(sessionToken, flagId, note).catch(() => null);
    if (!r) return { ok: false, reason: 'Backend unreachable' };
    await refetchAll();
    return { ok: true };
  };

  const matchPledge = async (pledgeId: string, requestId?: string): Promise<{ ok: boolean; reason?: string }> => {
    if (!sessionToken) return { ok: false, reason: 'Session expired' };
    const r = await api.matchPledge(sessionToken, pledgeId, requestId).catch(() => null);
    if (!r) return { ok: false, reason: 'Backend unreachable' };
    await refetchAll();
    return { ok: true };
  };

  const closeMatchInterest = async (id: string, status: 'contacted' | 'closed'): Promise<{ ok: boolean; reason?: string }> => {
    if (!sessionToken) return { ok: false, reason: 'Session expired' };
    const r = await api.closeMatchInterest(sessionToken, id, status).catch(() => null);
    if (!r) return { ok: false, reason: 'Backend unreachable' };
    await refetchAll();
    return { ok: true };
  };

  const expressInterest = (opportunityId: string, title: string) => {
    if (!tokenHash) return;
    (async () => { await api.expressMatchInterest(tokenHash, 'self', opportunityId, title); await refetchAll(); })().catch(() => {});
  };

  const addDonorContribution = (amount: number, isAnonymous: boolean, optInLedger: boolean) => {
    (async () => { await api.createDonation(donorHash, Math.round(amount * 100), isAnonymous, optInLedger); await refetchAll(); })().catch(() => {});
  };

  const addPledge = (type: 'goods' | 'service_credit', description: string, locality: string, maxValue?: number) => {
    (async () => {
      await api.createPledge(donorHash, type, description, locality, maxValue ? Math.round(maxValue * 100) : undefined);
      await refetchAll();
    })().catch(() => {});
  };

  // Backend logs privileged actions; frontend no-op for compatibility
  const downloadAuditCsv = async (): Promise<boolean> => {
    if (!sessionToken) return false;
    try {
      await api.downloadAuditCsv(sessionToken);
      return true;
    } catch (e) {
      console.error("[audit-download] failed", e);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      tokenHash, initializeSession, logout,
      staffRole, staffId, loginStaff, logoutStaff,
      swapRequests, poolRequests, riskFlags, campaigns, pledges, auditLog, dedupItems,
      lockerStocks, depotCounts, donorContributions, donorHash, vouchers, voucherRedemptions, matchInterests,
      emptyQueueMode, setEmptyQueueMode,
      executeSwap, executePool, withdrawRequest, dispatchRequest, collectRequest,
      issueVoucher, redeemVoucher, completeOcrCheck,
      routeFlagToTier4, clearFlagAsFalsePositive, matchPledge, closeMatchInterest, expressInterest,
      addDonorContribution, addPledge, downloadAuditCsv,
      refetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};