import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Clock, ShieldCheck, Package, ReceiptText, ArrowLeft, QrCode } from 'lucide-react';

export const RequestDetailModal: React.FC = () => {
  const { activeRequestId, requests, setRequesterScreen } = useApp();

  const request = requests.find(r => r.id === activeRequestId) || requests[0];

  if (!request) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-[#111111]/70">No request selected.</p>
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#1F6B4A] underline cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isFulfilled = request.status === 'fulfilled';
  const isVerified = request.status === 'verified' || isFulfilled;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div>
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Requests</span>
        </button>

        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Request Details
          </h2>
          <span className="font-mono text-xs text-[#111111]/70 bg-white px-2.5 py-1 rounded-lg border border-[#111111]/15">
            {request.id}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#111111]/10">
          <div className="w-10 h-10 rounded-xl bg-[#DCE8E0] flex items-center justify-center text-[#1F6B4A] shrink-0">
            {request.type === 'swap' ? <Package className="w-5 h-5" /> : <ReceiptText className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#111111]">
              {request.categoryTitle}
            </h3>
            <span className="text-xs text-[#111111]/60 font-mono">
              Coarse Region: {request.coarseLocation}
            </span>
          </div>
        </div>

        {/* Data points (strictly non-identifying!) */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
            <span className="text-[#111111]/60 block text-[11px]">Settlement Value</span>
            <span className="font-mono font-bold text-sm text-[#1F6B4A]">
              KES {request.amount.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
            <span className="text-[#111111]/60 block text-[11px]">Object Reference</span>
            <span className="font-mono text-xs font-semibold text-[#111111]">
              {request.objectIdMasked}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
            <span className="text-[#111111]/60 block text-[11px]">Verification Path</span>
            <span className="font-mono text-xs text-[#111111]">
              {request.verificationTier}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
            <span className="text-[#111111]/60 block text-[11px]">Submission Time</span>
            <span className="font-mono text-xs text-[#111111]">
              {request.timestamp}
            </span>
          </div>
        </div>

        {/* Locker PIN reveal if swap bundle */}
        {request.pinCode && (
          <div className="p-4 rounded-xl bg-[#DCE8E0]/40 border border-[#1F6B4A]/30 text-center space-y-1">
            <span className="text-[11px] font-mono uppercase text-[#1F6B4A] tracking-wider">
              Single-Use Locker Pickup PIN
            </span>
            <div className="font-mono text-3xl font-bold tracking-widest text-[#1F6B4A]">
              {request.pinCode}
            </div>
            <p className="text-[11px] text-[#111111]/60">
              Collect at your convenience. No countdown timer.
            </p>
          </div>
        )}

        {/* Lifecycle Stepper Timeline */}
        <div className="pt-2 border-t border-[#111111]/10 space-y-3">
          <span className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
            Verification & Fulfillment Timeline
          </span>

          <div className="space-y-3 text-xs pl-2 border-l-2 border-[#1F6B4A]/20">
            
            {/* Step 1: Submitted */}
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-[#111111]">Submitted</span>
                <p className="text-[#111111]/60 text-[11px]">
                  Private cryptographic token generated; rate limit check passed.
                </p>
              </div>
            </div>

            {/* Step 2: Verified */}
            <div className="flex items-start gap-2.5">
              {isVerified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div>
                <span className={`font-semibold ${isVerified ? 'text-[#111111]' : 'text-amber-800'}`}>
                  Verified
                </span>
                <p className="text-[#111111]/60 text-[11px]">
                  {request.type === 'swap' 
                    ? 'Automated locker capacity reserved at locker hub.' 
                    : 'Institutional database confirmed valid unpaid balance.'}
                </p>
              </div>
            </div>

            {/* Step 3: Fulfilled */}
            <div className="flex items-start gap-2.5">
              {isFulfilled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-[#111111]/40 mt-0.5 shrink-0" />
              )}
              <div>
                <span className={`font-semibold ${isFulfilled ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                  Fulfilled
                </span>
                <p className="text-[#111111]/60 text-[11px]">
                  {request.fulfillmentDetails || 'Scheduled in institutional settlement batch.'}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Anonymity Notice */}
      <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 flex items-start gap-2 text-xs text-[#111111]/70">
        <ShieldCheck className="w-4 h-4 text-[#1F6B4A] shrink-0 mt-0.5" />
        <span>
          Your private token is protected by one-way cryptography. Staff and operators cannot see who submitted this request.
        </span>
      </div>

    </div>
  );
};
