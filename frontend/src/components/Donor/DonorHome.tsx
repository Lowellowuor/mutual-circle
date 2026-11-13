import React from 'react';
import { HeartHandshake, ShieldCheck, Package, Wallet, ChevronRight } from 'lucide-react';
import { ScreenHeader } from '../../ui';

interface DonorHomeProps {
  activityFeed: any[];
  totalGivenKes: number;
  impactStats: any;
  campaigns: any[];
  openLedgerModal: () => void;
  goTab: (t: any) => void;
  setSelectedActivity: (item: any) => void;
  formatRelativeTime: (ts: string) => string;
}

export const DonorHome: React.FC<DonorHomeProps> = (props) => {
  const hasActivity = props.activityFeed.length > 0;
  const activeCampaigns = props.campaigns.slice(0, 2);

  return (
    <div className="relative pb-20 content-in">
      {/* Ambient orb */}
      <div className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.65) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="01"
        eyebrow="Donor Home"
        title="Welcome back"
        subtitle="Fund a need. Stay anonymous."
      />

      {/* Hero — impact summary */}
      <div className="card-editorial p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-[#DCE8E0] flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 text-[#1F6B4A]" />
          </div>
          <button
            onClick={props.openLedgerModal}
            className="text-xs font-semibold text-[#1F6B4A] hover:text-[#18553a] flex items-center gap-1 transition-colors press-scale"
          >
            <ShieldCheck className="w-3 h-3" /> Verify ledger
          </button>
        </div>

        {hasActivity ? (
          <>
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="text-sm font-medium text-[#111111]/50">KES</span>
              <span className="stat-display text-4xl md:text-5xl text-[#111111] tabular-nums">{props.totalGivenKes.toLocaleString()}</span>
              <span className="text-base text-[#111111]/50">pooled</span>
            </div>
            <p className="type-body-m text-[#111111]/70 leading-relaxed max-w-[55ch]">
              {props.impactStats
                ? `${props.impactStats.bundles_delivered} bundles delivered · ${props.impactStats.utility_meters_paid} bills paid · ${props.impactStats.student_terms_paid} school terms funded.`
                : `Across ${props.activityFeed.length} gifts. Blind-pooled.`}
            </p>
          </>
        ) : (
          <>
            <h2 className="type-h2-m text-[#111111] mb-2">Fund a need.<br/>Stay anonymous.</h2>
            <p className="type-body-m text-[#111111]/70 leading-relaxed max-w-[55ch]">Blind-pooled. No recipient profiles. No linkage.</p>
          </>
        )}
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => props.goTab('give')}
          className="card-editorial p-5 text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-200 press-scale"
        >
          <div className="w-10 h-10 rounded-full bg-[#FAF8F4] border border-[#E8E6DE] flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-[#1F6B4A]" />
          </div>
          <div className="text-sm font-semibold text-[#111111]">Give Cash</div>
          <div className="text-xs text-[#111111]/50 mt-1">Blind pool</div>
        </button>
        <button
          onClick={() => props.goTab('pledge')}
          className="card-editorial p-5 text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-200 press-scale"
        >
          <div className="w-10 h-10 rounded-full bg-[#FAF8F4] border border-[#E8E6DE] flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-[#1F6B4A]" />
          </div>
          <div className="text-sm font-semibold text-[#111111]">Pledge</div>
          <div className="text-xs text-[#111111]/50 mt-1">Goods or credit</div>
        </button>
      </div>

      {/* Active Campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="mb-8">
          <h3 className="eyebrow text-[#111111]/40 mb-4">Active Campaigns</h3>
          <div className="space-y-4">
            {activeCampaigns.map((c: any) => (
              <button
                key={c.id}
                onClick={() => props.goTab('give')}
                className="w-full surface-solid r-card p-5 text-left flex items-center justify-between hover:bg-[#FAF8F4] transition-colors press-scale"
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#111111]">{c.title}</div>
                  <div className="text-xs text-[#111111]/50 mt-1">{c.description}</div>
                  {c.target_pence && (
                    <div className="mt-3 max-w-xs">
                      <div className="h-1.5 w-full bg-[#E8E6DE] rounded-full overflow-hidden">
                        <div className="h-full bg-[#1F6B4A]" style={{ width: `${Math.min(100, (c.raised_pence / c.target_pence) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#111111]/40 mt-1">
                        <span>{Math.round((c.raised_pence / c.target_pence) * 100)}% funded</span>
                        <span>KES {Math.round(c.target_pence / 100).toLocaleString()} goal</span>
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[#111111]/30 shrink-0 ml-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {hasActivity && (
        <div>
          <h3 className="eyebrow text-[#111111]/40 mb-4">Recent Activity</h3>
          <div className="surface-solid r-card divide-y divide-[#E8E6DE]">
            {props.activityFeed.slice(0, 5).map((item: any) => (
              <button
                key={item.id}
                onClick={() => props.setSelectedActivity(item)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#FAF8F4] transition-colors text-left press-scale"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DCE8E0] flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-4 h-4 text-[#1F6B4A]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#111111]">Donation</div>
                    <div className="text-xs text-[#111111]/40 mt-0.5">{props.formatRelativeTime(item.created_at)}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#111111] tabular-nums">
                  KES {(item.amount_pence / 100).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
