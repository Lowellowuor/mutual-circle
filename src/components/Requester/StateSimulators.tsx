import React from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, AlertCircle, ArrowLeft, Calendar, FileText, ArrowRight } from 'lucide-react';

export const RateLimitDemo: React.FC = () => {
  const { setRequesterScreen } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div>
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          Community Quota Notice
        </h2>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-2 max-w-sm mx-auto">
          <h3 className="font-serif text-lg font-bold text-[#111111]">
            Weekly Limit Reached
          </h3>
          <p className="text-xs sm:text-sm text-[#111111]/80 leading-relaxed">
            You&apos;ve reached this week&apos;s limit. You can request again on <strong>Monday, 2 November 2026</strong>.
          </p>
          <p className="text-xs text-[#111111]/60 leading-relaxed pt-1">
            This automated quota helps keep the circle open, equitable, and sustainable for everyone in our Nairobi community.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-left text-xs space-y-2 max-w-sm mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6B4A]">
            <Calendar className="w-4 h-4" />
            <span>Next Quota Refresh Cycle</span>
          </div>
          <div className="font-mono text-xs text-[#111111]/80">
            Next Available: 02 Nov 2026, 00:01 EAT
          </div>
          <p className="text-[11px] text-[#111111]/60 leading-relaxed">
            Your weekly limit resets automatically. No manual renewal is needed.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setRequesterScreen('home')}
            className="w-full max-w-sm mx-auto py-3 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

    </div>
  );
};

export const ErrorDemo: React.FC = () => {
  const { setRequesterScreen } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div>
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          Verification Notice
        </h2>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-serif text-lg font-bold text-[#111111]">
            We couldn&apos;t verify this account number
          </h3>
          <p className="text-xs sm:text-sm text-[#111111]/75 leading-relaxed">
            The institutional system was unable to locate an active record for the entered identifier. Please check the digits or use our document verification fallback.
          </p>
        </div>

        {/* Fallback steps */}
        <div className="space-y-2 pt-2 border-t border-[#111111]/10 text-xs">
          <span className="font-semibold text-[#111111] block">
            Suggested Next Steps:
          </span>
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 flex items-center justify-between">
            <div>
              <span className="font-medium text-[#111111]">1. Double check the digits</span>
              <p className="text-[11px] text-[#111111]/60">Ensure full 11 digits for KPLC or complete student admission code</p>
            </div>
            <button
              onClick={() => setRequesterScreen('pool')}
              className="px-3 py-1 bg-white border border-[#111111]/20 rounded-lg text-xs font-medium hover:bg-black/5 cursor-pointer"
            >
              Re-enter
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 flex items-center justify-between">
            <div>
              <span className="font-medium text-[#111111]">2. Upload a photo or PDF of your bill</span>
              <p className="text-[11px] text-[#111111]/60">Automated OCR cross-checks the invoice amount and issuer directly</p>
            </div>
            <button
              onClick={() => setRequesterScreen('pool')}
              className="px-3 py-1 bg-[#1F6B4A] text-white rounded-lg text-xs font-medium hover:bg-[#18553a] cursor-pointer"
            >
              Upload Bill
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setRequesterScreen('home')}
            className="w-full py-3 px-4 rounded-xl bg-white border border-[#111111]/20 hover:bg-black/5 text-[#111111] text-xs font-medium cursor-pointer transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

    </div>
  );
};
