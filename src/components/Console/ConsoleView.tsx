import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { STAFF_CREDS } from '../../services/auth';
import {
  ShieldCheck, ShieldAlert, CheckCircle, Send, AlertTriangle, Users, Activity,
  Download, X, Layers, Boxes, Package, Truck, Check, Eye, EyeOff, RotateCcw,
  LogIn, LogOut, Store, KeyRound, Lock,
} from 'lucide-react';

type Role = 'enrolment' | 'fulfilment' | 'audit';
type Tab = 'queue' | 'depot' | 'till' | 'matrix' | 'tiers';
type AuditSub = 'flags' | 'ocr' | 'fp' | 'dedup' | 'log';
type Filter = 'all' | 'swap' | 'pool' | 'pending' | 'dispatched';

export const ConsoleView: React.FC = () => {
  const {
    swapRequests, poolRequests, riskFlags, auditLog, dedupItems, lockerStocks, depotCounts, pledges,
    vouchers, voucherRedemptions, staffRole, staffId, loginStaff, logoutStaff, logAction,
    issueVoucher, matchInterests, closeMatchInterest,
    dispatchRequest, routeFlagToTier4, clearFlagAsFalsePositive, completeOcrCheck, matchPledge, redeemVoucher,
    emptyQueueMode, setEmptyQueueMode,
  } = useApp();

  const [loginRole, setLoginRole] = useState<Role>('fulfilment');
  const [loginId, setLoginId] = useState(STAFF_CREDS[loginRole].id);
  const [loginPin, setLoginPin] = useState(STAFF_CREDS[loginRole].pin);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('queue');
  const [auditSub, setAuditSub] = useState<AuditSub>('flags');
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

  const [issueModal, setIssueModal] = useState<{ requestId: string; amount: number } | null>(null);
  const [issuePartner, setIssuePartner] = useState<'Naivas Kibera' | 'Kenyatta Hospital'>('Naivas Kibera');
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const ok = loginStaff(loginRole, loginId, loginPin);
    if (!ok) { setLoginError('Invalid ID or PIN for this role.'); setLoginPin(''); return; }
    setLoginId(STAFF_CREDS[loginRole].id); setLoginPin(STAFF_CREDS[loginRole].pin); setTab('queue'); setAuditSub('flags'); setReceipt(null);
  };

  /* ---------- LOGIN GATE ---------- */
  if (!staffRole) {
    return (
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
          <div className="bg-[#0a0a0a] rounded-[2rem] overflow-hidden flex flex-col h-[620px] text-white">
            <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-medium text-white/40">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[8px] font-mono bg-rose-900/60 text-rose-200 px-1.5 py-0.5 rounded uppercase font-bold">Staff Only</span>
            </div>
            <div className="flex-1 flex flex-col justify-center px-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-2xl flex items-center justify-center mx-auto"><Lock className="w-7 h-7" /></div>
                <div><h1 className="font-serif text-xl font-bold text-white">Operations Console</h1><p className="text-[9px] font-mono text-white/50 mt-1 uppercase tracking-widest">Restricted access</p></div>
                <p className="text-[11px] text-white/60 leading-relaxed">Each role has separate credentials. No role can switch without logging out.</p>
                <div className="text-[9px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1 inline-block">? Credentials auto-filled for demo</div>
              </div>
              <form onSubmit={handleLogin} className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <div>
                  <label className="text-[9px] font-mono uppercase text-white/50">Role</label>
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    {(['enrolment', 'fulfilment', 'audit'] as Role[]).map(r => (
                      <button key={r} type="button" onClick={() => { setLoginRole(r); setLoginId(STAFF_CREDS[r].id); setLoginPin(STAFF_CREDS[r].pin); setLoginError(null); }} className={'py-1.5 rounded text-[9px] font-medium transition-colors ' + (loginRole === r ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15')}>{STAFF_CREDS[r].label.split(' ')[0]}</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[9px] font-mono uppercase text-white/50">Staff ID</label><input value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="Auto-filled" autoFocus className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs font-mono text-white mt-1 focus:border-rose-500 outline-none" /></div>
                <div><label className="text-[9px] font-mono uppercase text-white/50">PIN</label><input type="password" value={loginPin} onChange={e => setLoginPin(e.target.value)} placeholder="Auto-filled" maxLength={4} className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs font-mono text-white tracking-widest mt-1 focus:border-rose-500 outline-none" /></div>
                {loginError && <div className="p-2 bg-rose-900/40 border border-rose-500/40 rounded text-[10px] text-rose-200">{loginError}</div>}
                <button type="submit" disabled={!loginId || !loginPin} className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"><LogIn className="w-3.5 h-3.5" /> Log in</button>
              </form>
            </div>
          </div>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <div className="p-4 bg-white border border-[#111111]/15 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-rose-600" /> Demo Credentials</h3>
            <p className="text-[10px] text-[#111111]/60 leading-relaxed">For demonstration. Production uses SSO / MFA.</p>
            <div className="space-y-1.5 pt-2 border-t border-[#111111]/10">
              {(['enrolment', 'fulfilment', 'audit'] as Role[]).map(r => (
                <div key={r} className="p-2 bg-[#FAF8F4] rounded-lg font-mono text-[10px]">
                  <div className="text-[9px] uppercase text-[#111111]/50">{STAFF_CREDS[r].label}</div>
                  <div className="flex justify-between"><span className="text-[#111111]">{STAFF_CREDS[r].id}</span><span className="text-[#111111]/60">PIN: {STAFF_CREDS[r].pin}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl space-y-1.5">
            <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">Why this exists</h4>
            <p className="text-[10px] text-[#111111]/70 leading-relaxed">R.U.T.H 4.8: <em>"separation enforced by architecture (separate data stores and credentials), not by policy."</em></p>
            <p className="text-[10px] text-[#111111]/70 leading-relaxed">Without a login boundary, the separation claim is theatre.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- LOGGED IN ---------- */
  const roleLabel: Record<Role, string> = { enrolment: 'Enrolment', fulfilment: 'Fulfilment', audit: 'Audit / T4' };
  const filteredPool = emptyQueueMode ? [] : poolRequests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'verified' || r.status === 'pending_check';
    if (filter === 'dispatched') return r.status === 'submitted_to_partner' || r.status === 'voucher_issued';
    if (filter === 'swap') return false;
    return true;
  });
  const filteredSwap = emptyQueueMode ? [] : swapRequests.filter(r => filter === 'all' || filter === 'swap' || filter === 'pending' || filter === 'dispatched');
  const ocrQueue = poolRequests.filter(r => r.status === 'pending_check');
  const awaitingPledges = pledges.filter(p => p.status === 'awaiting_match');

  const handleDispatch = (id: string) => { const r = dispatchRequest(id, 'pool'); if (r) { setReceipt(r); setTimeout(() => setReceipt(null), 6000); } };

  const downloadCsv = () => {
    const rows = auditLog.map(e => ({ time: e.timestamp, role: e.actorRole, action: e.action, target: e.targetHash }));
    const header = Object.keys(rows[0] ?? {});
    const csv = [header.join(','), ...rows.map(r => header.map(k => JSON.stringify((r as any)[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mutual-circle-audit-log.csv'; a.click(); URL.revokeObjectURL(url);
    logAction(staffRole!, 'Exported compliance CSV', 'system');
    setExportSuccess(true);
    setTimeout(() => { setExportModal(false); setExportSuccess(false); }, 1500);
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(tillAmount);
    if (!tillPin || !amt) return;
    const res = redeemVoucher(tillPin, amt, tillPartner);
    setTillResult(res);
    if (res.ok) { setTillPin(''); setTillAmount(''); }
  };

  /* ---------- ROLE VIEWS ---------- */
  const renderEnrolment = () => (
    <div className="p-4 space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl"><div className="font-bold text-blue-900 flex items-center gap-1 text-[11px]"><ShieldAlert className="w-3.5 h-3.5" /> No payment access</div><p className="text-[10px] text-blue-900/80 mt-1 leading-relaxed">Enrolment monitors intake velocity only. Zero request details visible.</p></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-white border border-[#111111]/15 rounded-xl"><div className="text-[9px] font-mono uppercase text-[#111111]/50">Tokens Today</div><div className="font-mono text-xl font-bold text-[#1F6B4A] mt-1">384</div></div>
        <div className="p-3 bg-white border border-[#111111]/15 rounded-xl"><div className="text-[9px] font-mono uppercase text-[#111111]/50">Rate-Limit Hits</div><div className="font-mono text-xl font-bold text-amber-700 mt-1">42</div></div>
      </div>
      <div className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-1"><div className="text-[9px] font-mono uppercase text-[#111111]/50">Active Salt</div><div className="font-mono text-sm font-bold text-[#111111]">SHA256-WK43</div><div className="text-[9px] text-[#111111]/40 font-mono">Rotates Mon 00:01 EAT</div></div>
      <div className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-2"><div className="text-[10px] font-semibold uppercase text-[#111111]">Channels Today</div>{[{ l: 'Web', p: 54, c: 'bg-[#1F6B4A]' }, { l: 'SMS', p: 31, c: 'bg-blue-600' }, { l: 'USSD', p: 15, c: 'bg-amber-600' }].map(r => (<div key={r.l} className="space-y-1"><div className="flex justify-between text-[10px] font-mono"><span>{r.l}</span><span className="font-bold">{r.p}%</span></div><div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className={'h-full ' + r.c} style={{ width: r.p + '%' }} /></div></div>))}</div>
      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl flex items-start gap-2"><Users className="w-3.5 h-3.5 text-[#111111]/40 shrink-0 mt-0.5" /><span className="text-[10px] text-[#111111]/60">Can refer to The Bench, but cannot see request content.</span></div>
    </div>
  );

  const renderFulfilment = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {([{ id: 'all' as const, l: 'All' }, { id: 'swap' as const, l: 'Swap' }, { id: 'pool' as const, l: 'Pool' }, { id: 'pending' as const, l: 'Pending' }, { id: 'dispatched' as const, l: 'Sent' }]).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={'px-2.5 py-1 rounded-md text-[10px] whitespace-nowrap font-medium ' + (filter === f.id ? 'bg-[#111111] text-white' : 'bg-black/5 text-[#111111]/70')}>{f.l}</button>
        ))}
        <button onClick={() => setEmptyQueueMode(!emptyQueueMode)} className="ml-auto px-2 py-1 rounded-md text-[9px] font-mono border border-[#111111]/15 bg-white whitespace-nowrap shrink-0">{emptyQueueMode ? 'Restore' : 'Empty'}</button>
      </div>

      {receipt && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0"><div className="text-[10px] font-bold text-emerald-900">Dispatched</div><div className="text-[10px] font-mono text-emerald-900/80 truncate">{receipt}</div></div>
          <button onClick={() => setReceipt(null)} className="text-emerald-700 shrink-0" aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {awaitingPledges.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="text-[10px] font-bold text-amber-900 flex items-center gap-1"><Package className="w-3 h-3" /> Incoming pledges ({awaitingPledges.length})</div>
          {awaitingPledges.map(p => (
            <div key={p.id} className="p-2 bg-white border border-[#111111]/10 rounded-lg flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1"><div className="text-[10px] font-semibold text-[#111111] truncate">{p.description}</div><div className="text-[9px] font-mono text-[#111111]/50">{p.locality} Â· {p.type === 'service_credit' ? 'credit' : 'goods'}</div></div>
              <button onClick={() => matchPledge(p.id)} className="px-2 py-1 bg-amber-700 text-white rounded text-[9px] font-semibold whitespace-nowrap">Match</button>
            </div>
          ))}
        </div>
      )}

      {matchInterests && matchInterests.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-bold text-blue-900 flex items-center gap-1"><Users className="w-3 h-3" /> Match interests</div>
            <div className="text-[9px] font-mono text-blue-900/60">
              {matchInterests.filter(m => m.status === 'pending').length} pending Â· {matchInterests.filter(m => m.status === 'contacted').length} contacted Â· {matchInterests.filter(m => m.status === 'closed').length} closed
            </div>
          </div>
          {matchInterests.slice(0, 4).map(m => (
            <div key={m.id} className={'p-2 rounded-lg border ' + (m.status === 'pending' ? 'bg-white border-[#111111]/10' : m.status === 'contacted' ? 'bg-amber-50 border-amber-200' : 'bg-[#FAF8F4] border-[#111111]/5 opacity-70')}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold text-[#111111] truncate">{m.title}</div>
                  <div className="text-[9px] font-mono text-[#111111]/50">{m.timestamp} Â· token {m.tokenHash.slice(0, 8)}â€¦</div>
                </div>
                <span className={'text-[8px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ' + (m.status === 'pending' ? 'bg-blue-100 text-blue-800' : m.status === 'contacted' ? 'bg-amber-100 text-amber-800' : 'bg-black/5 text-[#111111]/50')}>{m.status}</span>
              </div>
              {m.status === 'pending' && (
                <div className="flex gap-1 mt-1.5">
                  <button onClick={() => closeMatchInterest(m.id, 'contacted')} className="flex-1 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[9px] font-semibold">Mark contacted</button>
                  <button onClick={() => closeMatchInterest(m.id, 'closed')} className="flex-1 py-1 bg-white border border-[#111111]/20 rounded text-[9px] font-medium">Close</button>
                </div>
              )}
              {m.status === 'contacted' && (
                <button onClick={() => closeMatchInterest(m.id, 'closed')} className="w-full mt-1.5 py-1 bg-white border border-[#111111]/20 rounded text-[9px] font-medium">Close case</button>
              )}
            </div>
          ))}
          <div className="text-[9px] text-blue-900/70 leading-relaxed">Opt-in disclosure only. Provider must reach out within 48h.</div>
        </div>
      )}

      {filteredPool.length === 0 && filteredSwap.length === 0 ? (
        <div className="p-8 bg-white border border-[#111111]/15 rounded-2xl text-center space-y-2"><Activity className="w-6 h-6 text-[#111111]/20 mx-auto" /><p className="text-xs font-bold text-[#111111]">Queue empty</p></div>
      ) : (
        <div className="space-y-2">
          {filteredPool.map(r => {
            const canAct = r.status === 'verified';
            const isVoucher = r.status === 'voucher_issued';
            const isPending = r.status === 'pending_check';
            const isWithdrawn = r.status === 'withdrawn';
            const isSent = r.status === 'submitted_to_partner';
            return (
              <div key={r.id} className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-2">
                <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[#111111]/50">{r.id}</span><span className="text-[9px] font-mono bg-black/5 px-1.5 py-0.5 rounded">T{r.tier}</span></div>
                <div><div className="font-bold text-[11px] text-[#111111] uppercase">{r.category.replace('_', ' ')}</div><div className="text-[10px] font-mono text-[#1F6B4A]">{r.hashedObjectId}</div></div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#111111]">KES {r.amount.toLocaleString()}</span>
                  <span className={'px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ' + (isSent ? 'bg-emerald-50 text-emerald-800' : isPending ? 'bg-amber-50 text-amber-800' : isWithdrawn ? 'bg-[#FAF8F4] text-[#111111]/40' : isVoucher ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800')}>{r.status.replace(/_/g, ' ')}</span>
                </div>
                {canAct ? (
                  <div className="grid grid-cols-2 gap-1">
                    <button onClick={() => handleDispatch(r.id)} className="py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"><Send className="w-3 h-3" /> Dispatch</button>
                    <button onClick={() => { setIssueModal({ requestId: r.id, amount: r.amount }); setIssueSuccess(null); }} className="py-2 bg-white border border-[#111111]/20 text-[#111111] rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"><Store className="w-3 h-3" /> Voucher</button>
                  </div>
                ) : isPending ? (
                  <div className="w-full py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-medium text-center">Awaiting Audit (Tier 3 OCR)</div>
                ) : isWithdrawn ? (
                  <div className="w-full py-2 bg-[#FAF8F4] text-[#111111]/40 rounded-lg text-[10px] font-mono text-center">Withdrawn</div>
                ) : isVoucher ? (
                  <div className="w-full py-2 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-[10px] font-medium text-center">Voucher issued to partner</div>
                ) : (
                  <div className="w-full py-2 bg-[#FAF8F4] text-[#111111]/40 rounded-lg text-[10px] font-mono text-center">Dispatched</div>
                )}
              </div>
            );
          })}
          {filteredSwap.map(r => (
            <div key={r.id} className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-2 opacity-90">
              <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[#111111]/50">{r.id}</span><span className="text-[9px] font-mono bg-black/5 px-1.5 py-0.5 rounded">SWAP</span></div>
              <div><div className="font-bold text-[11px] text-[#111111]">{r.bundleCategory}</div><div className="text-[10px] font-mono text-[#111111]/60">{r.lockerLocation}</div></div>
              <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[#111111]/50">Free</span><span className={'px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ' + (r.status === 'withdrawn' ? 'bg-[#FAF8F4] text-[#111111]/40' : 'bg-emerald-50 text-emerald-800')}>{r.status}</span></div>
              <div className="w-full py-2 bg-[#FAF8F4] text-[#111111]/40 rounded-lg text-[10px] font-mono text-center">{r.status === 'withdrawn' ? 'Withdrawn' : 'Self-collect'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAudit = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {([{ id: 'flags' as const, l: 'Flags ' + riskFlags.filter(f => f.status === 'pending').length }, { id: 'ocr' as const, l: 'OCR ' + ocrQueue.length }, { id: 'fp' as const, l: 'FP' }, { id: 'dedup' as const, l: 'Dedup' }, { id: 'log' as const, l: 'Log ' + auditLog.length }]).map(s => (
          <button key={s.id} onClick={() => setAuditSub(s.id)} className={'px-2.5 py-1 rounded-md text-[10px] whitespace-nowrap font-medium ' + (auditSub === s.id ? 'bg-[#1F6B4A] text-white' : 'bg-black/5 text-[#111111]/70')}>{s.l}</button>
        ))}
        <button onClick={() => setExportModal(true)} className="ml-auto px-2 py-1 rounded-md text-[9px] font-mono bg-[#111111] text-white whitespace-nowrap shrink-0 flex items-center gap-1"><Download className="w-2.5 h-2.5" />Export</button>
      </div>

      {auditSub === 'flags' && (
        <div className="space-y-2">
          {riskFlags.length === 0 ? (
            <div className="p-8 bg-white border border-[#111111]/15 rounded-2xl text-center"><CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" /><p className="text-xs text-[#111111]/60">No active flags</p></div>
          ) : riskFlags.map(flag => (
            <div key={flag.id} className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1 flex-wrap min-w-0"><span className={'px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ' + (flag.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}>{flag.severity}</span><span className="font-mono text-[9px] text-[#111111]/50">{flag.id}</span></div>
                <span className="text-[9px] font-mono text-[#111111]/40 shrink-0">{flag.timestamp}</span>
              </div>
              <div><div className="font-bold text-[11px] text-[#111111] leading-tight">{flag.title}</div><p className="text-[10px] text-[#111111]/60 mt-0.5 leading-relaxed">{flag.description}</p></div>
              <div className="text-[9px] font-mono bg-[#FAF8F4] px-2 py-1 rounded">Target: <strong className="text-[#1F6B4A]">{flag.targetHash}</strong></div>
              {flag.status === 'pending' ? (
                <div className="flex gap-1"><button onClick={() => clearFlagAsFalsePositive(flag.id, fpNote)} className="flex-1 py-1.5 bg-white border border-[#111111]/20 rounded-lg text-[9px] font-medium">Clear FP</button><button onClick={() => routeFlagToTier4(flag.id)} className="flex-1 py-1.5 bg-amber-800 text-white rounded-lg text-[9px] font-medium">? Tier 4</button></div>
              ) : flag.status === 'routed_tier4' ? (
                <div className="py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[9px] font-mono text-center">Routed to Tier 4</div>
              ) : (
                <div className="py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[9px] font-mono flex items-center justify-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Cleared</div>
              )}
            </div>
          ))}
        </div>
      )}

      {auditSub === 'ocr' && (
        <div className="space-y-2">
          {ocrQueue.length === 0 ? (
            <div className="p-8 bg-white border border-[#111111]/15 rounded-2xl text-center"><CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" /><p className="text-xs font-bold text-[#111111]">No pending OCR</p></div>
          ) : ocrQueue.map(r => (
            <div key={r.id} className="p-3 bg-white border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[#111111]/50">{r.id}</span><span className="text-[9px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">T3 Â· OCR</span></div>
              <div><div className="font-bold text-[11px] text-[#111111] uppercase">{r.category.replace('_', ' ')}</div><div className="text-[10px] font-mono text-[#1F6B4A]">{r.hashedObjectId}</div></div>
              <div className="flex items-center justify-between"><span className="font-mono font-bold text-xs text-[#111111]">KES {r.amount.toLocaleString()}</span><span className="text-[9px] font-mono text-[#111111]/50">{r.timestamp}</span></div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-900 leading-relaxed">Awaiting bill photo OCR verification. <strong>SLA:</strong> 4 business hours. Escalates to Tier 4 if unresolved.</div>
              <button onClick={() => completeOcrCheck(r.id)} className="w-full py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Complete OCR & Verify</button>
            </div>
          ))}
        </div>
      )}

      {auditSub === 'fp' && (
        <div className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-2">
          <div className="text-[11px] font-bold text-[#111111]">False-Positive Clearance</div>
          <p className="text-[10px] text-[#111111]/60 leading-relaxed">Shared-meter compounds trigger false clustering flags.</p>
          <textarea rows={3} value={fpNote} onChange={e => setFpNote(e.target.value)} className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-lg p-2 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-[#1F6B4A]" />
          <div className="text-[9px] font-mono text-[#111111]/50">Pattern: <strong className="text-[#1F6B4A]">shared_meter_compound</strong></div>
        </div>
      )}

      {auditSub === 'dedup' && (
        <div className="space-y-2">
          <div className="p-2 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[10px] text-[#111111]/60 flex items-center gap-1"><Layers className="w-3 h-3" /> Cross-funder dedup.</div>
          {dedupItems.map(item => (
            <div key={item.id} className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-1.5">
              <div className="flex justify-between items-start"><span className="font-mono font-bold text-[10px] text-[#1F6B4A]">{item.hashedObjectId}</span><span className={'px-1.5 py-0.5 rounded text-[8px] uppercase font-mono ' + (item.status === 'blocked' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800')}>{item.status.replace('_', ' ')}</span></div>
              <div className="text-[10px] text-[#111111]/70">{item.objectType}</div>
              <div className="text-[9px] font-mono text-[#111111]/50">First: {item.firstFundedBy} Â· {item.firstFundedDate}</div>
              <div className="text-[9px] font-mono text-amber-700">Duplicate: {item.duplicateAttemptDate}</div>
            </div>
          ))}
        </div>
      )}

      {auditSub === 'log' && (
        <div className="space-y-1.5">
          {auditLog.map(e => (
            <div key={e.id} className="p-2 bg-white border border-[#111111]/10 rounded-lg space-y-0.5">
              <div className="flex justify-between text-[9px] font-mono"><span className="text-[#111111]/40">{e.timestamp}</span><span className="px-1 py-0.5 rounded bg-black/5 uppercase">{e.actorRole}</span></div>
              <div className="text-[10px] text-[#111111]">{e.action}</div>
              <div className="text-[9px] font-mono text-[#1F6B4A]">{e.targetHash}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDepot = () => (
    <div className="p-4 space-y-3">
      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl"><div className="font-semibold text-[#1F6B4A] flex items-center gap-1 text-[11px]"><Boxes className="w-3.5 h-3.5" /> Depot Pipeline</div><p className="text-[10px] text-[#111111]/60 mt-1">Bulk ? inspected ? packed ? loaded.</p></div>
      <div className="grid grid-cols-2 gap-2">
        {[{ Icon: Package, l: 'Received', v: depotCounts.receivedUnits, c: 'text-[#111111]' }, { Icon: Check, l: 'Checked', v: depotCounts.qualityCheckedUnits, c: 'text-[#1F6B4A]' }, { Icon: Layers, l: 'Packed', v: depotCounts.packedBundles, c: 'text-[#111111]' }, { Icon: Truck, l: 'Loaded', v: depotCounts.loadedLockerUnits, c: 'text-emerald-700' }].map(row => {
          const I = row.Icon;
          return (<div key={row.l} className="p-3 bg-white border border-[#111111]/15 rounded-xl"><div className="flex items-center gap-1 text-[9px] uppercase font-mono text-[#111111]/50"><I className="w-2.5 h-2.5" />{row.l}</div><div className={'font-mono text-xl font-bold mt-1 ' + row.c}>{row.v}</div></div>);
        })}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center"><h3 className="text-[10px] font-mono uppercase font-bold text-[#111111]/60">Locker Stock</h3><span className="text-[9px] font-mono text-[#111111]/40">Low &lt; 5</span></div>
        {lockerStocks.map((s, i) => {
          const low = s.available <= s.lowStockThreshold;
          return (
            <div key={i} className={'p-2.5 rounded-lg border ' + (low ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#111111]/10')}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold text-[#111111] truncate">{s.location}</div><div className="text-[9px] font-mono text-[#111111]/50 truncate">{s.bundleType}</div></div>
                <div className="text-right shrink-0"><div className="font-mono text-xs font-bold text-[#111111]">{s.available}<span className="text-[#111111]/40">/{s.capacity}</span></div>{low && <div className="text-[8px] font-mono text-amber-700 uppercase font-bold">Low</div>}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTill = () => (
    <div className="p-4 space-y-3">
      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl"><div className="font-semibold text-[#1F6B4A] flex items-center gap-1 text-[11px]"><Store className="w-3.5 h-3.5" /> Partner Till</div><p className="text-[10px] text-[#111111]/60 mt-1">R.U.T.H 4.5 â€” voucher redemption.</p></div>

      <form onSubmit={handleRedeem} className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-2">
        <div><label className="text-[9px] font-mono uppercase text-[#111111]/50">Partner</label><select value={tillPartner} onChange={e => setTillPartner(e.target.value)} className="w-full bg-[#FAF8F4] border border-[#111111]/15 rounded-lg px-2 py-2 text-[10px] font-mono mt-1 outline-none"><option>Naivas Kibera</option><option>Kenyatta Hospital</option></select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[9px] font-mono uppercase text-[#111111]/50">PIN</label><input value={tillPin} onChange={e => setTillPin(e.target.value)} placeholder="4 digits" maxLength={4} className="w-full bg-[#FAF8F4] border border-[#111111]/15 rounded-lg px-2 py-2 text-[10px] font-mono mt-1 outline-none" /></div>
          <div><label className="text-[9px] font-mono uppercase text-[#111111]/50">Amount (KES)</label><input type="number" value={tillAmount} onChange={e => setTillAmount(e.target.value)} placeholder="0" className="w-full bg-[#FAF8F4] border border-[#111111]/15 rounded-lg px-2 py-2 text-[10px] font-mono mt-1 outline-none" /></div>
        </div>
        <button type="submit" disabled={!tillPin || !tillAmount} className="w-full py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[10px] font-semibold disabled:opacity-40">Redeem Voucher</button>
      </form>

      {tillResult && (
        <div className={'p-3 rounded-xl flex items-start gap-2 ' + (tillResult.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200')}>
          {tillResult.ok ? <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
          <div className="flex-1"><div className={'text-[10px] font-bold ' + (tillResult.ok ? 'text-emerald-900' : 'text-rose-900')}>{tillResult.ok ? 'Voucher accepted' : 'Voucher rejected'}</div>{!tillResult.ok && <p className="text-[9px] text-rose-900/70 mt-0.5">{tillResult.reason}</p>}</div>
          <button onClick={() => setTillResult(null)} className="text-[#111111]/40 shrink-0" aria-label="Dismiss"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="text-[9px] font-mono uppercase text-[#111111]/50">Recent redemptions</div>
        {voucherRedemptions.length === 0 ? (
          <div className="p-3 bg-white border border-[#111111]/10 rounded-lg text-center"><p className="text-[10px] text-[#111111]/40">No redemptions yet</p></div>
        ) : voucherRedemptions.slice(0, 4).map(r => (
          <div key={r.id} className="p-2 bg-white border border-[#111111]/10 rounded-lg flex justify-between text-[10px]">
            <div><div className="font-mono font-bold text-[#111111]">{r.voucherId} Â· {r.pin}</div><div className="text-[9px] text-[#111111]/50">{r.partnerName} Â· {r.timestamp}</div></div>
            <span className={'text-[8px] font-mono uppercase px-1.5 py-0.5 rounded self-start ' + (r.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800')}>{r.status}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="text-[9px] font-mono uppercase text-[#111111]/50">Issued vouchers</div>
          <div className="text-[9px] font-mono text-[#111111]/40">{vouchers.filter(v => v.status === 'active').length} active Â· {vouchers.length} total</div>
        </div>
        {vouchers.length === 0 ? (
          <div className="p-3 bg-white border border-[#111111]/10 rounded-lg text-center">
            <p className="text-[10px] text-[#111111]/40">No vouchers issued yet</p>
          </div>
        ) : vouchers.map(v => (
          <div key={v.id} className={'p-2 rounded-lg border ' + (v.status === 'active' ? 'bg-purple-50 border-purple-200' : 'bg-[#FAF8F4] border-[#111111]/10 opacity-60')}>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-[#111111] truncate">{v.partnerName}</div>
                <div className="text-[9px] font-mono text-[#111111]/50">PIN <strong className="text-purple-700">{v.pin}</strong> Â· {v.description}</div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-[10px] font-mono font-bold text-[#111111]">KES {v.maxValue.toLocaleString()}</div>
                <span className={'text-[8px] font-mono uppercase ' + (v.status === 'active' ? 'text-purple-700 font-bold' : 'text-[#111111]/50')}>{v.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMatrix = () => (
    <div className="p-4 space-y-3">
      <div className="p-3 bg-white border border-[#111111]/15 rounded-xl"><h3 className="text-[11px] font-bold text-[#111111]">Separation of Duties</h3><p className="text-[10px] text-[#111111]/60 mt-1">No role holds both identity and payment authority.</p></div>
      <div className="p-3 bg-white border border-[#111111]/15 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-[9px]">
          <thead className="text-[#111111]/50 uppercase font-mono"><tr><th className="pb-2">Role</th><th className="pb-2 text-center">Id</th><th className="pb-2 text-center">Pay</th><th className="pb-2 text-center">Flag</th><th className="pb-2 text-center">Log</th></tr></thead>
          <tbody className="divide-y divide-[#111111]/5">
            {[{ r: 'Enrolment', p: [true, false, false, false] }, { r: 'Fulfilment', p: [false, true, false, false] }, { r: 'Audit', p: [false, false, true, true] }].map(row => (
              <tr key={row.r}><td className="py-2 font-semibold text-[#111111] text-[10px]">{row.r}</td>{row.p.map((has, i) => <td key={i} className={'py-2 text-center font-mono font-bold ' + (has ? 'text-emerald-700' : 'text-rose-700')}>{has ? '?' : 'Ã—'}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-900 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Enforced by login gate</div>
    </div>
  );

  const renderTiers = () => (
    <div className="p-4 space-y-2">
      {[{ n: 1, tag: 'Low', title: 'Self-declared', desc: 'Standard bundles. 7-day rate limit + 5% sample.' }, { n: 2, tag: 'Object', title: 'Institutional check', desc: 'Utility/school/hospital < KES 5,000.' }, { n: 3, tag: 'High', title: 'OCR check', desc: 'Amount > KES 5,000. Automated bill photo.' }, { n: 4, tag: 'Anomaly', title: 'Independent panel', desc: 'Flagged anomalies. Off-system review.' }].map(row => (
        <div key={row.n} className="p-3 bg-white border border-[#111111]/15 rounded-xl">
          <div className="flex justify-between items-center"><span className="font-bold text-[#1F6B4A] font-mono text-[11px]">Tier {row.n}</span><span className="text-[8px] font-mono bg-black/5 px-1.5 py-0.5 rounded uppercase">{row.tag}</span></div>
          <div className="font-semibold text-[11px] text-[#111111] mt-1">{row.title}</div>
          <p className="text-[10px] text-[#111111]/60 mt-0.5 leading-relaxed">{row.desc}</p>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (tab === 'queue') { if (staffRole === 'enrolment') return renderEnrolment(); if (staffRole === 'audit') return renderAudit(); return renderFulfilment(); }
    if (tab === 'depot') return renderDepot();
    if (tab === 'till') return renderTill();
    if (tab === 'matrix') return renderMatrix();
    return renderTiers();
  };

  const pendingFlags = riskFlags.filter(f => f.status === 'pending').length;
  const totalRecords = poolRequests.length + swapRequests.length;

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
      <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
        <div className="bg-[#F5F5F5] rounded-[2rem] overflow-hidden flex flex-col h-[680px]">
          <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-medium text-[#111111]/60"><span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span className="text-[8px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded uppercase font-bold">{roleLabel[staffRole as Role]}</span></div>
          <div className="px-5 pb-2 border-b border-[#111111]/10 flex items-center justify-between"><div><h1 className="font-serif text-base font-bold text-[#111111]">Operations</h1><p className="text-[9px] font-mono text-[#111111]/40">Logged in Â· {staffId}</p></div><button onClick={logoutStaff} className="text-rose-600 hover:underline text-[9px] font-mono flex items-center gap-0.5"><LogOut className="w-3 h-3" />Logout</button></div>
          <div className="px-3 py-2 border-b border-[#111111]/10 bg-white"><div className="text-[9px] font-mono text-[#111111]/50 uppercase">Current role: <strong className="text-[#1F6B4A]">{roleLabel[staffRole as Role]}</strong> Â· logout to switch</div></div>
          <div key={staffRole + tab + auditSub} className="flex-1 overflow-y-auto animate-in fade-in duration-200">{renderContent()}</div>
          <div className="border-t border-[#111111]/10 bg-white"><div className="grid grid-cols-5">{[{ id: 'queue' as Tab, Icon: Activity, l: 'Queue' }, { id: 'depot' as Tab, Icon: Boxes, l: 'Depot' }, { id: 'till' as Tab, Icon: Store, l: 'Till' }, { id: 'matrix' as Tab, Icon: Layers, l: 'Matrix' }, { id: 'tiers' as Tab, Icon: ShieldCheck, l: 'Tiers' }].map(t => { const I = t.Icon; const active = tab === t.id; return (<button key={t.id} onClick={() => setTab(t.id)} className={'py-2 flex flex-col items-center gap-0.5 ' + (active ? 'text-[#1F6B4A]' : 'text-[#111111]/40')}><I className="w-3.5 h-3.5" /><span className="text-[8px] font-medium">{t.l}</span></button>); })}</div></div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="p-4 bg-white border border-[#111111]/15 rounded-xl space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#111111] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#1F6B4A]" /> Server View</h3><button onClick={() => setShowRaw(!showRaw)} className="text-[10px] text-[#1F6B4A] hover:underline flex items-center gap-1">{showRaw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}{showRaw ? 'Hide' : 'Reveal'}</button></div>
          <div className="space-y-1.5 pt-2 border-t border-[#111111]/10 font-mono text-[10px]">
            <div className="flex justify-between"><span className="text-[#111111]/50">Role</span><span className="font-bold text-[#111111]">{roleLabel[staffRole as Role]}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Staff ID</span><span className="text-[#111111]">{staffId}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Records</span><span className="text-[#111111]">{totalRecords}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Pending flags</span><span className="text-[#111111]">{pendingFlags}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Pending OCR</span><span className="text-[#111111]">{ocrQueue.length}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Pledges awaiting</span><span className="text-[#111111]">{awaitingPledges.length}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Match interests</span><span className="text-[#111111]">{matchInterests?.length ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Vouchers active</span><span className="text-[#111111]">{vouchers.filter(v => v.status === 'active').length}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Raw PII columns</span><span className="font-bold text-rose-600">NONE</span></div>
          </div>
          {showRaw && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-800 leading-relaxed mt-2"><strong>Invariant:</strong> no column stores name, phone, or raw object number.</div>}
        </div>

        <div className="p-4 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl space-y-1.5">
          <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">Spec Coverage</h4>
          {['Separate credentials (4.8)', 'Login gate', 'Verification tiers 1â€“4 (4.8)', 'OCR completion (4.8)', 'Deduplication (4.7)', 'Audit log + export (4.7)', 'POCAMLA export (6)', 'Partner vouchers (4.5)', 'Pledge matching (4.4)', 'Match interests panel', 'Depot + locker stock (4.2)'].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111111]/70"><div className="w-1 h-1 rounded-full bg-[#1F6B4A]" />{f}</div>
          ))}
        </div>

        <button onClick={() => { setTab('queue'); setAuditSub('flags'); setFilter('all'); setReceipt(null); setShowRaw(false); setTillResult(null); setIssueModal(null); setIssueSuccess(null); }} className="w-full py-2 text-xs text-[#111111]/60 hover:text-[#111111] border border-[#111111]/15 rounded-lg bg-white flex items-center justify-center gap-1.5"><RotateCcw className="w-3 h-3" /> Reset view</button>
      </div>

      {issueModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-base font-bold text-[#111111]">Issue Partner Voucher</h3>
              <button onClick={() => { setIssueModal(null); setIssueSuccess(null); }} className="text-[#111111]/40" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] text-[#111111]/60 leading-relaxed">R.U.T.H 4.5 â€” requester receives a PIN to redeem at the partner till. Settled monthly in bulk.</p>
            <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[10px] font-mono space-y-1">
              <div className="flex justify-between"><span className="text-[#111111]/50">Request</span><span className="font-bold">{issueModal.requestId}</span></div>
              <div className="flex justify-between"><span className="text-[#111111]/50">Value</span><span className="font-bold">KES {issueModal.amount.toLocaleString()}</span></div>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-[#111111]/50">Partner</label>
              <select value={issuePartner} onChange={e => setIssuePartner(e.target.value as any)} className="w-full bg-[#FAF8F4] border border-[#111111]/15 rounded-lg px-3 py-2 text-xs font-mono mt-1 outline-none">
                <option>Naivas Kibera</option><option>Kenyatta Hospital</option>
              </select>
            </div>
            {issueSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="text-[10px] font-bold text-emerald-900">Voucher issued</div>
                <div className="text-[10px] font-mono text-emerald-900/80 mt-0.5">PIN: <strong>{issueSuccess}</strong></div>
                <div className="text-[9px] text-emerald-900/60 mt-1">Redeemable at {issuePartner}.</div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setIssueModal(null); setIssueSuccess(null); }} className="flex-1 py-2 bg-white border border-[#111111]/20 rounded-lg text-[10px] font-medium">Close</button>
              <button onClick={() => { const v = issueVoucher(issueModal.requestId, issuePartner, issuePartner === 'Kenyatta Hospital' ? 'hospital' : 'retailer'); if (v) setIssueSuccess(v.pin); }} disabled={!!issueSuccess} className="flex-1 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[10px] font-semibold disabled:opacity-40">{issueSuccess ? 'Issued ?' : 'Issue'}</button>
            </div>
          </div>
        </div>
      )}

      {exportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between"><h3 className="font-serif text-lg font-bold">Export Compliance Records</h3><button onClick={() => setExportModal(false)} className="text-[#111111]/40" aria-label="Close"><X className="w-4 h-4" /></button></div>
            <p className="text-xs text-[#111111]/70">CSV of institutional settlements. <strong>Export is logged to the audit trail.</strong></p>
            <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[11px] text-[#111111]/70 font-mono"><strong className="text-[#1F6B4A]">POCAMLA:</strong> shortcode holder carries AML reporting duties.</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setExportModal(false)} className="px-4 py-2 bg-white border border-[#111111]/20 rounded-lg text-xs font-medium">Cancel</button>
              <button onClick={downloadCsv} className="px-4 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-xs font-semibold">{exportSuccess ? 'Downloaded ?' : 'Download & Log'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};






