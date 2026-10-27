import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Sheet } from '../ui/Sheet';
import { Toast } from '../ui/Toast';
import { ConsoleRole } from '../types';
import { 
  Inbox, 
  AlertTriangle, 
  FileText, 
  Truck, 
  ShieldCheck, 
  Download, 
  Filter, 
  Check, 
  Info,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

export const ConsoleShell: React.FC = () => {
  const { 
    requests, 
    riskFlags, 
    auditLog, 
    consoleRole,
    setConsoleRole,
    clearFlagAsFalsePositive, 
    routeFlagToTier4, 
    exportComplianceCsv 
  } = useApp();

  const [activeNav, setActiveNav] = useState<'queue' | 'flags' | 'log' | 'supply' | 'roles'>('queue');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [complianceSheetOpen, setComplianceSheetOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [queueFilter, setQueueFilter] = useState<string>('all');
  const [flagFilter, setFlagFilter] = useState<string>('all');

  const navItems: { id: typeof activeNav; label: string; icon: React.ReactNode }[] = [
    { id: 'queue', label: 'Queue', icon: <Inbox className="w-5 h-5" strokeWidth={1.75} /> },
    { id: 'flags', label: 'Flags', icon: <AlertTriangle className="w-5 h-5" strokeWidth={1.75} /> },
    { id: 'log', label: 'Audit Log', icon: <FileText className="w-5 h-5" strokeWidth={1.75} /> },
    { id: 'supply', label: 'Supply', icon: <Truck className="w-5 h-5" strokeWidth={1.75} /> },
    { id: 'roles', label: 'Roles', icon: <ShieldCheck className="w-5 h-5" strokeWidth={1.75} /> }
  ];

  const handleExportCompliance = () => {
    exportComplianceCsv();
    setToastMsg('Compliance audit CSV generated successfully.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredRequests = requests.filter(r => {
    if (queueFilter === 'all') return true;
    return r.category === queueFilter || r.type === queueFilter;
  });

  const filteredFlags = riskFlags.filter(f => {
    if (flagFilter === 'all') return true;
    return f.status === flagFilter;
  });

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 animate-in fade-in pb-16 select-none">
      
      {/* Left Sidebar Navigation (Collapsible to icons only) */}
      <aside className={`transition-all duration-200 shrink-0 space-y-4 ${isSidebarCollapsed ? 'w-20' : 'w-full md:w-60'}`}>
        <div className="p-3 bg-white rounded-[18px] border border-[#111111]/10 space-y-3">
          
          {/* Header with collapse toggle */}
          <div className="flex items-center justify-between px-2 pt-1">
            {!isSidebarCollapsed && (
              <span className="font-serif font-bold text-lg text-[#111111]">Operations</span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse to icons only"}
              aria-label="Toggle sidebar collapse"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                    isActive 
                      ? 'bg-[#1F6B4A] text-white shadow-xs' 
                      : 'text-[#111111]/70 hover:bg-black/5 hover:text-[#111111]'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={item.label}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Compliance Export Button */}
          {!isSidebarCollapsed && (
            <div className="pt-3 border-t border-[#111111]/10">
              <Button
                fullWidth
                variant="outline"
                size="md"
                onClick={handleExportCompliance}
                icon={<Download className="w-4 h-4" strokeWidth={1.75} />}
              >
                Compliance CSV
              </Button>
            </div>
          )}

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-4">
        
        {/* Role Switcher as Segmented Control in Top Bar */}
        <div className="p-3 bg-white rounded-[18px] border border-[#111111]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
            <span className="text-sm font-bold text-[#111111]">Operator Role:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF8F4] p-1 rounded-xl border border-[#111111]/10">
            {(['enrolment', 'fulfilment', 'audit'] as ConsoleRole[]).map(role => (
              <button
                key={role}
                onClick={() => setConsoleRole(role)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all capitalize cursor-pointer ${
                  consoleRole === role
                    ? 'bg-[#1F6B4A] text-white font-semibold shadow-xs'
                    : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <Toast message={toastMsg} type="success" onDismiss={() => setToastMsg(null)} />
        )}

        {/* 1. QUEUE TABLE */}
        {activeNav === 'queue' && (
          <Card className="p-5 space-y-4">
            
            {/* Filter Chips */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#111111]/60" />
                <span className="text-sm font-medium text-[#111111]/70">Filter:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['all', 'swap', 'utility', 'school'].map(cat => (
                  <Chip
                    key={cat}
                    selected={queueFilter === cat}
                    onClick={() => setQueueFilter(cat)}
                    size="sm"
                  >
                    {cat.toUpperCase()}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Table with Sticky Header & Zebra Rows */}
            <div className="overflow-x-auto rounded-xl border border-[#111111]/10 max-h-[460px]">
              <table className="w-full text-left text-sm font-mono">
                <thead className="sticky top-0 bg-[#FAF8F4] border-b border-[#111111]/10 uppercase text-xs text-[#111111]/70 z-10">
                  <tr>
                    <th className="py-3 px-4">Ref</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/5">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="even:bg-[#FAF8F4]/50 odd:bg-white hover:bg-black/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#1F6B4A]">
                        {req.hashedObjectId || 'obj #8f4c…'}
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-[#111111]">
                        {req.categoryTitle}
                      </td>
                      <td className="py-3 px-4">
                        KES {req.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCE8E0] text-[#1F6B4A]">
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#111111]/60">
                        {req.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 2. FLAGS */}
        {activeNav === 'flags' && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-xl text-[#111111]">Risk Signals</span>
              <div className="flex items-center gap-1.5">
                {['all', 'pending', 'cleared_false_positive'].map(st => (
                  <Chip
                    key={st}
                    selected={flagFilter === st}
                    onClick={() => setFlagFilter(st)}
                    size="sm"
                  >
                    {st.replace('_', ' ').toUpperCase()}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredFlags.map(flag => (
                <div key={flag.id} className="p-4 rounded-xl border border-[#111111]/10 bg-[#FAF8F4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-[#111111]">{flag.title}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      {flag.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-[#111111]/70">{flag.description}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-[#111111]/10 text-sm font-mono">
                    <span className="text-[#1F6B4A]">{flag.hashedTargetId}</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => clearFlagAsFalsePositive(flag.id, 'Shared router identified')}
                      >
                        Clear Flag
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => routeFlagToTier4(flag.id)}
                      >
                        Route Tier 4
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 3. AUDIT LOG */}
        {activeNav === 'log' && (
          <Card className="p-5 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-[#111111]/10 max-h-[460px]">
              <table className="w-full text-left text-sm font-mono">
                <thead className="sticky top-0 bg-[#FAF8F4] border-b border-[#111111]/10 uppercase text-xs text-[#111111]/70 z-10">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/5">
                  {auditLog.map(entry => (
                    <tr key={entry.id} className="even:bg-[#FAF8F4]/50 odd:bg-white hover:bg-black/5 transition-colors">
                      <td className="py-3 px-4 text-[#111111]/60">{entry.timestamp}</td>
                      <td className="py-3 px-4 font-bold text-[#1F6B4A] capitalize">{entry.actorRole}</td>
                      <td className="py-3 px-4 text-[#111111]">{entry.action}</td>
                      <td className="py-3 px-4 text-[#111111]/60">{entry.targetRef || entry.targetHash || 'obj #8f4c…'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 4. SUPPLY & DEPOT PIPELINE */}
        {activeNav === 'supply' && (
          <Card className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-center">
                <span className="text-xs font-mono text-[#111111]/50 block">Stage 1</span>
                <span className="font-bold text-sm text-[#111111]">Received</span>
                <div className="font-mono text-xl font-bold text-[#1F6B4A] mt-1">480</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-center">
                <span className="text-xs font-mono text-[#111111]/50 block">Stage 2</span>
                <span className="font-bold text-sm text-[#111111]">Quality-checked</span>
                <div className="font-mono text-xl font-bold text-[#1F6B4A] mt-1">465</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-center">
                <span className="text-xs font-mono text-[#111111]/50 block">Stage 3</span>
                <span className="font-bold text-sm text-[#111111]">Packed into bundles</span>
                <div className="font-mono text-xl font-bold text-[#1F6B4A] mt-1">420</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-center">
                <span className="text-xs font-mono text-[#111111]/50 block">Stage 4</span>
                <span className="font-bold text-sm text-[#111111]">Loaded to locker</span>
                <div className="font-mono text-xl font-bold text-emerald-800 mt-1">392</div>
              </div>
            </div>
          </Card>
        )}

        {/* 5. ROLES */}
        {activeNav === 'roles' && (
          <Card className="p-5 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-[#111111]/10">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 uppercase text-xs text-[#111111]/70">
                  <tr>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Intake Health</th>
                    <th className="py-3 px-4 text-center">Phone Contact</th>
                    <th className="py-3 px-4 text-center">Payment Submission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/5">
                  <tr className="even:bg-[#FAF8F4]/50 odd:bg-white">
                    <td className="py-3 px-4 font-bold">Enrolment</td>
                    <td className="py-3 px-4 text-center text-emerald-800 font-bold">Yes</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                  </tr>
                  <tr className="even:bg-[#FAF8F4]/50 odd:bg-white">
                    <td className="py-3 px-4 font-bold">Fulfilment</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                    <td className="py-3 px-4 text-center text-emerald-800 font-bold">Yes</td>
                  </tr>
                  <tr className="even:bg-[#FAF8F4]/50 odd:bg-white">
                    <td className="py-3 px-4 font-bold">Audit</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                  </tr>
                  <tr className="bg-[#DCE8E0]/40">
                    <td className="py-3 px-4 font-bold text-[#1F6B4A]">Automated Messaging</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                    <td className="py-3 px-4 text-center text-emerald-800 font-bold">Yes</td>
                    <td className="py-3 px-4 text-center text-rose-800 font-bold">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </main>

    </div>
  );
};
