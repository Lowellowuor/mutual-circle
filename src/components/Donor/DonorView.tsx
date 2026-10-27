import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Users, 
  Lightbulb, 
  Package, 
  GraduationCap, 
  Check, 
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';

export const DonorView: React.FC = () => {
  const { campaigns, addDonorContribution, t } = useApp();

  const [activeTab, setActiveTab] = useState<'give' | 'campaign' | 'impact'>('give');
  const [selectedAmount, setSelectedAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [optInLedger, setOptInLedger] = useState<boolean>(false);
  const [mpesaPhone, setMpesaPhone] = useState<string>('+254 700 123 456');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [contributionSuccess, setContributionSuccess] = useState<boolean>(false);

  const mainCampaign = campaigns[0];

  const handleGiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      addDonorContribution(finalAmount, isAnonymous, optInLedger);
      setIsProcessing(false);
      setContributionSuccess(true);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE8E0] text-[#1F6B4A] text-xs font-medium">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>The Undifferentiated Resource Pool</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#111111]">
          Community Stewardship
        </h1>
        <p className="text-xs sm:text-sm text-[#111111]/70 max-w-xl leading-relaxed">
          Support essential food bundles, utility bills, and school tuition across Nairobi. All contributions are blind-pooled into one undifferentiated fund.
        </p>
      </div>

      {/* Mandatory Non-Negotiable Rule Note */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#111111]/15 space-y-1 text-xs text-[#111111]/80">
        <div className="font-semibold text-[#1F6B4A] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>Blind-Pooled Allocation Policy</span>
        </div>
        <p className="text-[11px] text-[#111111]/70 leading-relaxed">
          Contributions are pooled into a single fund. <strong>No contribution is linked to an individual recipient</strong>, preserving dignity, eliminating donor paternalism, and preventing targeted surveillance.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-black/5 rounded-xl border border-black/5 text-xs font-medium">
        <button
          onClick={() => { setActiveTab('give'); setContributionSuccess(false); }}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
            activeTab === 'give' ? 'bg-white text-[#111111] shadow-xs font-semibold' : 'text-[#111111]/70 hover:text-[#111111]'
          }`}
        >
          1. Give (Pooled M-Pesa)
        </button>
        <button
          onClick={() => setActiveTab('campaign')}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
            activeTab === 'campaign' ? 'bg-white text-[#111111] shadow-xs font-semibold' : 'text-[#111111]/70 hover:text-[#111111]'
          }`}
        >
          2. Cohort Campaigns
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
            activeTab === 'impact' ? 'bg-white text-[#111111] shadow-xs font-semibold' : 'text-[#111111]/70 hover:text-[#111111]'
          }`}
        >
          3. Aggregate Impact
        </button>
      </div>

      {/* Tab 1: Give */}
      {activeTab === 'give' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {!contributionSuccess ? (
            <form onSubmit={handleGiveSubmit} className="space-y-4">
              
              <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-xs">
                <span className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                  Select Contribution Amount (KES)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[1000, 2500, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(val);
                        setCustomAmount('');
                      }}
                      className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedAmount === val && !customAmount
                          ? 'bg-[#1F6B4A] text-white border-[#1F6B4A] shadow-xs font-bold'
                          : 'bg-[#FAF8F4] text-[#111111] border-[#111111]/15 hover:border-[#111111]/30 font-semibold'
                      }`}
                    >
                      <span className="font-mono text-xs sm:text-sm">
                        KES {val.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-mono text-[#111111]/60">Or enter custom amount:</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-[#111111]/50">
                      KES
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-xl pl-12 pr-4 py-2 text-xs font-mono font-bold text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* M-Pesa Phone Input */}
                <div className="space-y-1 pt-2 border-t border-[#111111]/10">
                  <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
                    M-Pesa Mobile Number (Simulated)
                  </label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    required
                    className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-xl px-4 py-2.5 text-xs font-mono text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#111111]/50">
                    A simulated STK prompt will appear on this device.
                  </span>
                </div>

                {/* Privacy & Recognition Toggles */}
                <div className="space-y-3 pt-3 border-t border-[#111111]/10">
                  
                  {/* One-click Give Anonymously */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      className="mt-0.5 text-[#1F6B4A] accent-[#1F6B4A] rounded"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#111111]">
                        Give anonymously (Pre-selected)
                      </span>
                      <p className="text-[11px] text-[#111111]/60 mt-0.5 leading-relaxed">
                        Your phone number and name are discarded from public and operational records.
                      </p>
                    </div>
                  </label>

                  {/* Public Recognition Ledger Opt-In (Aggregate only) */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={optInLedger}
                      onChange={e => setOptInLedger(e.target.checked)}
                      className="mt-0.5 text-[#1F6B4A] accent-[#1F6B4A] rounded"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#111111]">
                        Opt-in to the aggregate recognition ledger
                      </span>
                      <p className="text-[11px] text-[#111111]/60 mt-0.5 leading-relaxed">
                        Acknowledged strictly in aggregate sums (&quot;Anonymous Community Contributor · KES {customAmount ? Number(customAmount).toLocaleString() : selectedAmount.toLocaleString()}&quot;). Never linked to recipient disbursements.
                      </p>
                    </div>
                  </label>

                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span>
                  {isProcessing 
                    ? 'Simulating M-Pesa STK Push...' 
                    : `Contribute KES ${(customAmount ? Number(customAmount) : selectedAmount).toLocaleString()} to Pool`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-sm text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-[#111111]">
                  Contribution Successfully Pooled
                </h3>
                <p className="text-xs text-[#111111]/70">
                  Simulated M-Pesa receipt confirmed: KES {(customAmount ? Number(customAmount) : selectedAmount).toLocaleString()} added to the undifferentiated pool.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/80 max-w-sm mx-auto text-left font-mono space-y-1">
                <div>Recipient: The Mutual Circle General Fund</div>
                <div>Status: Pooled into wholesale locker & utility fund</div>
                <div>Anonymity: {isAnonymous ? 'Anonymous intake' : 'General aggregate pool'}</div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setContributionSuccess(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  Make another contribution
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cohort Campaigns */}
      {activeTab === 'campaign' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/75">
            <strong>Cohort Framing Rule:</strong> Campaigns are strictly aggregated at cohort level (&quot;200 students&quot;, &quot;500 bundles&quot;), never for an identified person.
          </div>

          <div className="space-y-4">
            {campaigns.map(camp => {
              const progressPct = Math.round((camp.pooledAmount / camp.targetAmount) * 100);

              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-[#1F6B4A] uppercase tracking-wider">
                        Cohort Campaign
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#111111]">
                        {camp.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#111111]/60 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>{camp.daysRemaining} days remaining</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#111111]/75 leading-relaxed">
                    {camp.cohortGoalText}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#1F6B4A]">
                          KES {camp.pooledAmount.toLocaleString()} pooled ({progressPct}%)
                        </span>
                        <span className="text-[9px] font-mono uppercase bg-black/5 text-[#111111]/70 px-1 py-0.2 rounded">
                          Sample data
                        </span>
                      </div>
                      <span className="text-[#111111]/60">
                        Target: KES {camp.targetAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1F6B4A] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#111111]/60 font-mono pt-1">
                      <span>{camp.coveredCount} of {camp.targetCount} covered</span>
                      <span>{camp.targetCount - camp.coveredCount} pending fulfillment</span>
                    </div>
                  </div>

                  {/* Recent Aggregate Activity */}
                  <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-[#111111]/80">
                      <TrendingUp className="w-4 h-4 text-[#1F6B4A]" />
                      <span>{camp.recentGiftsCountToday} new contributions today</span>
                    </div>
                    <span className="font-semibold text-[#1F6B4A]">
                      KES {camp.recentPooledAmountToday.toLocaleString()} pooled today
                    </span>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => setActiveTab('give')}
                      className="w-full py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Contribute to this Cohort Pool
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Aggregate Impact */}
      {activeTab === 'impact' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider block">
                  Total Pooled
                </span>
                <span className="text-[9px] font-mono uppercase bg-black/5 text-[#111111]/70 px-1 py-0.2 rounded">
                  Sample data
                </span>
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#1F6B4A]">
                KES 4.12M
              </div>
              <span className="text-[10px] text-[#111111]/50 font-mono">Fully committed to pool</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider block">
                  Locker Bundles
                </span>
                <span className="text-[9px] font-mono uppercase bg-black/5 text-[#111111]/70 px-1 py-0.2 rounded">
                  Sample data
                </span>
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#111111]">
                1,842
              </div>
              <span className="text-[10px] text-[#111111]/50 font-mono">Food &amp; hygiene</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider block">
                  Utility Meters
                </span>
                <span className="text-[9px] font-mono uppercase bg-black/5 text-[#111111]/70 px-1 py-0.2 rounded">
                  Sample data
                </span>
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#111111]">
                620
              </div>
              <span className="text-[10px] text-[#111111]/50 font-mono">Power &amp; water</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#111111]/60 uppercase tracking-wider block">
                  Student Terms
                </span>
                <span className="text-[9px] font-mono uppercase bg-black/5 text-[#111111]/70 px-1 py-0.2 rounded">
                  Sample data
                </span>
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#111111]">
                415
              </div>
              <span className="text-[10px] text-[#111111]/50 font-mono">Secondary tuition</span>
            </div>
          </div>

          {/* Allocation Distribution */}
          <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-3">
            <h3 className="font-serif text-base font-bold text-[#111111]">
              Pooled Distribution by Essential Category
            </h3>

            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>The Swap: Locker Food & Hygiene Bundles</span>
                  <span className="font-bold">42% (KES 1,730,400)</span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F6B4A] rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>The Pool: Utility Bills (KPLC & Water)</span>
                  <span className="font-bold">34% (KES 1,400,800)</span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '34%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>The Pool: School Term Fees (Secondary)</span>
                  <span className="font-bold">24% (KES 988,800)</span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
