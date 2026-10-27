import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  Check, 
  X, 
  FileText, 
  AlertTriangle,
  Download,
  Trash2,
  Edit3,
  Smartphone
} from 'lucide-react';

export const DataRightsScreen: React.FC = () => {
  const { setRequesterScreen, t } = useApp();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleActionClick = (actionName: string) => {
    setFeedbackMsg(`${actionName} request registered for demonstration. Non-functional placeholder pending formal Data Protection Act review.`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A] rounded"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('return_home') || 'Back to Home'}</span>
        </button>

        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          {t('data_rights_title') || 'Your Data and Your Rights'}
        </h2>
        <p className="text-xs sm:text-sm text-[#111111]/70 mt-1">
          Complete transparency on what this resource-sharing network processes and what is never recorded.
        </p>
      </div>

      {/* Mandatory Statutory Review Banner (Item 1) */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{t('data_rights_banner') || 'Pending Data Protection Act review. Wording will change.'}</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          This interface illustrates user consent, cryptographic tokenisation, and data rights under Kenya’s Data Protection Act 2019 framework.
        </p>
      </div>

      {/* Three Storage Classification Groups (Item 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Group 1: What IS Stored */}
        <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#111111]/10">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                ✓
              </div>
              <h3 className="font-serif text-sm font-bold text-[#111111]">
                What IS Stored
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-[#111111]/80 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] mt-1.5 shrink-0" />
                <span><strong>Keyed Token:</strong> A private, keyed one-way token derived from your phone number to keep the circle fair.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] mt-1.5 shrink-0" />
                <span><strong>Category &amp; Amount:</strong> Resource type and KES settlement value.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] mt-1.5 shrink-0" />
                <span><strong>Timestamp:</strong> Date and time for rolling 7-day quota validation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] mt-1.5 shrink-0" />
                <span><strong>Fulfilment Status:</strong> Stage indicator (Submitted, Verified, Fulfilled).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] mt-1.5 shrink-0" />
                <span><strong>Keyed Object Hash:</strong> Hex fragment (e.g. <code>obj #8f4c…</code>) for deduplication.</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
            Internal quota ledger
          </div>
        </div>

        {/* Group 2: NEVER Stored (Exact item 2 list) */}
        <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#111111]/10">
              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
                ✕
              </div>
              <h3 className="font-serif text-sm font-bold text-[#111111]">
                Never Stored
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-[#111111]/80 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <span><strong>Name:</strong> We never collect, request, or display names.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <span><strong>Residential Address:</strong> Only coarse regional hubs (e.g. Westlands).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <span><strong>Clinical Detail:</strong> Hospital payments require only invoice # and amount. Zero diagnoses or clinical treatments.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <span><strong>Raw National ID Number:</strong> Completely excluded beyond temporary cryptographic token derivation.</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-rose-800 font-semibold">
            Strict privacy guarantee
          </div>
        </div>

        {/* Group 3: Stored encrypted, accessible only to automated processes (Item 2) */}
        <div className="p-5 rounded-2xl bg-white border-2 border-dashed border-amber-500/50 space-y-3 shadow-xs flex flex-col justify-between bg-amber-50/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#111111]/10">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-800" />
              </div>
              <h3 className="font-serif text-sm font-bold text-[#111111]">
                Stored Encrypted
              </h3>
            </div>
            <p className="text-[11px] font-semibold text-[#1F6B4A]">
              Accessible only to automated processes:
            </p>
            <ul className="space-y-2 text-xs text-[#111111]/80 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span><strong>Phone number:</strong> Used strictly for PIN delivery and follow-up.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span><strong>Zero Staff Access:</strong> Stored in an isolated cryptographic enclave. No caseworkers, operators, or donors can query this store.</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-amber-900 font-semibold">
            Automated delivery only
          </div>
        </div>

      </div>

      {/* Non-Functional Data Rights Buttons (Access, Correction, Deletion) */}
      <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-4">
        <h3 className="font-serif text-base font-bold text-[#111111]">
          Exercise Your Data Protection Rights
        </h3>
        <p className="text-xs text-[#111111]/75 leading-relaxed">
          In compliance with data protection principles, individuals have rights regarding records associated with their cryptographic token.
        </p>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono">
            {feedbackMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleActionClick('Access (Export)')}
            className="p-3.5 rounded-xl border border-[#111111]/20 hover:border-[#1F6B4A] hover:bg-[#FAF8F4] text-left transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            aria-label="Export my token records"
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-[#111111] group-hover:text-[#1F6B4A]">
              <Download className="w-4 h-4 text-[#1F6B4A]" />
              <span>{t('access_export') || 'Access (Export)'}</span>
            </div>
            <p className="text-[11px] text-[#111111]/60 mt-1">
              Download JSON log of all requests linked to your weekly token.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick('Correction (Rectification)')}
            className="p-3.5 rounded-xl border border-[#111111]/20 hover:border-[#1F6B4A] hover:bg-[#FAF8F4] text-left transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            aria-label="Request correction of active record"
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-[#111111] group-hover:text-[#1F6B4A]">
              <Edit3 className="w-4 h-4 text-[#1F6B4A]" />
              <span>{t('correction') || 'Correction'}</span>
            </div>
            <p className="text-[11px] text-[#111111]/60 mt-1">
              Correct an unverified meter or admission number before settlement.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick('Deletion (Right to Erasure)')}
            className="p-3.5 rounded-xl border border-[#111111]/20 hover:border-rose-600 hover:bg-rose-50/50 text-left transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-rose-600"
            aria-label="Right to erasure and token deletion"
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-[#111111] group-hover:text-rose-700">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{t('erasure') || 'Deletion (Right to Erasure)'}</span>
            </div>
            <p className="text-[11px] text-[#111111]/60 mt-1">
              Purge your hashed token from rate-limiting memory stores.
            </p>
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#1F6B4A] font-semibold underline hover:text-[#18553a] cursor-pointer"
        >
          {t('return_home') || 'Return to Dashboard'}
        </button>
      </div>

    </div>
  );
};

