import React, { createContext, useContext, useState } from 'react';
import { generateHMAC } from '../lib/hash';
import {
  issueToken as apiIssueToken,
  createSwapRequest as apiCreateSwap,
  createPoolRequest as apiCreatePool,
  listMyRequests as apiListRequests,
  staffLogin as apiStaffLogin,
  staffLogout as apiStaffLogout,
  dispatchRequest as apiDispatch,
  completeOcr as apiCompleteOcr,
  issueVoucher as apiIssueVoucher,
  auditFlags as apiAuditFlags,
  routeFlagToTier4 as apiRouteFlag,
  clearFlag as apiClearFlag,
} from '../lib/apiClient';
import { reserveLockerSlot, verifyObjectLevel } from '../services/mockIntegrations';
import { verifyStaffCredentials, STAFF_CREDS, appendHistory } from '../services/auth';
import {
  PoolRequest, SwapRequest, RiskFlag, VerificationTier, Campaign, Pledge, AuditLogEntry,
  DedupItem, LockerStock, DepotCounts, DonorContribution, StaffRole, Voucher, VoucherRedemption,
} from '../types';

interface AppContextType {
  tokenHash: string | null;
  initializeSession: (phone: string, channel: 'web' | 'sms' | 'ussd') => Promise<void>;
  logout: () => void;

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
  vouchers: Voucher[];
  voucherRedemptions: VoucherRedemption[];
  matchInterests: MatchInterest[];
  closeMatchInterest: (id: string, status: 'contacted' | 'closed') => void;
  emptyQueueMode: boolean;
  setEmptyQueueMode: (v: boolean) => void;

  staffRole: StaffRole | null;
  staffId: string | null;
  loginStaff: (role: StaffRole, id: string, pin: string) => boolean;
  logoutStaff: () => void;

  executeSwap: (category: string, location: string, tokenOverride?: string) => Promise<SwapRequest | null>;
  executePool: (category: PoolRequest['category'], objectId: string, amount: number, tokenOverride?: string) => Promise<PoolRequest | null>;
  withdrawRequest: (id: string, type: 'swap' | 'pool') => void;
  dispatchRequest: (id: string, type: 'swap' | 'pool') => string;
  routeFlagToTier4: (flagId: string) => void;
  clearFlagAsFalsePositive: (flagId: string, note: string) => void;
  completeOcrCheck: (requestId: string) => void;
  matchPledge: (pledgeId: string) => void;
  redeemVoucher: (pin: string, amount: number, partnerName: string) => { ok: boolean; reason?: string };
  logAction: (role: StaffRole | 'system', action: string, targetHash: string) => void;
  issueVoucher: (requestId: string, partnerName: string, partnerType: 'retailer' | 'hospital') => Voucher | null;
  expressInterest: (opportunityId: string, title: string) => void;
  addDonorContribution: (amount: number, isAnonymous: boolean, optInLedger: boolean) => void;
  addPledge: (type: 'goods' | 'service_credit', description: string, locality: string, maxValue?: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [emptyQueueMode, setEmptyQueueMode] = useState(false);

  const [staffRole, setStaffRole] = useState<StaffRole | null>(() => {
    try { const r = sessionStorage.getItem('mtc-staff-role'); return r ? r as StaffRole : null; } catch { return null; }
  });
  const [staffId, setStaffId] = useState<string | null>(() => {
    try { return sessionStorage.getItem('mtc-staff-id'); } catch { return null; }
  });

  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([
    { id: 'SWP-1001', tokenHash: 'a4f8b29c...', bundleCategory: 'Standard Pantry', lockerLocation: 'Kibera Hub', status: 'reserved', pin: '4821', qrPayload: 'MTC-LK-KIB-171200', timestamp: '10 mins ago' },
    { id: 'SWP-1002', tokenHash: 'f91c3d4e...', bundleCategory: 'Hygiene Kit', lockerLocation: 'Mathare Central', status: 'reserved', pin: '7355', qrPayload: 'MTC-LK-MAT-171205', timestamp: '25 mins ago' },
  ]);

  const [poolRequests, setPoolRequests] = useState<PoolRequest[]>([
    { id: 'POOL-2001', tokenHash: 'a4f8b29c...', category: 'utility', hashedObjectId: 'obj #8f4cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', amount: 3500, tier: 2, status: 'verified', timestamp: '5 mins ago' },
    { id: 'POOL-2002', tokenHash: 'e11d8a2b...', category: 'hospital_invoice', hashedObjectId: 'obj #c9d2ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', amount: 12000, tier: 3, status: 'pending_check', timestamp: '15 mins ago' },
    { id: 'POOL-2003', tokenHash: 'b55a1f9c...', category: 'school_fee', hashedObjectId: 'obj #7a1eÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', amount: 8500, tier: 2, status: 'verified', timestamp: '30 mins ago' },
  ]);

  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([
    { id: 'FLG-101', targetHash: 'obj #c9d2ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', severity: 'high', title: 'Amount just under threshold', description: 'Request amount is KES 12,000, just below the KES 15,000 Tier 4 threshold.', status: 'pending', timestamp: '2 mins ago' },
    { id: 'FLG-102', targetHash: 'a4f8b29c...', severity: 'elevated', title: 'Device clustering detected', description: '3 tokens generated from same physical device in 24h.', status: 'pending', timestamp: '1 hr ago' },
  ]);

  const [campaigns] = useState<Campaign[]>([
    { id: 'CMP-1', title: 'Nairobi Term 2 Tuition', cohortGoalText: 'Cover tuition for 200 secondary students.', targetAmount: 3000000, pooledAmount: 1250000, targetCount: 200, coveredCount: 83, daysRemaining: 14 },
    { id: 'CMP-2', title: 'Kibera Pantry Bundles', cohortGoalText: 'Provide 500 standard pantry bundles.', targetAmount: 1500000, pooledAmount: 1500000, targetCount: 500, coveredCount: 500, daysRemaining: 0, isClosed: true },
    { id: 'CMP-3', title: 'Utility Relief Fund', cohortGoalText: 'Cover 300 KPLC bills across Nairobi.', targetAmount: 1200000, pooledAmount: 340000, targetCount: 300, coveredCount: 85, daysRemaining: 27 },
  ]);

  const [pledges, setPledges] = useState<Pledge[]>([
    { id: 'PLG-9001', donorHash: 'donor_a1b2c3', type: 'service_credit', description: 'Electricity bill up to KES 5,000', locality: 'Nairobi County', maxValue: 5000, status: 'awaiting_match', timestamp: '1 hr ago' },
    { id: 'PLG-9002', donorHash: 'donor_x9y8z7', type: 'goods', description: '20 blankets (new)', locality: 'Mombasa County', status: 'awaiting_match', timestamp: '3 hrs ago' },
  ]);
  const [donorContributions, setDonorContributions] = useState<DonorContribution[]>([]);

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
    { id: 'LOG-001', timestamp: '10:42:11', actorRole: 'fulfilment', action: 'Dispatched POOL-2001 to payment partner', targetHash: 'obj #8f4cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' },
    { id: 'LOG-002', timestamp: '10:38:04', actorRole: 'audit', action: 'Routed FLG-101 to Tier 4 review', targetHash: 'obj #c9d2ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' },
    { id: 'LOG-003', timestamp: '10:15:33', actorRole: 'enrolment', action: 'Weekly salt rotated (SHA256-WK43)', targetHash: 'system' },
    { id: 'LOG-004', timestamp: '09:52:18', actorRole: 'audit', action: 'Cleared FLG-097 as false positive', targetHash: 'obj #3a8eÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' },
  ]);

  const [dedupItems] = useState<DedupItem[]>([
    { id: 'DEDUP-1', hashedObjectId: 'obj #8f4cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', objectType: 'KPLC meter', firstFundedBy: 'Partner A', firstFundedDate: '2024-04-12', duplicateAttemptDate: '2024-04-18', status: 'blocked' },
    { id: 'DEDUP-2', hashedObjectId: 'obj #7a1eÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', objectType: 'School admission', firstFundedBy: 'Cohort CMP-1', firstFundedDate: '2024-03-02', duplicateAttemptDate: '2024-04-20', status: 'blocked' },
    { id: 'DEDUP-3', hashedObjectId: 'obj #d3b1ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', objectType: 'Hospital invoice', firstFundedBy: 'Partner B', firstFundedDate: '2024-04-10', duplicateAttemptDate: '2024-04-15', status: 'under_review' },
  ]);

  const [lockerStocks] = useState<LockerStock[]>([
    { location: 'Kibera Hub', bundleType: 'Standard Pantry', available: 12, capacity: 40, lowStockThreshold: 5 },
    { location: 'Kibera Hub', bundleType: 'Hygiene Kit', available: 3, capacity: 30, lowStockThreshold: 5 },
    { location: 'Mathare Central', bundleType: 'Standard Pantry', available: 18, capacity: 40, lowStockThreshold: 5 },
    { location: 'Mathare Central', bundleType: 'Hygiene Kit', available: 9, capacity: 30, lowStockThreshold: 5 },
    { location: 'Kawangware Station', bundleType: 'Standard Pantry', available: 4, capacity: 40, lowStockThreshold: 5 },
    { location: 'Kawangware Station', bundleType: 'Hygiene Kit', available: 15, capacity: 30, lowStockThreshold: 5 },
  ]);

  const [depotCounts] = useState<DepotCounts>({ receivedUnits: 2400, qualityCheckedUnits: 2328, packedBundles: 582, loadedLockerUnits: 61 });

  const [vouchers, setVouchers] = useState<Voucher[]>([
    { id: 'VCH-1', partnerName: 'Naivas Kibera', partnerType: 'retailer', description: 'Food & hygiene staples', maxValue: 4000, status: 'active', issuedToken: 'a4f8b29c...', pin: '8842', expiresAt: '2026-12-31' },
    { id: 'VCH-2', partnerName: 'Kenyatta Hospital', partnerType: 'hospital', description: 'Invoice settlement', maxValue: 8000, status: 'active', issuedToken: 'e11d8a2b...', pin: '2177', expiresAt: '2026-12-31' },
    { id: 'VCH-3', partnerName: 'Naivas Kibera', partnerType: 'retailer', description: 'Food & hygiene staples', maxValue: 2500, status: 'redeemed', issuedToken: 'b55a1f9c...', pin: '4409', expiresAt: '2026-12-31' },
  ]);
  const [voucherRedemptions, setVoucherRedemptions] = useState<VoucherRedemption[]>([]);
  const [matchInterests, setMatchInterests] = useState<MatchInterest[]>([]);

  const initializeSession = async (phone: string, channel: 'web' | 'sms' | 'ussd') => {
    // Try backend first ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â the real HMAC lives there, not in the browser
    const backendResp = await apiIssueToken(phone);
    if (backendResp?.token) {
      setTokenHash(backendResp.token);
      return;
    }
    // Fallback: client-side HMAC (deployed build without a backend)
    const hash = await generateHMAC(phone);
    setTokenHash(hash);
  };
  const logout = () => setTokenHash(null);

  const logAction = (role: StaffRole | 'system', action: string, targetHash: string) => {
    setAuditLog(log => [{ id: 'LOG-' + Date.now(), timestamp: new Date().toLocaleTimeString(), actorRole: role, action, targetHash }, ...log]);
  };

  const loginStaff = (role: StaffRole, id: string, pin: string): boolean => {
    const ok = verifyStaffCredentials(role, id, pin);
    if (ok) {
      setStaffRole(role);
      setStaffId(STAFF_CREDS[role as 'enrolment' | 'fulfilment' | 'audit'].id);
      try { sessionStorage.setItem('mtc-staff-role', role); sessionStorage.setItem('mtc-staff-id', STAFF_CREDS[role as 'enrolment' | 'fulfilment' | 'audit'].id); } catch {}
      logAction(role, `Logged in as ${STAFF_CREDS[role as 'enrolment' | 'fulfilment' | 'audit'].label}`, 'system');
    }
    return ok;
  };

  const logoutStaff = () => {
    if (staffRole) logAction(staffRole, `Logged out`, 'system');
    try { sessionStorage.removeItem('mtc-staff-role'); sessionStorage.removeItem('mtc-staff-id'); } catch {}
    setStaffRole(null);
    setStaffId(null);
  };

  const executeSwap = async (category: string, location: string, tokenOverride?: string): Promise<SwapRequest | null> => {
    const token = tokenOverride || tokenHash;
    if (!token) return null;

    // Try backend
    const backendResp = await apiCreateSwap(token, category, location);
    if (backendResp) {
      const { pin, qr } = await reserveLockerSlot(location);
      const newReq: SwapRequest = {
        id: backendResp.id, tokenHash: token, bundleCategory: category, lockerLocation: location,
        status: 'reserved', pin, qrPayload: qr, timestamp: backendResp.created_at,
      };
      setSwapRequests(prev => [newReq, ...prev]);
      appendHistory(token, { ...newReq, type: 'swap' });
      return newReq;
    }

    // Fallback
    const { pin, qr } = await reserveLockerSlot(location);
    const newReq: SwapRequest = { id: `SWP-${Date.now()}`, tokenHash: token, bundleCategory: category, lockerLocation: location, status: 'reserved', pin, qrPayload: qr, timestamp: new Date().toLocaleString() };
    setSwapRequests(prev => [newReq, ...prev]);
    appendHistory(token, { ...newReq, type: 'swap' });
    return newReq;
  };

  const executePool = async (category: PoolRequest['category'], objectId: string, amount: number, tokenOverride?: string): Promise<PoolRequest | null> => {
    const token = tokenOverride || tokenHash;
    if (!token) return null;
    const hashedObj = await generateHMAC(objectId);
    const tier: VerificationTier = amount > 5000 ? 3 : 2;
    const check = await verifyObjectLevel(objectId, amount);
    if (!check.isValid) return null;
    const newReq: PoolRequest = { id: `POOL-${Date.now()}`, tokenHash: token, category, hashedObjectId: `obj #${hashedObj.slice(0, 4)}ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦`, amount, tier, status: check.requiresOcr ? 'pending_check' : 'verified', timestamp: new Date().toLocaleString() };
    setPoolRequests(prev => [newReq, ...prev]);
    appendHistory(token, { ...newReq, type: 'pool' });
    return newReq;
  };

  const withdrawRequest = (id: string, type: 'swap' | 'pool') => {
    if (type === 'swap') {
      setSwapRequests(prev => prev.map(r => r.id === id && r.status === 'reserved' ? { ...r, status: 'withdrawn' } : r));
    } else {
      setPoolRequests(prev => prev.map(r => r.id === id && (r.status === 'verified' || r.status === 'pending_check') ? { ...r, status: 'withdrawn' } : r));
    }
    logAction('system', `Requester withdrew ${id}`, id);
  };

  const dispatchRequest = (id: string, type: 'swap' | 'pool'): string => {
    if (type === 'pool') {
      const req = poolRequests.find(r => r.id === id);
      if (!req || req.status !== 'verified') return '';
      const receipt = 'MPESA-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      setPoolRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'submitted_to_partner' } : r));
      logAction('fulfilment', `Dispatched ${id} (${receipt})`, req.hashedObjectId);
      return receipt;
    }
    setSwapRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'collected' } : r));
    return '';
  };

  const routeFlagToTier4 = (flagId: string) => {
    setRiskFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: 'routed_tier4' } : f));
    logAction('audit', `Routed ${flagId} to Tier 4`, 'obj #c9d2ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦');
  };

  const clearFlagAsFalsePositive = (flagId: string, note: string) => {
    setRiskFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: 'cleared_false_positive', investigationNotes: note } : f));
    logAction('audit', `Cleared ${flagId} as false positive`, 'obj #8f4cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦');
  };

  const completeOcrCheck = (requestId: string) => {
    const req = poolRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending_check') return;
    setPoolRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'verified' } : r));
    logAction('audit', `Completed OCR check for ${requestId}`, req.hashedObjectId);
  };

  const matchPledge = (pledgeId: string) => {
    setPledges(prev => prev.map(p => p.id === pledgeId && p.status === 'awaiting_match' ? { ...p, status: 'matched' } : p));
    logAction('fulfilment', `Matched pledge ${pledgeId} to cohort`, 'pledge');
  };

  const redeemVoucher = (pin: string, amount: number, partnerName: string): { ok: boolean; reason?: string } => {
    const v = vouchers.find(x => x.pin === pin && x.partnerName === partnerName);
    if (!v) {
      setVoucherRedemptions(prev => [{ id: 'VR-' + Date.now(), voucherId: 'unknown', pin, amount, partnerName, timestamp: new Date().toLocaleTimeString(), status: 'invalid' }, ...prev]);
      return { ok: false, reason: 'PIN does not match any active voucher at this partner.' };
    }
    if (v.status === 'redeemed') {
      setVoucherRedemptions(prev => [{ id: 'VR-' + Date.now(), voucherId: v.id, pin, amount, partnerName, timestamp: new Date().toLocaleTimeString(), status: 'already_redeemed' }, ...prev]);
      return { ok: false, reason: 'This voucher has already been redeemed.' };
    }
    if (new Date(v.expiresAt) < new Date()) {
      setVoucherRedemptions(prev => [{ id: 'VR-' + Date.now(), voucherId: v.id, pin, amount, partnerName, timestamp: new Date().toLocaleTimeString(), status: 'expired' }, ...prev]);
      return { ok: false, reason: 'Voucher has expired.' };
    }
    if (amount > v.maxValue) {
      setVoucherRedemptions(prev => [{ id: 'VR-' + Date.now(), voucherId: v.id, pin, amount, partnerName, timestamp: new Date().toLocaleTimeString(), status: 'invalid' }, ...prev]);
      return { ok: false, reason: `Amount exceeds voucher limit of KES ${v.maxValue.toLocaleString()}.` };
    }
    setVoucherRedemptions(prev => [{ id: 'VR-' + Date.now(), voucherId: v.id, pin, amount, partnerName, timestamp: new Date().toLocaleTimeString(), status: 'success' }, ...prev]);
    logAction('system', `Voucher ${v.id} redeemed at ${partnerName} (KES ${amount})`, v.issuedToken);
    return { ok: true };
  };

  const addDonorContribution = (amount: number, isAnonymous: boolean, optInLedger: boolean) => {
    setDonorContributions(prev => [{ id: 'CONT-' + Date.now(), amount, isAnonymous, optInLedger, timestamp: new Date().toLocaleString() }, ...prev]);
  };

  const addPledge = (type: 'goods' | 'service_credit', description: string, locality: string, maxValue?: number) => {
    setPledges(prev => [{ id: `PLG-${Date.now()}`, donorHash: `donor_${Math.random().toString(36).substring(2, 8)}`, type, description, locality, maxValue, status: 'awaiting_match', timestamp: new Date().toISOString() }, ...prev]);
  };

  
  const issueVoucher = (requestId: string, partnerName: string, partnerType: 'retailer' | 'hospital'): Voucher | null => {
    const req = poolRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'verified') return null;
    const newVoucher: Voucher = {
      id: 'VCH-' + Date.now(),
      partnerName,
      partnerType,
      description: `${req.category.replace('_', ' ')} settlement`,
      maxValue: req.amount,
      status: 'active',
      issuedToken: req.tokenHash,
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setVouchers(prev => [newVoucher, ...prev]);
    setPoolRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'voucher_issued' as any } : r));
    logAction('fulfilment', `Issued voucher ${newVoucher.id} at ${partnerName} (KES ${req.amount})`, req.hashedObjectId);
    return newVoucher;
  };

  const expressInterest = (opportunityId: string, title: string) => {
    const interest: MatchInterest = {
      id: 'MI-' + Date.now(),
      opportunityId,
      title,
      tokenHash: tokenHash || 'unknown',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMatchInterests(prev => [interest, ...prev]);
  };

  const closeMatchInterest = (id: string, status: 'contacted' | 'closed') => {
    setMatchInterests(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };
  return (
    <AppContext.Provider value={{
      tokenHash, initializeSession, logout,
      swapRequests, poolRequests, riskFlags, campaigns, pledges, auditLog, dedupItems, lockerStocks, depotCounts, donorContributions, vouchers, voucherRedemptions,
      emptyQueueMode, setEmptyQueueMode,
      staffRole, staffId, loginStaff, logoutStaff,
      executeSwap, executePool, withdrawRequest, dispatchRequest, routeFlagToTier4, clearFlagAsFalsePositive, completeOcrCheck, matchPledge, redeemVoucher, logAction,
      addDonorContribution, addPledge, issueVoucher, expressInterest, matchInterests, closeMatchInterest,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};


