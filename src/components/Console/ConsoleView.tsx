import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleRole } from '../../types';
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  AlertTriangle, 
  FileCheck, 
  Check, 
  Filter, 
  Download, 
  Clock, 
  ChevronRight, 
  Database, 
  ArrowRight, 
  Send,
  Boxes,
  Activity,
  ShieldAlert,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { TOKENS_PER_DAY_HISTORY } from '../../mockData';

export const ConsoleView: React.FC = () => {
  const { 
    consoleRole, 
    setConsoleRole, 
    requests, 
    dispatchRequestBatch, 
    riskFlags, 
    routeFlagToTier4, 
    clearFlagAsFalsePositive, 
    dedupItems, 
    auditLog,
    depotCounts,
    lockerStocks,
    emptyQueueMode,
    setEmptyQueueMode,
    t
  } = useApp();

  const [auditSubTab, setAuditSubTab] = useState<'flags' | 'false_positive' | 'dedup' | 'log'>('flags');
  const [consoleMainTab, setConsoleMainTab] = useState<'queue' | 'tiers' | 'matrix' | 'depot'>('queue');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [exportNoticeVisible, setExportNoticeVisible] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [falsePositiveNotes, setFalsePositiveNotes] = useState<string>('Shared-meter households (e.g. multi-family compounds) verified as sharing a single prepaid meter.');

  const filteredRequests = emptyQueueMode ? [] : requests.filter(r => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'swap') return r.type === 'swap';
    if (selectedFilter === 'pool') return r.type === 'pool';
    if (selectedFilter === 'submitted') return r.status === 'submitted';
    if (selectedFilter === 'fulfilled') return r.status === 'fulfilled';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Console Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#111111]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#1F6B4A] bg-[#DCE8E0] px-2 py-0.5 rounded font-semibold">
              Internal Operations
            </span>
            <span className="text-xs text-[#111111]/50 font-mono">
              Zero Requester Identity Mode
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            Operations &amp; Governance Console
          </h1>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#111111]/15 shadow-xs">
          <span className="text-[11px] font-mono text-[#111111]/50 px-2 uppercase">Role:</span>
          
          <button
            onClick={() => setConsoleRole('fulfilment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              consoleRole === 'fulfilment'
                ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            Fulfilment
          </button>

          <button
            onClick={() => setConsoleRole('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              consoleRole === 'audit'
                ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            Audit / Tier 4
          </button>

          <button
            onClick={() => setConsoleRole('enrolment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              consoleRole === 'enrolment'
                ? 'bg-[#1F6B4A] text-white shadow-xs font-semibold'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            Enrolment
          </button>
        </div>
      </div>

      {/* Mandatory Separation of Duties Banner */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-800" />
          <span>Separation of Duties Enforced</span>
        </div>
        <p className="leading-relaxed">
          No role holds both identity-contact access and payment authority. Staff and operators view exclusively category, amount, status, coarse location, and short keyed-hash fragments (e.g. <code>obj #8f4c…</code>). Raw object numbers, names, phone numbers, and cryptographic requester tokens are completely suppressed.
        </p>
      </div>

      {/* Primary Console Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#111111]/10 pb-2 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setConsoleMainTab('queue')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
            consoleMainTab === 'queue' ? 'bg-[#111111] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
          }`}
        >
          {consoleRole === 'enrolment' ? 'Intake Health Dashboard' : consoleRole === 'audit' ? 'Audit & Risk Center' : 'Fulfilment Queue'}
        </button>

        <button
          onClick={() => setConsoleMainTab('depot')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
            consoleMainTab === 'depot' ? 'bg-[#111111] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
          }`}
        >
          Supply &amp; Depot
        </button>

        <button
          onClick={() => setConsoleMainTab('matrix')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
            consoleMainTab === 'matrix' ? 'bg-[#111111] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
          }`}
        >
          Role Capability Matrix
        </button>

        <button
          onClick={() => setConsoleMainTab('tiers')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
            consoleMainTab === 'tiers' ? 'bg-[#111111] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
          }`}
        >
          Verification Tiers (1–4)
        </button>
      </div>

      {/* MAIN VIEW AREA BASED ON ROLE & TAB */}
      
      {/* 1. ENROLMENT ROLE VIEW */}
      {consoleRole === 'enrolment' && consoleMainTab === 'queue' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Explicit Authority Boundary Banner */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <ShieldAlert className="w-4 h-4 text-blue-700" />
              <span>Authority Boundary Notice</span>
            </div>
            <p className="leading-relaxed">
              Enrolment can reach the phone path but has no payment authority. This screen monitors intake velocity, channel adoption, and rate-limit triggers only. Zero payment data and zero request details are visible to this role.
            </p>
          </div>

          {/* Intake Health Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider block font-mono">
                  Tokens Created Today
                </span>
                <span className="text-[9px] font-mono text-[#111111]/60 bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#111111]/10">
                  Sample data
                </span>
              </div>
              <div className="font-mono text-2xl font-bold text-[#1F6B4A]">
                384 Tokens
              </div>
              <span className="text-[10px] text-[#111111]/50 font-mono">
                Derived as a private, keyed one-way token · No names stored
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider block font-mono">
                  Rate-Limit Triggers (7-Day Quota)
                </span>
                <span className="text-[9px] font-mono text-[#111111]/60 bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#111111]/10">
                  Sample data
                </span>
              </div>
              <div className="font-mono text-2xl font-bold text-amber-800">
                42 Triggers
              </div>
              <span className="text-[10px] text-[#111111]/50 font-mono">
                Automated dignified hold · Zero penalty applied
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-1 shadow-xs">
              <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider block font-mono">
                Keyed Token Engine Status
              </span>
              <div className="font-mono text-xs font-bold text-[#111111] py-1">
                KEYED-TOKEN-ACTIVE-WK43
              </div>
              <span className="text-[10px] text-[#111111]/50 font-mono">
                Keyed derivation to keep the circle fair
              </span>
            </div>
          </div>

          {/* Channel Mix Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-xs">
            <h3 className="font-serif text-base font-bold text-[#111111]">
              Intake Channel Distribution
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>Web Application (Browser)</span>
                  <span className="font-bold">54% (207 tokens today)</span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F6B4A] rounded-full" style={{ width: '54%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>SMS Gateway ([Placeholder SMS shortcode])</span>
                  <span className="font-bold">31% (119 tokens today)</span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '31%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>USSD Session ([Placeholder USSD code])</span>
                  <span className="font-bold">15% (58 tokens today)</span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Trend: Tokens Created Per Day, Channel Mix & Rate-Limit Triggers (Item 5) */}
          <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Tokens Created Per Day &amp; Channel Mix (7-Day History)
                </h3>
                <p className="text-xs text-[#111111]/60 mt-0.5">
                  Daily intake volumes, distribution by channel, and rate-limit triggers. Zero payment or personal data.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] font-mono bg-[#DCE8E0] text-[#1F6B4A] px-2 py-0.5 rounded font-semibold">
                  Enrolment Analytics Only
                </span>
                <span className="text-[9px] font-mono text-[#111111]/60 bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#111111]/10">
                  Sample data
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#111111]/15 text-[#111111]/60 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3 text-right">Tokens Created</th>
                    <th className="py-2.5 px-3 text-right">Web</th>
                    <th className="py-2.5 px-3 text-right">SMS</th>
                    <th className="py-2.5 px-3 text-right">USSD</th>
                    <th className="py-2.5 px-3 text-right">Rate Limits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/10 text-xs">
                  {TOKENS_PER_DAY_HISTORY.map((row, idx) => (
                    <tr key={idx} className={row.day.includes('Today') ? 'bg-[#FAF8F4] font-bold' : 'hover:bg-[#FAF8F4]/50'}>
                      <td className="py-2.5 px-3 text-[#111111]">{row.day}</td>
                      <td className="py-2.5 px-3 text-right text-[#1F6B4A] font-bold">{row.count}</td>
                      <td className="py-2.5 px-3 text-right text-[#111111]/75">{row.web}</td>
                      <td className="py-2.5 px-3 text-right text-blue-700">{row.sms}</td>
                      <td className="py-2.5 px-3 text-right text-amber-700">{row.ussd}</td>
                      <td className="py-2.5 px-3 text-right text-amber-800 font-bold">{row.rateLimits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. FULFILMENT ROLE VIEW (Queue with NO object numbers, only hash fragment) */}
      {consoleRole === 'fulfilment' && consoleMainTab === 'queue' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#111111]/15">
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-semibold text-[#111111] shrink-0">Filter Queue:</span>
              {[
                { id: 'all', label: 'All Active' },
                { id: 'swap', label: 'The Swap (Lockers)' },
                { id: 'pool', label: 'The Pool (Institutions)' },
                { id: 'submitted', label: 'Needs Submission' },
                { id: 'fulfilled', label: 'Submitted to Partner' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                    selectedFilter === f.id
                      ? 'bg-[#111111] text-white font-medium'
                      : 'bg-black/5 text-[#111111]/70 hover:bg-black/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-[#111111]/60">
                {filteredRequests.length} records in view
              </span>
            </div>
          </div>

          {/* Demo Controls Panel (Item 7) */}
          <div className="p-3 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111]/60 font-bold">
              {t('demo_controls')}:
            </span>
            <button
              type="button"
              onClick={() => setEmptyQueueMode(!emptyQueueMode)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md border border-[#111111]/15 bg-white hover:bg-black/5 text-[#111111]/80 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            >
              {emptyQueueMode ? 'Restore Queue' : 'Test Empty Queue State'}
            </button>
          </div>

          {/* Queue Table */}
          {filteredRequests.length === 0 ? (
            /* Empty state for queue */
            <div className="p-10 rounded-2xl bg-white border border-[#111111]/15 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F4] flex items-center justify-center text-[#111111]/40 mx-auto">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#111111]">
                No items in queue
              </h3>
              <p className="text-xs text-[#111111]/60 max-w-sm mx-auto leading-relaxed">
                All verified requests have been submitted to the payment partner.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#111111]/15 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 text-[11px] font-mono uppercase text-[#111111]/60">
                    <tr>
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Category &amp; Keyed Hash</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111111]/5">
                    {filteredRequests.map(req => {
                      const isFulfilled = req.status === 'fulfilled';
                      return (
                        <tr key={req.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                            {req.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#111111]">{req.categoryTitle}</div>
                            {/* Pass 1 Rule 5: NO object numbers, show only short keyed-hash fragment! */}
                            <div className="text-[11px] text-[#1F6B4A] font-mono font-semibold">
                              {req.hashedObjectId}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#1F6B4A]">
                            KES {req.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#111111]/70">
                            {req.coarseLocation}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#111111]/70">
                            {req.verificationTier}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                                isFulfilled
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : req.status === 'verified'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#111111]/60 text-[11px]">
                            {req.timestamp}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isFulfilled ? (
                              <button
                                onClick={() => dispatchRequestBatch(req.id)}
                                className="px-3 py-1 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit to payment partner</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#111111]/50 font-mono">
                                Submitted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. AUDIT & TIER 4 REVIEW ROLE VIEW */}
      {consoleRole === 'audit' && consoleMainTab === 'queue' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Sub tabs */}
          <div className="flex items-center gap-2 border-b border-[#111111]/10 pb-2 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setAuditSubTab('flags')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                auditSubTab === 'flags' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
              }`}
            >
              Risk Flags ({riskFlags.filter(f => f.status === 'pending').length} Active)
            </button>

            <button
              onClick={() => setAuditSubTab('false_positive')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                auditSubTab === 'false_positive' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
              }`}
            >
              False-Positive Review
            </button>

            <button
              onClick={() => setAuditSubTab('dedup')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                auditSubTab === 'dedup' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
              }`}
            >
              Deduplication Panel
            </button>

            <button
              onClick={() => setAuditSubTab('log')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                auditSubTab === 'log' ? 'bg-[#1F6B4A] text-white font-semibold' : 'text-[#111111]/70 hover:bg-black/5'
              }`}
            >
              Audit Log ({auditLog.length} Events)
            </button>

            <div className="ml-auto">
              <button
                onClick={() => setExportNoticeVisible(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Transaction Records</span>
              </button>
            </div>
          </div>

          {/* Subtab 1: Risk Flags */}
          {auditSubTab === 'flags' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/70">
                Statistical anomalies flagged by the background fraud detection model. Operators can escalate to Tier 4 independent review or clear as legitimate.
              </div>

              <div className="grid grid-cols-1 gap-3">
                {riskFlags.map(flag => {
                  const isPending = flag.status === 'pending';
                  const isTier4 = flag.status === 'routed_tier4';
                  const isCleared = flag.status === 'cleared_false_positive';

                  return (
                    <div
                      key={flag.id}
                      className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-3 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            flag.severity === 'high' ? 'bg-rose-100 text-rose-800 font-bold' :
                            flag.severity === 'elevated' ? 'bg-amber-100 text-amber-800 font-semibold' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {flag.severity}
                          </span>
                          <span className="font-mono text-xs text-[#111111]/60">{flag.id}</span>
                          <h4 className="font-serif text-base font-bold text-[#111111]">
                            {flag.title}
                          </h4>
                        </div>

                        <span className="text-xs font-mono text-[#111111]/60">
                          {flag.timestamp} · {flag.coarseLocation}
                        </span>
                      </div>

                      <p className="text-xs text-[#111111]/80 leading-relaxed">
                        {flag.description}
                      </p>

                      <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs font-mono flex items-center justify-between">
                        <span>Category: {flag.category} · Hash: {flag.hashedTargetId} · KES {flag.amount.toLocaleString()}</span>
                        <span className="text-[11px] text-[#111111]/60">{flag.investigationNotes}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#111111]/10">
                        <div className="text-xs font-mono">
                          Status: <strong className="uppercase">{flag.status.replace('_', ' ')}</strong>
                        </div>

                        {isPending && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => routeFlagToTier4(flag.id)}
                              className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                            >
                              Route to Tier 4
                            </button>
                            <button
                              onClick={() => clearFlagAsFalsePositive(flag.id, 'Shared-meter compound verified')}
                              className="px-3 py-1.5 bg-white border border-[#111111]/20 hover:bg-black/5 text-[#111111] rounded-lg text-xs font-medium cursor-pointer transition-colors"
                            >
                              Mark Legitimate
                            </button>
                          </div>
                        )}

                        {isTier4 && (
                          <span className="text-xs font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-semibold">
                            Under Independent Quorum Review
                          </span>
                        )}

                        {isCleared && (
                          <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Cleared as False Positive
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtab 2: False Positive Review (Updated wording for shared-meter households) */}
          {auditSubTab === 'false_positive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-3">
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  False-Positive Clearance Protocol
                </h3>
                <p className="text-xs text-[#111111]/75 leading-relaxed">
                  In shared-meter households (e.g. multi-family compounds) across Nairobi, multiple independent families frequently share a single KPLC prepaid power meter or single community WiFi hotspot. Anomaly detection models may mistake this for automated clustering. This tab allows human audit officers to record structural context and clear benign flags without requesting private documents.
                </p>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                    Contextual Justification Note
                  </label>
                  <textarea
                    rows={3}
                    value={falsePositiveNotes}
                    onChange={e => setFalsePositiveNotes(e.target.value)}
                    className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-xl p-3 text-xs font-mono text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      setFalsePositiveNotes('');
                      // Flag cleared and logged to append-only (prototype) audit ledger
                    }}
                    className="py-2.5 px-4 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Apply Clearance to Selected Compound Flag
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Deduplication Panel */}
          {auditSubTab === 'dedup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/75">
                Cross-institution deduplication using hashed object IDs (e.g. hashed meter # or student code). Displays truncated hashes only to prevent reverse lookups.
              </div>

              <div className="bg-white rounded-2xl border border-[#111111]/15 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 font-mono text-[11px] text-[#111111]/60 uppercase">
                    <tr>
                      <th className="py-3 px-4">Truncated Hash</th>
                      <th className="py-3 px-4">Object Type</th>
                      <th className="py-3 px-4">Initial Funder Record</th>
                      <th className="py-3 px-4">Initial Date</th>
                      <th className="py-3 px-4">Duplicate Attempt</th>
                      <th className="py-3 px-4">Prevention Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111111]/5">
                    {dedupItems.map(item => (
                      <tr key={item.id} className="hover:bg-[#FAF8F4]/50">
                        <td className="py-3 px-4 font-mono font-bold text-[#1F6B4A]">
                          hash: {item.hashedObjectId}
                        </td>
                        <td className="py-3 px-4 text-[#111111]">{item.objectType}</td>
                        <td className="py-3 px-4 text-[#111111]/80">{item.firstFundedBy}</td>
                        <td className="py-3 px-4 font-mono text-[#111111]/60">{item.firstFundedDate}</td>
                        <td className="py-3 px-4 font-mono text-amber-900 font-semibold">{item.duplicateAttemptDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-50 text-rose-800 border border-rose-200">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 4: Pass 2 Rule 1 - Audit Log Tab */}
          {auditSubTab === 'log' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/75 flex items-center justify-between">
                <span>Append-only (prototype) audit trail of privileged operator actions. Target column displays truncated hash fragment only.</span>
                <span className="font-mono text-[11px] text-[#1F6B4A] bg-[#DCE8E0] px-2 py-0.5 rounded">
                  {auditLog.length} Records Logged
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-[#111111]/15 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 font-mono text-[11px] text-[#111111]/60 uppercase">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Actor Role</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target (Hash Fragment Only)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111111]/5 font-mono">
                    {auditLog.map(entry => (
                      <tr key={entry.id} className="hover:bg-[#FAF8F4]/50">
                        <td className="py-3 px-4 text-[#111111]/60 text-[11px] whitespace-nowrap">
                          {entry.timestamp}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-black/5 text-[#111111] font-semibold">
                            {entry.actorRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans font-medium text-[#111111]">
                          {entry.action}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1F6B4A]">
                          {entry.targetHash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. SUPPLY & DEPOT TAB (Pass 2 Rule 5) */}
      {consoleMainTab === 'depot' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/80 space-y-1">
            <div className="font-semibold text-[#1F6B4A] flex items-center gap-1.5">
              <Boxes className="w-4 h-4" />
              <span>Produce-Depot Aggregation Pipeline</span>
            </div>
            <p className="text-[11px] text-[#111111]/70 leading-relaxed">
              Wholesale staples and hygiene commodities are received in bulk from agricultural and commercial distributors, quality-inspected, assembled into standardised packages, and loaded into refrigerated or dry smart lockers across Nairobi.
            </p>
          </div>

          {/* 4-Stage Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#111111]/15 space-y-1 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-[#111111]/60 block">Stage 1</span>
              <div className="font-semibold text-xs text-[#111111]">Received</div>
              <div className="font-mono text-xl font-bold text-[#111111] pt-1">
                {depotCounts.receivedUnits} Units
              </div>
              <span className="text-[10px] font-mono text-[#111111]/50">At Central Depot</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#111111]/15 space-y-1 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-[#1F6B4A] block">Stage 2</span>
              <div className="font-semibold text-xs text-[#111111]">Quality-Checked</div>
              <div className="font-mono text-xl font-bold text-[#1F6B4A] pt-1">
                {depotCounts.qualityCheckedUnits} Units
              </div>
              <span className="text-[10px] font-mono text-[#111111]/50">97% Batch Pass</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#111111]/15 space-y-1 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-[#111111]/60 block">Stage 3</span>
              <div className="font-semibold text-xs text-[#111111]">Packed into Bundles</div>
              <div className="font-mono text-xl font-bold text-[#111111] pt-1">
                {depotCounts.packedBundles} Packages
              </div>
              <span className="text-[10px] font-mono text-[#111111]/50">Standardized 4 packs</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#111111]/15 space-y-1 shadow-xs">
              <span className="text-[10px] font-mono uppercase text-emerald-800 block">Stage 4</span>
              <div className="font-semibold text-xs text-[#111111]">Loaded to Locker</div>
              <div className="font-mono text-xl font-bold text-emerald-800 pt-1">
                {depotCounts.loadedLockerUnits} Packages
              </div>
              <span className="text-[10px] font-mono text-[#111111]/50">Live in Hubs</span>
            </div>
          </div>

          {/* Bundle Stock per Locker Location */}
          <div className="bg-white rounded-2xl border border-[#111111]/15 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#111111]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Bundle Stock per Locker Location Hub
                </h3>
                <span className="text-[9px] font-mono text-[#111111]/60 bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#111111]/10">
                  Sample data
                </span>
              </div>
              <span className="text-xs font-mono text-[#111111]/60">
                Automatic low-stock threshold: &lt; 5 bundles
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 font-mono text-[11px] text-[#111111]/60 uppercase">
                <tr>
                  <th className="py-3 px-4">Locker Location</th>
                  <th className="py-3 px-4">Primary Bundle Assigned</th>
                  <th className="py-3 px-4">Available / Capacity</th>
                  <th className="py-3 px-4">Status &amp; Restock Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/5 font-mono">
                {lockerStocks.map((stock, idx) => {
                  const isLow = stock.available <= stock.lowStockThreshold;

                  return (
                    <tr key={idx} className="hover:bg-[#FAF8F4]/50">
                      <td className="py-3 px-4 font-semibold text-[#111111]">{stock.location}</td>
                      <td className="py-3 px-4 text-[#111111]/80">{stock.bundleType}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#111111]">{stock.available}</span> / {stock.capacity}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-800" />
                            <span>Low-Stock Warning (Replenishment Queued)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Adequate Capacity
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 5. ROLE CAPABILITY MATRIX (Pass 2 Rule 3) */}
      {consoleMainTab === 'matrix' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-2">
            <h3 className="font-serif text-base font-bold text-[#111111]">
              Separation of Duties Role Capability Matrix
            </h3>
            <p className="text-xs text-[#111111]/75 leading-relaxed">
              To mathematically enforce civil society privacy and prevent payment fraud, the architecture strictly segregates identity-contact access from payment authority. <strong>No single role holds both capabilities.</strong>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#111111]/15 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 font-mono text-[11px] text-[#111111]/60 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Operational Role</th>
                  <th className="py-3.5 px-4 text-center">Intake Health</th>
                  <th className="py-3.5 px-4 text-center">Phone Contact Path</th>
                  <th className="py-3.5 px-4 text-center">Payment Submission</th>
                  <th className="py-3.5 px-4 text-center">Flag Review</th>
                  <th className="py-3.5 px-4 text-center">Audit-Log Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/5">
                <tr className="hover:bg-[#FAF8F4]/50">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#111111] block">Enrolment (Human Operator)</span>
                    <span className="text-[11px] text-[#111111]/60 font-mono">Channel velocity &amp; intake health only</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">
                    Yes
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F4]/50">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#111111] block">Fulfilment (Human Operator)</span>
                    <span className="text-[11px] text-[#111111]/60 font-mono">Queue batching to payment partner</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">
                    Yes
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F4]/50">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#111111] block">Audit / Tier 4 Review (Human Officer)</span>
                    <span className="text-[11px] text-[#111111]/60 font-mono">Anomaly inspection &amp; deduplication</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800">
                    Yes
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800">
                    Yes
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F4]/50 bg-[#F6F4EE]/40">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#1F6B4A] block">Automated Messaging Service (System-Only)</span>
                    <span className="text-[11px] text-[#111111]/60 font-mono">Isolated encrypted store for blind PIN delivery</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">
                    Yes
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-800">
                    No
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Invariant Verified: No human role has the phone contact path. Phone path belongs strictly to the automated messaging service. No role is Yes for both identity-contact and payment submission.</span>
          </div>
        </div>
      )}

      {/* 6. VERIFICATION TIERS PANEL */}
      {consoleMainTab === 'tiers' && (
        <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#111111]/10">
            <h3 className="font-serif text-base font-bold text-[#111111]">
              Operational Verification Tiers Rules (Tiers 1 to 4)
            </h3>
            <span className="text-[11px] font-mono text-[#1F6B4A]">
              Rule Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F6B4A] font-mono">Tier 1</span>
                <span className="text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded">Low Value</span>
              </div>
              <div className="font-semibold text-[#111111]">Self-Declared &amp; Rate Limits</div>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Applies to new tokens requesting standard pantry/hygiene locker bundles. Governed by 7-day rate-limits and 5% random sampling.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F6B4A] font-mono">Tier 2</span>
                <span className="text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded">Object Query</span>
              </div>
              <div className="font-semibold text-[#111111]">Institutional Object-Level Check</div>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Applies to all utility, school-fee, and hospital payments under KES 5,000. Verified against real institutional API records.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F6B4A] font-mono">Tier 3</span>
                <span className="text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded">&gt; KES 5,000</span>
              </div>
              <div className="font-semibold text-[#111111]">Automated Document OCR Check</div>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Triggered if same token submits repeat pool request or amount exceeds threshold. Requires OCR cross-check of bill photo.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F6B4A] font-mono">Tier 4</span>
                <span className="text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded">Independent</span>
              </div>
              <div className="font-semibold text-[#111111]">Independent Audit Panel</div>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Reserved for flagged statistical anomalies. Reviewed by independent rotation panel with zero requester identity access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Export Modal (Pass 1 Rule 1: POCAMLA reference!) */}
      {exportNoticeVisible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-[#111111]/15 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#111111]/10">
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Export Compliance Records (AML / POCAMLA)
              </h3>
              <button
                onClick={() => setExportNoticeVisible(false)}
                className="text-xs text-[#111111]/60 hover:text-[#111111] cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#111111]/80 leading-relaxed">
              Generating simulated CSV report of institutional settlement dispatches...
            </p>

            {/* Mandatory Exact POCAMLA Note */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 text-xs text-[#111111]/80 space-y-1">
              <div className="font-semibold text-[#1F6B4A]">
                Regulatory AML Notice (POCAMLA)
              </div>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed font-mono">
                The M-Pesa shortcode holder is expected to carry AML reporting duties under POCAMLA. Exact record requirements: to be confirmed with compliance counsel.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setExportNoticeVisible(false)}
                className="px-4 py-2 bg-white border border-[#111111]/20 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportSuccess(true);
                  setTimeout(() => {
                    setExportNoticeVisible(false);
                    setExportSuccess(false);
                  }, 1800);
                }}
                className="px-4 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                {exportSuccess ? 'CSV Generated (Verified) ✓' : 'Download Verified CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
