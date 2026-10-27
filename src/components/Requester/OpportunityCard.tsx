import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Shield, Check, X } from 'lucide-react';

export const OpportunityCard: React.FC = () => {
  const { 
    opportunityOptIn, 
    setOpportunityOptIn, 
    opportunityDismissed, 
    setOpportunityDismissed,
    phoneNumber 
  } = useApp();

  const [expanded, setExpanded] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  if (opportunityDismissed) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F1EA] border border-[#111111]/15 space-y-3 relative overflow-hidden">
      
      {/* Dismiss button */}
      <button
        onClick={() => setOpportunityDismissed(true)}
        className="absolute top-3.5 right-3.5 text-[#111111]/40 hover:text-[#111111] p-1 cursor-pointer"
        aria-label="Dismiss opportunity"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6B4A]">
        <Sparkles className="w-4 h-4" />
        <span>Opportunity Surfaced (Design Pattern Demo)</span>
      </div>

      <div className="space-y-1 pr-6">
        <h4 className="font-serif text-base font-bold text-[#111111]">
          Community Solar & Electrical Skills Workshop
        </h4>
        <p className="text-xs text-[#111111]/75 leading-relaxed">
          Free 4-week vocational accreditation programme in Westlands & Kasarani, hosted by independent community training partners.
        </p>
      </div>

      {/* Privacy Guarantee */}
      <div className="p-2.5 rounded-lg bg-white/70 border border-[#111111]/10 flex items-start gap-2 text-xs text-[#111111]/80">
        <Shield className="w-4 h-4 text-[#1F6B4A] shrink-0 mt-0.5" />
        <span>
          Viewing or accepting opportunities does not affect your resource requests in any way. Your privacy is guaranteed.
        </span>
      </div>

      {/* Explicit Opt-in Section defaulting to NO */}
      {!confirmed ? (
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#111111]">
              Choose whether to share your contact details:
            </span>

            <div className="space-y-2">
              {/* Option 1: Default to NO (Pre-selected) */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  !opportunityOptIn 
                    ? 'bg-white border-[#1F6B4A] shadow-xs' 
                    : 'bg-white/50 border-[#111111]/10 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="contact_optin"
                  checked={!opportunityOptIn}
                  onChange={() => setOpportunityOptIn(false)}
                  className="mt-0.5 text-[#1F6B4A] accent-[#1F6B4A] focus:ring-[#1F6B4A]"
                />
                <div>
                  <div className="font-semibold text-[#111111]">
                    No — Keep my participation anonymous from the human chain (Recommended)
                  </div>
                  <div className="text-[#111111]/60 text-[11px] mt-0.5">
                    You will receive open public schedule codes via one-way SMS with zero contact disclosure.
                  </div>
                </div>
              </label>

              {/* Option 2: Explicit Opt-in (User must deliberately choose) */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  opportunityOptIn 
                    ? 'bg-white border-[#1F6B4A] shadow-xs' 
                    : 'bg-white/50 border-[#111111]/10 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="contact_optin"
                  checked={opportunityOptIn}
                  onChange={() => setOpportunityOptIn(true)}
                  className="mt-0.5 text-[#1F6B4A] accent-[#1F6B4A] focus:ring-[#1F6B4A]"
                />
                <div>
                  <div className="font-semibold text-[#111111]">
                    Yes — Connect my phone number with the independent workshop coordinator
                  </div>
                  <div className="text-[#111111]/60 text-[11px] mt-0.5">
                    Phone ({phoneNumber}) will only be shared with the certified instructor, never with resource donors or staff.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Confirm Selection
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-white border border-[#1F6B4A]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#1F6B4A]">
            <Check className="w-4 h-4" />
            <span className="font-medium">
              {!opportunityOptIn ? 'Enrolled anonymously' : 'Enrolled with direct contact'}
            </span>
          </div>
          <button
            onClick={() => setConfirmed(false)}
            className="text-[11px] text-[#111111]/60 hover:underline cursor-pointer"
          >
            Change preference
          </button>
        </div>
      )}

    </div>
  );
};
