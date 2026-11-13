import React, { useState, useEffect } from 'react';
import { ConsoleBills } from './ConsoleBills';
import { useApp } from '../../context/AppContext';
import { STAFF_CREDS } from '../../services/auth';
import { DetailModal } from './DetailModal';
import EvidenceCard from './EvidenceCard';
import {
  ShieldCheck, ShieldAlert, CheckCircle, Send, AlertTriangle, Users, Activity,
  Download, X, Layers, Boxes, Package, Truck, Check, Eye, EyeOff, RotateCcw,
  LogIn, Receipt, LogOut, Store, KeyRound, Lock, Building2, RefreshCw, Zap, ChevronRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AppBottomNav } from '../layout/AppBottomNav';
import { ConsoleQueue } from './ConsoleQueue';
import { SkeletonList } from '../Shared/Skeleton';
import { useToast } from '../Shared/Toast';
import { EmptyState } from '../Shared/EmptyState';
import { approveEvidence, confirmPartnerRequest, downloadPartnerStatement, fetchEvidencePhoto, getPartnerMe, getPartnerRedemptions, listEvidenceQueue, rejectEvidence } from '../../lib/apiClient';

import type { Role, Tab, AuditSub, Filter } from './types';
import ConsoleEnrolment from './ConsoleEnrolment';
import ConsoleDepot from './ConsoleDepot';

export const ConsoleView: React.FC = () => {
  const {
    swapRequests, poolRequests, riskFlags, auditLog, dedupItems, lockerStocks, depotCounts, pledges,
    vouchers, voucherRedemptions, staffRole, staffId, loginStaff, logoutStaff, downloadAuditCsv,
    issueVoucher, matchInterests, closeMatchInterest,
    dispatchRequest, routeFlagToTier4, clearFlagAsFalsePositive, completeOcrCheck, matchPledge, redeemVoucher,
    emptyQueueMode, setEmptyQueueMode,
  } = useApp();

  const { push } = useToast();

  const [loginRole, setLoginRole] = useState<Role>('fulfilment');
  const [loginId, setLoginId] = useState(STAFF_CREDS[loginRole].id);
  const [loginPin, setLoginPin] = useState(STAFF_CREDS[loginRole].pin);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('queue');
  const [moreTab, setMoreTab] = useState<'menu' | 'matrix' | 'tiers' | 'server' | 'spec'>('menu');
  const [auditSub, setAuditSub] = useState<AuditSub>('flags');
  const sessionToken = sessionStorage.getItem('mtc-session-token') || '';
  const [evidenceQueue, setEvidenceQueue] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [exportModal, setExportModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [fpNote, setFpNote] = useState('Shared-meter households verified as sharing a single prepaid meter.');
  const [showRaw, setShowRaw] = useState(false);

  const [tillPin, setTillPin] = useState('');
  const [tillAmount, setTillAmount] = useState('');
  const [tillPartner, setTillPartner] = useState('Naivas Kibera');
  const [tillResult, setTillResult] = useState<{ ok: boolean; reason?: string } | null>(null);

  const [matchingPledge, setMatchingPledge] = useState<{ id: string; description: string; locality: string; type: string } | null>(null);
  const [issueModal, setIssueModal] = useState<{ requestId: string; amount: number } | null>(null);
  const [issuePartner, setIssuePartner] = useState<'Naivas Kibera' | 'Kenyatta Hospital'>('Naivas Kibera');
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  const [selectedPartner, setSelectedPartner] = useState('chui-demo-key-2026');
  const [partnerInfo, setPartnerInfo] = useState<{ id: string; name: string; type: string } | null>(null);
  const [partnerRedemptions, setPartnerRedemptions] = useState<any[]>([]);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [confirmingPartner, setConfirmingPartner] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'pool' | 'swap' | 'flag' | 'dedup' | 'pledge' | 'match' | 'voucher'; item: any } | null>(null);
  const [partnerDownloading, setPartnerDownloading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIssueModal(null);
        setExportModal(false);
        setTillResult(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (tab !== 'partners') return;

    // Demo partner keys have no real session — skip the fetch entirely
    // so we do not spam the console with 401s and can render an
    // honest "not available in demo" empty state.
    if (selectedPartner.includes('demo-key')) {
      setPartnerInfo(null);
      setPartnerRedemptions([]);
      setPartnerLoading(false);
      return;
    }
    let cancelled = false;
    setPartnerLoading(true);
    (async () => {
      try {
        const me = await getPartnerMe(selectedPartner);
        if (!cancelled && me && typeof me === 'object' && 'name' in me) {
          setPartnerInfo(me);
        } else if (!cancelled) {
          setPartnerInfo(null);
        }

        const red = await getPartnerRedemptions(selectedPartner);
        if (!cancelled && red && typeof red === 'object' && 'redemptions' in red) {
          setPartnerRedemptions(red.redemptions || []);
        } else if (!cancelled) {
          setPartnerRedemptions([]);
        }
      } catch (err) {
        console.warn('[partners] fetch failed:', err);
        if (!cancelled) {
          setPartnerInfo(null);
          setPartnerRedemptions([]);
        }
      } finally {
        if (!cancelled) setPartnerLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPartner, tab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const ok = await loginStaff(loginRole, loginId, loginPin);
    if (!ok) { setLoginError('Invalid ID or PIN for this role.'); setLoginPin(''); return; }
    setLoginId(STAFF_CREDS[loginRole].id); setLoginPin(STAFF_CREDS[loginRole].pin); setTab('queue'); setAuditSub('flags'); setReceipt(null);
  };


  const refetchEvidenceQueue = async () => {
    if (!sessionToken) return;
    const r = await listEvidenceQueue(sessionToken);
    if (r) setEvidenceQueue(r.requests);
  };

  React.useEffect(() => {
    if (auditSub !== 'evidence') return;
    void refetchEvidenceQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditSub, sessionToken]);

  if (!staffRole) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center w-full animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-pine text-white rounded-2xl flex items-center justify-center mx-auto shadow-soft mb-4 rotate-3">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Operations Console</h1>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Restricted access</p>
            <p className="text-sm text-muted leading-relaxed max-w-[280px] mx-auto">
              Each role has separate credentials. No role can switch without logging out.
            </p>
          </div>

          <Card className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(['enrolment', 'fulfilment', 'audit'] as Role[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setLoginRole(r); setLoginId(STAFF_CREDS[r].id); setLoginPin(STAFF_CREDS[r].pin); setLoginError(null); }}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                        loginRole === r ? 'bg-pine text-white border-pine shadow-soft' : 'bg-surface text-muted border-tile hover:bg-tint'
                      }`}
                    >
                      {STAFF_CREDS[r].label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Staff ID</label>
                <input
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  placeholder="Auto-filled"
                  autoFocus
                  className="w-full bg-canvas border border-tile rounded-xl px-3 py-2.5 text-sm mt-2 focus:ring-2 focus:ring-pine outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">PIN</label>
                <input
                  type="password"
                  value={loginPin}
                  onChange={e => setLoginPin(e.target.value)}
                  placeholder="Auto-filled"
                  maxLength={4}
                  className="w-full bg-canvas border border-tile rounded-xl px-3 py-2.5 text-sm tracking-widest mt-2 focus:ring-2 focus:ring-pine outline-none"
                />
              </div>
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">{loginError}</div>
              )}
              <Button type="submit" variant="primary" fullWidth disabled={!loginId || !loginPin}>
                <LogIn className="w-4 h-4 mr-2" /> Log in
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-muted leading-relaxed px-4">
            R.U.T.H 4.8: separation enforced by architecture, not by policy.
          </p>
        </div>
      </div>
    );
  }

  const roleLabel: Record<Role, string> = { enrolment: 'Enrolment', fulfilment: 'Fulfilment', audit: 'Audit / T4' };
  const filteredPool = emptyQueueMode ? [] : poolRequests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'verified' || r.status === 'pending_check';
    if (filter === 'dispatched') return r.status === 'submitted_to_partner' || r.status === 'voucher_issued';
    if (filter === 'swap') return false;
    return true;
  });
  const filteredSwap = emptyQueueMode ? [] : swapRequests.filter(r => {
    if (filter === 'all' || filter === 'swap') return true;
    if (filter === 'pool') return false;
    if (filter === 'pending') return r.status === 'reserved';
    if (filter === 'dispatched') return false; // swaps self-collect, never dispatched to a partner
    return true;
  });
  const ocrQueue = poolRequests.filter(r => r.status === 'pending_check');
  const awaitingPledges = pledges.filter(p => p.status === 'awaiting_match');

  const handleDispatch = async (id: string) => { const r = await dispatchRequest(id, 'pool'); if (r) { setReceipt(r); setTimeout(() => setReceipt(null), 6000); } };

  const downloadCsv = async () => {
    const ok = await downloadAuditCsv();
    if (ok) setExportSuccess(true);
    setTimeout(() => { setExportModal(false); setExportSuccess(false); }, 1500);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(tillAmount);
    if (!tillPin || !amt) return;
    const res = await redeemVoucher(tillPin, amt, tillPartner);
    setTillResult(res);
    if (res.ok) { setTillPin(''); setTillAmount(''); }
  };

  const renderFulfilment = () => (
    <ConsoleQueue
      filter={filter}
      setFilter={setFilter}
      emptyQueueMode={emptyQueueMode}
      setEmptyQueueMode={setEmptyQueueMode}
      receipt={receipt}
      setReceipt={setReceipt}
      awaitingPledges={awaitingPledges}
      setMatchingPledge={setMatchingPledge}
      matchInterests={matchInterests}
      closeMatchInterest={closeMatchInterest}
      filteredPool={filteredPool}
      filteredSwap={filteredSwap}
      handleDispatch={handleDispatch}
      setIssueModal={setIssueModal}
      setIssueSuccess={setIssueSuccess}
      push={push}
    />
  );
  const renderAudit = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#111111]/50 tracking-wider">
        <ShieldAlert className="w-3 h-3" /> Audit Review
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {([{ id: 'flags' as const, l: 'Flags ' + riskFlags.filter(f => f.status === 'pending').length }, { id: 'ocr' as const, l: 'OCR ' + ocrQueue.length }, { id: 'evidence' as const, l: 'Evidence ' + evidenceQueue.length }, { id: 'fp' as const, l: 'FP' }, { id: 'dedup' as const, l: 'Dedup' }, { id: 'log' as const, l: 'Log ' + auditLog.length }]).map(s => (
          <button key={s.id} onClick={() => setAuditSub(s.id)} className={'px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap font-medium ' + (auditSub === s.id ? 'bg-[#1F6B4A] text-white' : 'bg-black/5 text-[#111111]/70')}>{s.l}</button>
        ))}
        <button onClick={() => setExportModal(true)} className="ml-auto px-2 py-1 rounded-md text-[10px] font-mono bg-[#111111] text-white whitespace-nowrap shrink-0 flex items-center gap-1"><Download className="w-3 h-3" />Export</button>
      </div>

      {auditSub === 'flags' && (
        <div className="space-y-2">
          {riskFlags.length === 0 ? (
            <EmptyState Icon={CheckCircle} title="No active flags" body="All risk flags have been resolved." iconClassName="text-emerald-600" />
          ) : riskFlags.map(flag => (
            <div key={flag.id} className="p-3 bg-white border border-[#E8E6DE] rounded-xl space-y-2 cursor-pointer hover:border-[#1F6B4A]" onClick={() => setSelectedDetail({ type: 'flag', item: flag })}>
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1 flex-wrap min-w-0"><span className={'px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ' + (flag.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}>{flag.severity}</span><span className="font-mono text-[10px] text-[#111111]/50">{flag.id}</span></div>
                <span className="text-[10px] font-mono text-[#111111]/40 shrink-0">{flag.timestamp}</span>
              </div>
              <div><div className="font-bold text-[12px] text-[#111111] leading-tight">{flag.title}</div><p className="text-[11px] text-[#111111]/60 mt-0.5 leading-relaxed">{flag.description}</p></div>
              <div className="text-[10px] font-mono bg-[#FAF8F4] px-2 py-1 rounded">Target: <strong className="text-[#1F6B4A]">{flag.targetHash}</strong></div>
              {flag.status === 'pending' ? (
                <div className="flex gap-1"><button onClick={async () => { const r = await clearFlagAsFalsePositive(flag.id, fpNote); push(r.ok ? { kind: 'success', message: 'Flag cleared' } : { kind: 'error', message: r.reason ?? 'Clear failed' }); }} className="flex-1 py-1.5 bg-white border border-[#111111]/20 rounded-lg text-[10px] font-medium">Clear FP</button><button onClick={async () => { const r = await routeFlagToTier4(flag.id); push(r.ok ? { kind: 'success', message: 'Routed to Tier 4' } : { kind: 'error', message: r.reason ?? 'Route failed' }); }} className="flex-1 py-1.5 bg-amber-800 text-white rounded-lg text-[10px] font-medium">? Tier 4</button></div>
              ) : flag.status === 'routed_tier4' ? (
                <div className="py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-mono text-center">Routed to Tier 4</div>
              ) : (
                <div className="py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Cleared</div>
              )}
            </div>
          ))}
        </div>
      )}

      {auditSub === 'ocr' && (
        <div className="space-y-2">
          {ocrQueue.length === 0 ? (
            <EmptyState Icon={CheckCircle} title="No pending OCR" body="All Tier 3 verifications are complete." iconClassName="text-emerald-600" />
          ) : ocrQueue.map(r => (
            <div key={r.id} className="p-3 bg-white border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-[#111111]/50">{r.id}</span><span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">T3 * OCR</span></div>
              <div><div className="font-bold text-[12px] text-[#111111] uppercase">{r.category.replace('_', ' ')}</div><div className="text-[11px] font-mono text-[#1F6B4A]">{r.hashedObjectId}</div></div>
              <div className="flex items-center justify-between"><span className="font-mono font-bold text-[#111111]"><span className="text-[9px] text-[#111111]/50 mr-0.5">KES</span><span className="text-sm tabular-nums">{r.amount.toLocaleString()}</span></span><span className="text-[10px] font-mono text-[#111111]/50">{r.timestamp}</span></div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-900 leading-relaxed">Awaiting bill photo OCR verification. <strong>SLA:</strong> 4 business hours. Escalates to Tier 4 if unresolved.</div>
              <button onClick={async () => { const result = await completeOcrCheck(r.id); push(result.ok ? { kind: 'success', message: 'OCR verified' } : { kind: 'error', message: result.reason ?? 'Verification failed' }); }} className="w-full py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Complete OCR & Verify</button>
            </div>
          ))}
        </div>
      )}

      {auditSub === 'evidence' && (
        <div className="space-y-2">
          {evidenceQueue.length === 0 ? (
            <EmptyState
              Icon={CheckCircle}
              title="No photos awaiting review"
              body="All Tier 2 bill photos have been reviewed."
              iconClassName="text-emerald-600"
            />
          ) : evidenceQueue.map(r => (
            <EvidenceCard
              key={r.id}
              item={r}
              sessionToken={sessionToken!}
              onApproved={refetchEvidenceQueue}
              onRejected={refetchEvidenceQueue}
              push={push}
            />
          ))}
        </div>
      )}

      {auditSub === 'fp' && (
        <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-2">
          <div className="text-[12px] font-bold text-[#111111]">False-Positive Clearance</div>
          <p className="text-[11px] text-[#111111]/60 leading-relaxed">Shared-meter compounds trigger false clustering flags.</p>
          <textarea rows={3} value={fpNote} onChange={e => setFpNote(e.target.value)} className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-lg p-2 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#1F6B4A]" />
          <div className="text-[10px] font-mono text-[#111111]/50">Pattern: <strong className="text-[#1F6B4A]">shared_meter_compound</strong></div>
        </div>
      )}

      {auditSub === 'dedup' && (
        <div className="space-y-2">
          <div className="p-2 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[11px] text-[#111111]/60 flex items-center gap-1"><Layers className="w-3 h-3" /> Cross-funder dedup.</div>
          {dedupItems.map(item => (
            <div key={item.id} className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-1.5">
              <div className="flex justify-between items-start"><span className="font-mono font-bold text-[11px] text-[#1F6B4A]">{item.hashedObjectId}</span><span className={'px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ' + (item.status === 'blocked' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800')}>{item.status.replace('_', ' ')}</span></div>
              <div className="text-[11px] text-[#111111]/70">{item.objectType}</div>
              <div className="text-[10px] font-mono text-[#111111]/50">First: {item.firstFundedBy} * {item.firstFundedDate}</div>
              <div className="text-[10px] font-mono text-amber-700">Duplicate: {item.duplicateAttemptDate}</div>
            </div>
          ))}
        </div>
      )}

      {auditSub === 'log' && (
        <div className="space-y-1.5">
          {auditLog.map(e => (
            <div key={e.id} className="p-2 bg-white border border-[#111111]/10 rounded-lg space-y-0.5">
              <div className="flex justify-between text-[10px] font-mono"><span className="text-[#111111]/40">{e.timestamp}</span><span className="px-1 py-0.5 rounded bg-black/5 uppercase">{e.actorRole}</span></div>
              <div className="text-[11px] text-[#111111]">{e.action}</div>
              <div className="text-[10px] font-mono text-[#1F6B4A] break-all">{e.targetDisplay || e.targetHash}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTill = () => (
    <div className="p-4 space-y-3">
      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl"><div className="font-semibold text-[#1F6B4A] flex items-center gap-1 text-[12px]"><Store className="w-4 h-4" /> Partner Till</div><p className="text-[11px] text-[#111111]/60 mt-1">R.U.T.H 4.5 - voucher redemption.</p></div>

      <form onSubmit={handleRedeem} className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-2">
        <div><label className="text-[11px] font-mono uppercase text-[#111111]/50">Partner</label><select value={tillPartner} onChange={e => setTillPartner(e.target.value)} className="w-full bg-[#FAF8F4] border border-[#E8E6DE] rounded-lg px-2 py-2 text-[11px] font-mono mt-1 outline-none focus:ring-2 focus:ring-[#1F6B4A] focus:ring-offset-0"><option>Naivas Kibera</option><option>Kenyatta Hospital</option></select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[11px] font-mono uppercase text-[#111111]/50">PIN</label><input maxLength={6} pattern="[0-9]{6}" title="Must be exactly 6 digits" value={tillPin} onChange={e => setTillPin(e.target.value)} placeholder="6 digits" className="w-full bg-[#FAF8F4] border border-[#E8E6DE] rounded-lg px-2 py-2 text-[11px] font-mono mt-1 outline-none focus:ring-2 focus:ring-[#1F6B4A] focus:ring-offset-0" /></div>
          <div><label className="text-[11px] font-mono uppercase text-[#111111]/50">Amount (KES)</label><input type="number" value={tillAmount} onChange={e => setTillAmount(e.target.value)} placeholder="0" className="w-full bg-[#FAF8F4] border border-[#E8E6DE] rounded-lg px-2 py-2 text-[11px] font-mono mt-1 outline-none focus:ring-2 focus:ring-[#1F6B4A] focus:ring-offset-0" /></div>
        </div>
        <button type="submit" disabled={!tillPin || !tillAmount} className="w-full py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[11px] font-semibold disabled:opacity-40">Redeem Voucher</button>
      </form>

      {tillResult && (
        <div className={'p-3 rounded-xl flex items-start gap-2 ' + (tillResult.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200')}>
          {tillResult.ok ? <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
          <div className="flex-1"><div className={'text-[11px] font-bold ' + (tillResult.ok ? 'text-emerald-900' : 'text-rose-900')}>{tillResult.ok ? 'Voucher accepted' : 'Voucher rejected'}</div>{!tillResult.ok && <p className="text-[11px] text-rose-900/70 mt-0.5">{tillResult.reason}</p>}</div>
          <button onClick={() => setTillResult(null)} className="text-[#111111]/40 shrink-0" aria-label="Dismiss"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="text-[11px] font-mono uppercase text-[#111111]/50">Recent redemptions</div>
        {voucherRedemptions.length === 0 ? (
          <div className="p-3 bg-white border border-[#111111]/10 rounded-lg text-center"><p className="text-[11px] text-[#111111]/40">No redemptions yet</p></div>
        ) : voucherRedemptions.slice(0, 4).map(r => (
          <div key={r.id} className="p-2 bg-white border border-[#111111]/10 rounded-lg flex justify-between text-[11px]">
            <div><div className="font-mono font-bold text-[#111111]">{r.voucherId} * {r.pin}</div><div className="text-[11px] text-[#111111]/50">{r.partnerName} * {r.timestamp}</div></div>
            <span className={'text-[11px] font-mono uppercase px-1.5 py-0.5 rounded self-start ' + (r.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800')}>{r.status}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="text-[11px] font-mono uppercase text-[#111111]/50">Issued vouchers</div>
          <div className="text-[11px] font-mono text-[#111111]/40">{vouchers.filter(v => v.status === 'active').length} active * {vouchers.length} total</div>
        </div>
        {vouchers.length === 0 ? (
          <div className="p-3 bg-white border border-[#111111]/10 rounded-lg text-center">
            <p className="text-[11px] text-[#111111]/40">No vouchers issued yet</p>
          </div>
        ) : vouchers.map(v => (
          <div key={v.id} className={'p-2 rounded-lg border ' + (v.status === 'active' ? 'bg-purple-50 border-purple-200' : 'bg-[#FAF8F4] border-[#111111]/10 opacity-60')}>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-[#111111] truncate">{v.partnerName}</div>
                <div className="text-[11px] font-mono text-[#111111]/50">PIN <strong className="text-purple-700">{v.pin}</strong> * {v.description}</div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-[11px] font-mono font-bold text-[#111111]">KES {v.maxValue.toLocaleString()}</div>
                <span className={'text-[11px] font-mono uppercase ' + (v.status === 'active' ? 'text-purple-700 font-bold' : 'text-[#111111]/50')}>{v.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMatrix = () => (
    <div className="p-4 space-y-3">
      <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl"><h3 className="text-[12px] font-bold text-[#111111]">Separation of Duties</h3><p className="text-[11px] text-[#111111]/60 mt-1">No role holds both identity and payment authority.</p></div>
      <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-[#111111]/50 uppercase font-mono"><tr><th className="pb-2">Role</th><th className="pb-2 text-center">Id</th><th className="pb-2 text-center">Pay</th><th className="pb-2 text-center">Flag</th><th className="pb-2 text-center">Log</th></tr></thead>
          <tbody className="divide-y divide-[#111111]/5">
            {[{ r: 'Enrolment', p: [true, false, false, false] }, { r: 'Fulfilment', p: [false, true, false, false] }, { r: 'Audit', p: [false, false, true, true] }].map(row => (
              <tr key={row.r}><td className="py-2 font-semibold text-[#111111] text-[11px]">{row.r}</td>{row.p.map((has, i) => <td key={i} className={'py-2 text-center font-mono font-bold ' + (has ? 'text-emerald-700' : 'text-rose-700')}>{has ? '?' : '?'}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Enforced by login gate</div>
    </div>
  );

  const renderTiers = () => (
    <div className="p-4 space-y-2">
      {[{ n: 1, tag: 'Low', title: 'Self-declared', desc: 'Standard bundles. 7-day rate limit + 5% sample.' }, { n: 2, tag: 'Object', title: 'Institutional check', desc: 'Utility/school/hospital < KES 5,000.' }, { n: 3, tag: 'High', title: 'OCR check', desc: 'Amount > KES 5,000. Automated bill photo.' }, { n: 4, tag: 'Anomaly', title: 'Independent panel', desc: 'Flagged anomalies. Off-system review.' }].map(row => (
        <div key={row.n} className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl">
          <div className="flex justify-between items-center"><span className="font-bold text-[#1F6B4A] font-mono text-[12px]">Tier {row.n}</span><span className="text-[11px] font-mono bg-black/5 px-1.5 py-0.5 rounded uppercase">{row.tag}</span></div>
          <div className="font-semibold text-[12px] text-[#111111] mt-1">{row.title}</div>
          <p className="text-[11px] text-[#111111]/60 mt-0.5 leading-relaxed">{row.desc}</p>
        </div>
      ))}
    </div>
  );


  const handlePartnerConfirm = async (requestId: string) => {
    setConfirmingPartner(requestId);
    const r = await confirmPartnerRequest(selectedPartner, requestId, 'delivered');
    if (r?.ok) {
      const red = await getPartnerRedemptions(selectedPartner);
      if (red) setPartnerRedemptions(red.redemptions || []);
    }
    setConfirmingPartner(null);
  };

  const handlePartnerStatement = async () => {
    if (!partnerInfo) return;
    setPartnerDownloading(true);
    try { await downloadPartnerStatement(selectedPartner, partnerInfo.id); } catch (e) { console.error('[partner] statement download failed', e); }
    setPartnerDownloading(false);
  };

  const renderPartners = () => (
    <div className="p-4 space-y-3">
      <div>
        <h2 className="font-serif text-base font-bold text-[#111111]">Partners</h2>
        <p className="text-[11px] text-[#111111]/50 mt-0.5">External reconciliation</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { key: 'chui-demo-key-2026', label: 'CHUI', Icon: Package },
          { key: 'kplc-demo-key-2026', label: 'KPLC', Icon: Zap },
          { key: 'naivas-demo-key-2026', label: 'Naivas', Icon: Store },
        ].map(p => {
          const Icon = p.Icon;
          const active = selectedPartner === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setSelectedPartner(p.key)}
              className={'p-2 rounded-lg border-2 text-center transition-all ' + (active ? 'bg-[#1F6B4A] text-white border-[#1F6B4A]' : 'bg-white border-[#E8E6DE] text-[#111111] hover:border-[#111111]/30')}
            >
              <Icon className="w-3 h-3 mx-auto mb-0.5" />
              <div className="text-[11px] font-bold">{p.label}</div>
            </button>
          );
        })}
      </div>

      {partnerLoading ? (
        <SkeletonList count={2} />
      ) : partnerInfo ? (
        <>
          <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1F6B4A]" />
              <div className="text-[12px] font-bold text-[#111111] leading-tight">{partnerInfo.name}</div>
            </div>
            <div className="text-[11px] font-mono text-[#111111]/50 uppercase">{partnerInfo.type}</div>
            <div className="flex justify-between pt-1.5 border-t border-[#111111]/10 text-[11px] font-mono">
              <span className="text-[#111111]/50">Total: {partnerRedemptions.length}</span>
              <span className="text-emerald-700">Confirmed: {partnerRedemptions.filter((r: any) => r.confirmed).length}</span>
            </div>
          </div>

          <button
            onClick={handlePartnerStatement}
            disabled={partnerDownloading || partnerRedemptions.length === 0}
            className="w-full py-2 bg-[#111111] text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Download className="w-3 h-3" /> {partnerDownloading ? 'Downloading...' : 'Statement CSV'}
          </button>

          <div className="space-y-1.5">
            {partnerRedemptions.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-[#111111]/40">No fulfillments yet</div>
            ) : partnerRedemptions.slice(0, 15).map((r: any) => {
              const details = r.category
                ? (r.category as string).replace('_', ' ')
                : (r.metadata?.bundle || 'Bundle');
              return (
                <div key={r.id} className="p-2 bg-white border border-[#111111]/10 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-[#111111] capitalize truncate">{details}</div>
                      <div className="text-[11px] font-mono text-[#111111]/50 truncate">
                        {String(r.id).slice(0, 8)}… · {(r.status || '').replace(/_/g, ' ')}
                      </div>
                    </div>
                    {r.amount_pence !== undefined && r.amount_pence > 0 && (
                      <div className="text-[11px] font-mono font-bold text-[#111111] shrink-0">
                        KES {(r.amount_pence / 100).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {r.confirmed ? (
                    <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Confirmed
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePartnerConfirm(r.id)}
                      disabled={confirmingPartner === r.id}
                      className="w-full py-1 bg-[#1F6B4A] text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Check className="w-3 h-3" /> {confirmingPartner === r.id ? 'Confirming...' : 'Confirm delivery'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="p-5 text-center space-y-2">
          <div className="w-12 h-12 bg-canvas rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6 text-muted" />
          </div>
          <p className="text-sm font-semibold text-ink">Partner session not available</p>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            Demo build - in production this page shows pending fulfillments for the selected partner and confirms delivery.
          </p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (tab === 'queue') { if (staffRole === 'enrolment') return <ConsoleEnrolment />; if (staffRole === 'audit') return renderAudit(); return renderFulfilment(); }
    if (tab === 'bills') return <ConsoleBills sessionToken={sessionToken!} />;
  if (tab === 'depot') return <ConsoleDepot />;
    if (tab === 'till') return renderTill();
    if (tab === 'partners') return renderPartners();
    return renderMore();
  };

  const renderMore = () => {
    if (moreTab === 'matrix') {
      return (
        <div>
          <button onClick={() => setMoreTab('menu')} className="w-full px-4 py-2 border-b border-[#111111]/10 bg-white flex items-center gap-1 text-[11px] font-mono text-[#111111]/60 hover:text-[#111111]">
            <ChevronRight className="w-3 h-3 rotate-180" /> Back
          </button>
          {renderMatrix()}
        </div>
      );
    }
    if (moreTab === 'tiers') {
      return (
        <div>
          <button onClick={() => setMoreTab('menu')} className="w-full px-4 py-2 border-b border-[#111111]/10 bg-white flex items-center gap-1 text-[11px] font-mono text-[#111111]/60 hover:text-[#111111]">
            <ChevronRight className="w-3 h-3 rotate-180" /> Back
          </button>
          {renderTiers()}
        </div>
      );
    }
    if (moreTab === 'server') {
      return (
        <div>
          <button onClick={() => setMoreTab('menu')} className="w-full px-4 py-2 border-b border-[#111111]/10 bg-white flex items-center gap-1 text-[11px] font-mono text-[#111111]/60 hover:text-[#111111]">
            <ChevronRight className="w-3 h-3 rotate-180" /> Back
          </button>
          <div className="p-4">
            <div className="p-4 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#111111] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#1F6B4A]" /> Server View</h3>
                <button onClick={() => setShowRaw(!showRaw)} className="text-[11px] text-[#1F6B4A] hover:underline flex items-center gap-1">{showRaw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}{showRaw ? 'Hide' : 'Reveal'}</button>
              </div>
              <div className="space-y-1.5 pt-3 border-t border-[#111111]/10 font-mono text-[11px]">
                <div className="flex justify-between"><span className="text-[#111111]/50">Role</span><span className="font-bold text-[#111111]">{roleLabel[staffRole as Role]}</span></div>
                <div className="flex justify-between"><span className="text-[#111111]/50">Staff ID</span><span className="text-[#111111]">{staffId}</span></div>
                <div className="flex justify-between"><span className="text-[#111111]/50">Records</span><span className="text-[#111111]">{totalRecords}</span></div>
                <div className="flex justify-between"><span className="text-[#111111]/50">Pending flags</span><span className="text-[#111111]">{pendingFlags}</span></div>
                <div className="flex justify-between"><span className="text-[#111111]/50">Pending OCR</span><span className="text-[#111111]">{ocrQueue.length}</span></div>
                <div className="flex justify-between"><span className="text-[#111111]/50">Pledges awaiting</span><span className="text-[#111111]">{awaitingPledges.length}</span></div>
                <div className="flex justify-between"><span className="text-[#111111]/50">Vouchers active</span><span className="text-[#111111]">{vouchers.filter(v => v.status === 'active').length}</span></div>
                <div className="flex justify-between border-t border-[#111111]/10 pt-2 mt-2"><span className="text-[#111111]/50">Raw PII columns</span><span className="font-bold text-rose-600">NONE</span></div>
              </div>
              {showRaw && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800 leading-relaxed mt-2"><strong>Invariant:</strong> no column stores name, phone, or raw object number.</div>}
            </div>
          </div>
        </div>
      );
    }
    if (moreTab === 'spec') {
      return (
        <div>
          <button onClick={() => setMoreTab('menu')} className="w-full px-4 py-2 border-b border-[#111111]/10 bg-white flex items-center gap-1 text-[11px] font-mono text-[#111111]/60 hover:text-[#111111]">
            <ChevronRight className="w-3 h-3 rotate-180" /> Back
          </button>
          <div className="p-4">
            <div className="p-4 bg-[#FAF8F4] border border-[#E8E6DE] rounded-xl space-y-1.5">
              <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">Spec Coverage</h4>
              {['Separate credentials (4.8)', 'Login gate', 'Verification tiers 1-4 (4.8)', 'OCR completion (4.8)', 'Deduplication (4.7)', 'Audit log + export (4.7)', 'POCAMLA export (6)', 'Partner vouchers (4.5)', 'Pledge matching (4.4)', 'Match interests panel', 'Depot + locker stock (4.2)'].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[11px] text-[#111111]/70"><div className="w-1 h-1 rounded-full bg-[#1F6B4A]" />{f}</div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    const primaryItems: Array<{ id: 'matrix' | 'tiers'; Icon: any; label: string; sub: string }> = [
      { id: 'matrix', Icon: Layers, label: 'Matrix', sub: 'Voucher by partner grid' },
      { id: 'tiers', Icon: ShieldCheck, label: 'Verification Tiers', sub: 'Tier 1-4 explainer' },
    ];
    const developerItems: Array<{ id: 'server' | 'spec'; Icon: any; label: string; sub: string }> = [
      { id: 'server', Icon: Activity, label: 'Server View', sub: 'Live counts + invariants' },
      { id: 'spec', Icon: CheckCircle, label: 'Spec Coverage', sub: 'R.U.T.H sections covered' },
    ];
    const renderMoreButton = (it: { id: 'matrix' | 'tiers' | 'server' | 'spec'; Icon: any; label: string; sub: string }, dimmed = false) => {
      const I = it.Icon;
      return (
        <button key={it.id} onClick={() => setMoreTab(it.id)} className="w-full p-3 bg-white border border-[#111111]/10 rounded-xl flex items-center justify-between hover:border-[#1F6B4A] transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className={'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' + (dimmed ? 'bg-[#FAF8F4] text-[#111111]/40' : 'bg-[#DCE8E0] text-[#1F6B4A]')}>
              <I className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-left">
              <div className={'text-sm font-semibold ' + (dimmed ? 'text-[#111111]/70' : 'text-[#111111]')}>{it.label}</div>
              <div className="text-[11px] font-mono text-[#111111]/50 mt-0.5">{it.sub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#111111]/30 shrink-0" />
        </button>
      );
    };
    return (
      <div className="p-4 space-y-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#111111]">More</h2>
          <p className="text-[11px] font-mono text-[#111111]/50 mt-0.5">{roleLabel[staffRole as Role]} - {staffId}</p>
        </div>
        <div className="space-y-2">
          {primaryItems.map(it => renderMoreButton(it, false))}
          <div className="pt-3 pb-1 flex items-center gap-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#111111]/40">Developer</div>
            <div className="flex-1 h-px bg-[#111111]/10" />
          </div>
          {developerItems.map(it => renderMoreButton(it, true))}
          <button
            onClick={() => { setTab('queue'); setAuditSub('flags'); setFilter('all'); setReceipt(null); setShowRaw(false); setTillResult(null); setIssueModal(null); setIssueSuccess(null); setMoreTab('menu'); }}
            className="w-full p-3 bg-white border border-[#E8E6DE] rounded-xl flex items-center justify-center gap-1.5 text-[#111111]/60 hover:text-[#111111] hover:bg-[#FAF8F4] text-[12px] font-medium mt-4"
          >
            <RotateCcw className="w-3 h-3" /> Reset view
          </button>
        </div>
      </div>
    );
  };

  const pendingFlags = riskFlags.filter(f => f.status === 'pending').length;
  const totalRecords = poolRequests.length + swapRequests.length;
  const pendingQueueCount = poolRequests.filter(r => r.status === 'pending_check' || r.status === 'verified').length
    + swapRequests.filter(r => r.status === 'reserved').length;
  const pendingMoreCount = riskFlags.filter(f => f.status === 'pending').length + ocrQueue.length;


  const consoleTabs: { id: Tab; label: string; Icon: any; badge?: number }[] = [
    { id: 'queue', label: staffRole === 'enrolment' ? 'Metrics' : staffRole === 'audit' ? 'Audit' : 'Queue', Icon: Activity, badge: pendingQueueCount },
    { id: 'bills', label: 'Bills', Icon: Receipt },
    { id: 'depot', label: 'Depot', Icon: Boxes },
    { id: 'till', label: 'Till', Icon: Store },
    { id: 'partners', label: 'Partners', Icon: Building2 },
    { id: 'more', label: 'More', Icon: Layers, badge: pendingMoreCount },
  ];

  const handleConsoleTabChange = (id: Tab) => {
    setTab(id);
    if (id === 'more') setMoreTab('menu');
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink">Operations</h1>
              <p className="text-sm text-muted mt-1">
                {roleLabel[staffRole as Role]} - {staffId}
              </p>
            </div>
            <button onClick={logoutStaff} className="p-2 rounded-full hover:bg-tint transition-colors bg-surface border border-tile shadow-sm" aria-label="Logout">
              <LogOut className="w-5 h-5 text-ink" />
            </button>
          </div>
          <div key={staffRole + tab + auditSub + moreTab} className="animate-in fade-in duration-200">
            {renderContent()}
          </div>
        </div>
      </div>
      <AppBottomNav tabs={consoleTabs} active={tab} onChange={handleConsoleTabChange} />
      {selectedDetail && (
        <DetailModal type={selectedDetail.type} item={selectedDetail.item} onClose={() => setSelectedDetail(null)}/>
      )}

      {issueModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-base font-bold text-[#111111]">Issue Partner Voucher</h3>
              <button onClick={() => { setIssueModal(null); setIssueSuccess(null); }} className="text-[#111111]/40" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[11px] text-[#111111]/60 leading-relaxed">Requester receives a PIN to redeem at the partner till. Settled monthly in bulk.</p>
            <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[11px] font-mono space-y-1">
              <div className="flex justify-between"><span className="text-[#111111]/50">Request</span><span className="font-bold">{issueModal.requestId}</span></div>
              <div className="flex justify-between"><span className="text-[#111111]/50">Value</span><span className="font-bold">KES {issueModal.amount.toLocaleString()}</span></div>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase text-[#111111]/50">Partner</label>
              <select value={issuePartner} onChange={e => setIssuePartner(e.target.value as any)} className="w-full bg-[#FAF8F4] border border-[#E8E6DE] rounded-lg px-3 py-2 text-xs font-mono mt-1 outline-none focus:ring-2 focus:ring-[#1F6B4A] focus:ring-offset-0">
                <option>Naivas Kibera</option><option>Kenyatta Hospital</option>
              </select>
            </div>
            {issueSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="text-[11px] font-bold text-emerald-900">Voucher issued</div>
                <div className="text-[11px] font-mono text-emerald-900/80 mt-0.5">PIN: <strong>{issueSuccess}</strong></div>
                <div className="text-[10px] text-emerald-900/60 mt-1">Redeemable at {issuePartner}.</div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setIssueModal(null); setIssueSuccess(null); }} className="flex-1 py-2 bg-white border border-[#111111]/20 rounded-lg text-[11px] font-medium">Close</button>
              <button onClick={async () => { const v = await issueVoucher(issueModal.requestId, issuePartner, issuePartner === 'Kenyatta Hospital' ? 'hospital' : 'retailer'); if (v) setIssueSuccess(v.pin); }} disabled={!!issueSuccess} className="flex-1 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[11px] font-semibold disabled:opacity-40">{issueSuccess ? 'Issued' : 'Issue'}</button>
            </div>
          </div>
        </div>
      )}

      {exportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between"><h3 className="font-serif text-lg font-bold">Export Compliance Records</h3><button onClick={() => setExportModal(false)} className="text-[#111111]/40" aria-label="Close"><X className="w-4 h-4" /></button></div>
            <p className="text-xs text-[#111111]/70">CSV of institutional settlements. <strong>Export is logged to the audit trail.</strong></p>
            <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[12px] text-[#111111]/70 font-mono"><strong className="text-[#1F6B4A]">POCAMLA:</strong> shortcode holder carries AML reporting duties.</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setExportModal(false)} className="px-4 py-2 bg-white border border-[#111111]/20 rounded-lg text-xs font-medium">Cancel</button>
              <button onClick={downloadCsv} className="px-4 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-xs font-semibold">{exportSuccess ? 'Downloaded' : 'Download & Log'}</button>
            </div>
          </div>
        </div>
      )}
      {matchingPledge && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setMatchingPledge(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#111111]">Match pledge to request</h3>
                <p className="text-[11px] text-[#111111]/50 mt-0.5">{matchingPledge.description} \u00b7 {matchingPledge.locality}</p>
              </div>
              <button onClick={() => setMatchingPledge(null)} className="text-[#111111]/40" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            {(() => {
              const eligible = poolRequests.filter(r => r.status === 'verified');
              if (eligible.length === 0) {
                return <div className="p-4 text-center text-[11px] text-[#111111]/50">No verified pool requests awaiting match.</div>;
              }
              return (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {eligible.map(r => (
                    <button
                      key={r.id}
                      onClick={async () => {
                        const res = await matchPledge(matchingPledge.id, r.id);
                        push(res.ok
                          ? { kind: 'success', message: 'Pledge matched to REF-' + r.id.slice(0, 8).toUpperCase() }
                          : { kind: 'error', message: res.reason ?? 'Match failed' });
                        if (res.ok) setMatchingPledge(null);
                      }}
                      className="w-full p-2.5 bg-[#FAF8F4] hover:bg-[#DCE8E0] border border-[#111111]/10 rounded-lg text-left transition-colors"
                    >
                      <div className="text-[12px] font-semibold text-[#111111] capitalize">{(r.category || 'request').replace(/_/g, ' ')}</div>
                      <div className="text-[10px] font-mono text-[#111111]/50 mt-0.5">REF-{r.id.slice(0, 8).toUpperCase()}</div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </>
  );
};

