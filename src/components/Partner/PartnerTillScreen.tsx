import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScanLine, CheckCircle2, AlertCircle, XCircle, ShieldCheck, FileText, Building2, Check, Clock } from 'lucide-react';

export const PartnerTillScreen: React.FC = () => {
  const { 
    partnerPin, 
    setPartnerPin, 
    partnerResult, 
    partnerMessage, 
    redeemPartnerPin,
    partnerStatements,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'terminal' | 'statement'>('terminal');
  const [inputCode, setInputCode] = useState<string>(partnerPin || '8341');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    redeemPartnerPin(inputCode);
  };

  const handleSimulateScan = (code: string) => {
    setInputCode(code);
    redeemPartnerPin(code);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Till Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE8E0] text-[#1F6B4A] text-xs font-medium">
          <ScanLine className="w-3.5 h-3.5" />
          <span>Partner Till / Automated Locker Interface</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
          Partner Portal &amp; Terminal
        </h1>
        <p className="text-xs text-[#111111]/70 max-w-md mx-auto">
          Simulated partner terminal for QuickMart Westlands, KPLC counter, or automated smart locker.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'terminal'
                ? 'bg-white text-[#111111] shadow-xs font-semibold'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Till Terminal (PIN/QR)</span>
          </button>
          <button
            onClick={() => setActiveTab('statement')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'statement'
                ? 'bg-white text-[#111111] shadow-xs font-semibold'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Monthly Statement</span>
          </button>
        </div>
      </div>

      {activeTab === 'terminal' && (
        /* Terminal Card */
        <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-5 shadow-sm max-w-lg mx-auto">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                Enter 4-Digit Voucher PIN or Optical Scan
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  placeholder="e.g. 8341"
                  maxLength={6}
                  className="flex-1 bg-[#FAF8F4] border border-[#111111]/20 rounded-xl px-4 py-3 text-lg font-mono font-bold tracking-widest text-[#111111] text-center focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-colors shrink-0"
                >
                  Validate PIN
                </button>
              </div>
            </div>
          </form>

          {/* Demo Controls Panel (Item 7) */}
          <div className="p-3.5 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-[#111111]/60 uppercase tracking-wider block font-bold">
              {t('demo_controls')}:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSimulateScan('5920')}
                className="px-3 py-1.5 bg-white hover:bg-black/5 text-[#111111] text-xs font-mono rounded-lg border border-[#111111]/15 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
              >
                5920 (Valid Voucher)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateScan('8341')}
                className="px-3 py-1.5 bg-white hover:bg-black/5 text-amber-900 text-xs font-mono rounded-lg border border-amber-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
              >
                8341 (Already Used)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateScan('9999')}
                className="px-3 py-1.5 bg-white hover:bg-black/5 text-rose-900 text-xs font-mono rounded-lg border border-rose-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
              >
                9999 (Invalid Code)
              </button>
            </div>
          </div>

          {/* Redemption Outcome Display */}
          {partnerResult !== 'idle' && (
            <div className="pt-2 animate-in zoom-in-95 duration-150">
              {partnerResult === 'valid' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Valid Voucher Approved</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-mono">
                    {partnerMessage}
                  </p>
                  <div className="text-[11px] text-emerald-800/80 pt-1 border-t border-emerald-200/60 font-mono">
                    Settlement: Batched to partner account via automated clearing house.
                  </div>
                </div>
              )}

              {partnerResult === 'used' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-700" />
                    <span>Already Redeemed</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-mono">
                    {partnerMessage}
                  </p>
                </div>
              )}

              {partnerResult === 'invalid' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                    <XCircle className="w-5 h-5 text-rose-700" />
                    <span>Invalid or Expired PIN</span>
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed font-mono">
                    {partnerMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Absolute Zero Requester Identity Notice */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/70 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1F6B4A] shrink-0 mt-0.5" />
            <span>
              <strong>Zero Requester Data Visible:</strong> Tills and locker doors process voucher PINs blindly. No names, phone numbers, or account linkages are accessible to partner staff.
            </span>
          </div>

        </div>
      )}

      {activeTab === 'statement' && (
        /* Monthly Reconciliation View */
        <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#111111]/10">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                <Building2 className="w-4 h-4 text-[#1F6B4A]" />
                <span>QuickMart Westlands &amp; Locker Network Node</span>
              </div>
              <p className="text-xs text-[#111111]/60">
                Partner clearing ID: PTN-7741 &bull; Automated clearing house reconciliation
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-full bg-[#DCE8E0] text-[#1F6B4A] text-xs font-mono font-medium">
                Simulated partner record
              </span>
              <span className="text-[9px] font-mono text-[#111111]/60 bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#111111]/10">
                Sample data
              </span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#111111]/15 text-[#111111]/60 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Billing Cycle</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Vouchers Redeemed</th>
                  <th className="py-2.5 px-3 text-right">Total Settled (KES)</th>
                  <th className="py-2.5 px-3 text-center">Reimbursement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/10 font-mono">
                {partnerStatements.map((stmt, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F4]/80">
                    <td className="py-3 px-3 font-medium text-[#111111]">{stmt.month}</td>
                    <td className="py-3 px-3 text-[#111111]/70">{stmt.institutionCategory}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#111111]">
                      {stmt.voucherCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1F6B4A]">
                      KES {stmt.totalValueKes.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        stmt.reimbursementStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : stmt.reimbursementStatus === 'Approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {stmt.reimbursementStatus === 'Paid' ? (
                          <Check className="w-3 h-3" />
                        ) : stmt.reimbursementStatus === 'Approved' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{stmt.reimbursementStatus}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 space-y-1.5 text-xs text-[#111111]/80">
            <div className="flex items-center gap-1.5 font-semibold text-[#111111]">
              <ShieldCheck className="w-4 h-4 text-[#1F6B4A]" />
              <span>Partner Reconciliation Privacy Invariant</span>
            </div>
            <p className="leading-relaxed">
              This statement shows aggregate voucher counts, dates, and amounts only. No requester tokens, phone numbers, individual PINs, or basket contents are visible to partner accounting or billing personnel.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

