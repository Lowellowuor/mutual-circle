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
  logAction: (role: StaffRole | 'system', action: string, targetHash: string) => void;

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
function mapSwapFromBackend(r: any, tokenHash: string): SwapRequest {
  const meta = r.metadata || {};
  return {
    id: r.id,
    tokenHash,
    bundleCategory: meta.bundle || r.category || 'Standard Pantry',
    lockerLocation: meta.location || '',
    status: (r.status === 'verified' ? 'reserved' : r.status) as SwapRequest['status'],
    pin: meta.pin || r.pin || '----',
    qrPayload: meta.qr || r.qr_payload || '',
    timestamp: r.created_at || new Date().toISOString(),
  };
}

function mapPoolFromBackend(r: any, tokenHash: string): PoolRequest {
  return {
    id: r.id,
    tokenHash,
    category: r.category,
    hashedObjectId: r.hashed_object_id || (r.metadata && r.metadata.object_hash) || '',
    amount: (r.amount_pence || 0) / 100,
    tier: r.tier,
    status: r.status,
    timestamp: r.created_at || new Date().toISOString(),
  };
}

function mapCampaigns(r: any): Campaign[] {
  return (r?.campaigns || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    cohortGoalText: c.cohortGoalText,
    targetAmount: c.targetAmount,
    pooledAmount: c.pooledAmount,
    targetCount: c.targetCount,
    coveredCount: c.coveredCount,
    daysRemaining: c.daysRemaining,
    isClosed: c.isClosed,
  }));
}

function mapPledges(r: any): Pledge[] {
  return (r?.pledges || []).map((p: any) => ({
    id: p.id,
    donorHash: p.donorHash || p.donor_hash || '',
    type: p.type,
    description: p.description,
    locality: p.locality,
    maxValue: p.maxValue !== undefined ? p.maxValue : (p.max_value_pence ? p.max_value_pence / 100 : undefined),
    status: p.status,
    timestamp: p.timestamp || p.created_at,
  }));
}

function mapDonations(r: any): DonorContribution[] {
  return (r?.donations || []).map((d: any) => ({
    id: d.id,
    amount: (d.amount_pence || 0) / 100,
    isAnonymous: d.is_anonymous,
    optInLedger: d.opt_in_ledger,
    timestamp: d.created_at,
  }));
}

function mapVouchers(r: any): Voucher[] {
  return (r?.vouchers || []).map((v: any) => {
    const pin = v.pin || localStorage.getItem('mtc-voucher-pin-' + v.voucher_id) || '';
    return {
      id: v.voucher_id || v.id,
      partnerName: v.partner_name,
      partnerType: v.partner_type,
      description: v.description,
      maxValue: (v.max_value_pence || 0) / 100,
      status: v.status,
      issuedToken: v.issued_token || '',
      pin: pin || '****',
      expiresAt: v.expires_at,
    };
  });
}

function mapRedemptions(r: any): VoucherRedemption[] {
  return (r?.redemptions || []).map((x: any) => ({
    id: x.id,
    voucherId: x.voucherId,
    pin: '',
    amount: (x.amount_pence || 0) / 100,
    partnerName: x.partnerName,
    timestamp: x.timestamp,
    status: x.status,
  }));
}

function mapFlags(r: any): RiskFlag[] {
  return (r?.flags || []).map((f: any) => ({
    id: f.id,
    targetHash: f.target_hash || f.targetHash || '',
    severity: f.severity,
    title: f.title,
    description: f.description,
    status: f.status,
    timestamp: f.created_at || f.timestamp,
    investigationNotes: f.investigation_notes,
  }));
}

function mapAuditLog(r: any): AuditLogEntry[] {
  return (r?.entries || []).map((e: any) => ({
    id: e.id,
    timestamp: e.created_at || e.timestamp,
    actorRole: e.actor_role || e.actorRole,
    action: e.action,
    targetHash: e.target_hash || e.targetHash,
  }));
}

function mapMatchInterests(r: any): MatchInterest[] {
  return (r?.interests || []).map((m: any) => ({
    id: m.id,
    opportunityId: m.opportunityId,
    title: m.title,
    tokenHash: m.tokenHash,
    timestamp: m.timestamp,
    status: m.status,
  }));
}

function mapDedup(r: any): DedupItem[] {
  return (r?.items || []).map((d: any) => ({
    id: d.id,
    hashedObjectId: d.hashedObjectId,
    objectType: d.objectType,
    firstFundedBy: d.firstFundedBy,
    firstFundedDate: d.firstFundedDate,
    duplicateAttemptDate: d.duplicateAttemptDate,
    status: d.status,
  }));
}

function mapLockerStocks(r: any): LockerStock[] {
  return (r?.stocks || []).map((s: any) => ({
    location: s.location,
    bundleType: s.bundleType,
    available: s.available,
    capacity: s.capacity,
    lowStockThreshold: s.lowStockThreshold,
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
  const [tokenHash, setTokenHash] = useState<string | null>(null);
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
        const mapped = (reqs.requests || []).map((x: any) =>
          x.type === 'swap' ? null : mapPoolFromBackend(x, tokenHash)
        ).filter(Boolean) as PoolRequest[];
        setMyRequests(mapped);
        const swaps = (reqs.requests || []).filter((x: any) => x.type === 'swap')
          .map((x: any) => mapSwapFromBackend(x, tokenHash));
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
          setQueuePool((q.pool || []).map((x: any) => mapPoolFromBackend(x, x.token_hash || '')));
          setQueueSwap((q.swap || []).map((x: any) => mapSwapFromBackend(x, x.token_hash || '')));
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
      try { sessionStorage.removeItem('mtc-session-token'); } catch {}
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
    return r.token;
  };

  const logout = () => setTokenHash(null);

  const loginStaff = async (role: StaffRole, id: string, pin: string): Promise<boolean> => {
    const r = await api.staffLogin(role, id, pin);
    if (!r) return false;
    try { sessionStorage.setItem('mtc-session-token', r.session_token); } catch {}
    setSessionToken(r.session_token);
    setStaffRole(role);
    setStaffId(id.toUpperCase());
    return true;
  };

  const logoutStaff = async () => {
    if (sessionToken) await api.staffLogout(sessionToken);
    try { sessionStorage.removeItem('mtc-session-token'); } catch {}
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
      pin: (r as any).pin || '----',
      qrPayload: (r as any).qr_payload || '',
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
    try { localStorage.setItem('mtc-voucher-pin-' + r.voucher_id, r.pin); } catch {}
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

  const completeOcrCheck = (requestId: string) => {
    if (!sessionToken) return;
    (async () => { await api.completeOcr(sessionToken, requestId); await refetchAll(); })().catch(() => {});
  };

  const routeFlagToTier4 = (flagId: string) => {
    if (!sessionToken) return;
    (async () => { await api.routeFlagToTier4(sessionToken, flagId); await refetchAll(); })().catch(() => {});
  };

  const clearFlagAsFalsePositive = (flagId: string, note: string) => {
    if (!sessionToken) return;
    (async () => { await api.clearFlag(sessionToken, flagId, note); await refetchAll(); })().catch(() => {});
  };

  const matchPledge = (pledgeId: string) => {
    if (!sessionToken) return;
    (async () => { await api.matchPledge(sessionToken, pledgeId); await refetchAll(); })().catch(() => {});
  };

  const closeMatchInterest = (id: string, status: 'contacted' | 'closed') => {
    if (!sessionToken) return;
    (async () => { await api.closeMatchInterest(sessionToken, id, status); await refetchAll(); })().catch(() => {});
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
  const logAction = (_role: StaffRole | 'system', _action: string, _targetHash: string) => {};

  return (
    <AppContext.Provider value={{
      tokenHash, initializeSession, logout,
      staffRole, staffId, loginStaff, logoutStaff,
      swapRequests, poolRequests, riskFlags, campaigns, pledges, auditLog, dedupItems,
      lockerStocks, depotCounts, donorContributions, donorHash, vouchers, voucherRedemptions, matchInterests,
      emptyQueueMode, setEmptyQueueMode,
      executeSwap, executePool, withdrawRequest, dispatchRequest,
      issueVoucher, redeemVoucher, completeOcrCheck,
      routeFlagToTier4, clearFlagAsFalsePositive, matchPledge, closeMatchInterest, expressInterest,
      addDonorContribution, addPledge, logAction,
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