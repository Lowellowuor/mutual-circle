import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Package, 
  ReceiptText, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  FileText,
  Inbox
} from 'lucide-react';
import { OpportunityCard } from './OpportunityCard';
import { Phase2Cards } from '../Phase2/Phase2Cards';

export const HomeScreen: React.FC = () => {
  const { 
    setRequesterScreen, 
    setSurface,
    setRequesterChannel,
    requests, 
    setActiveRequestId, 
    isLoadingRequests,
    setIsLoadingRequests,
    emptyRequestsMode,
    setEmptyRequestsMode,
    t 
  } = useApp();

  const displayedRequests = emptyRequestsMode ? [] : requests;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Greeting */}
      <div className="flex items-center justify-between pb-1 border-b border-[#111111]/10">
        <div>
          <span className="text-xs font-mono text-[#1F6B4A] uppercase tracking-wider">
            Nairobi Resource Circle
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Active Community Network
          </h2>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-xs text-[#1F6B4A] font-medium bg-[#DCE8E0]/70 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Private Session</span>
          </div>
        </div>
      </div>

      {/* Quick Mobile Features Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white rounded-xl border border-[#111111]/10 text-xs">
        <span className="font-mono text-[10px] text-[#111111]/60 font-semibold uppercase tracking-wider pl-1">
          Channels:
        </span>
        <button
          onClick={() => {
            setRequesterChannel('sms');
            setRequesterScreen('channel');
          }}
          className="px-2.5 py-1 bg-[#075E54] hover:bg-[#064e46] text-white rounded-lg font-medium cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>ðŸ’¬ SMS Bot</span>
        </button>
        <button
          onClick={() => {
            setRequesterChannel('ussd');
            setRequesterScreen('channel');
          }}
          className="px-2 py-1 bg-[#FAF8F4] hover:bg-black/5 text-[#111111] rounded-lg border border-[#111111]/15 cursor-pointer font-mono text-[11px]"
        >
          USSD Dial
        </button>
        <button
          onClick={() => {
            setRequesterChannel('sms');
            setRequesterScreen('channel');
          }}
          className="px-2 py-1 bg-[#FAF8F4] hover:bg-black/5 text-[#111111] rounded-lg border border-[#111111]/15 cursor-pointer font-mono text-[11px]"
        >
          SMS Gateway
        </button>
        <button
          onClick={() => setSurface('phase2')}
          className="ml-auto px-2.5 py-1 bg-[#DCE8E0] hover:bg-[#c9ddd0] text-[#1F6B4A] rounded-lg font-semibold cursor-pointer text-[11px] flex items-center gap-1"
        >
          <span>âœ¨ Phase 2 Hub</span>
        </button>
      </div>

      {/* Two Primary Interactive Tiles: The Swap & The Pool */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Tile 1: The Swap */}
        <div
          onClick={() => setRequesterScreen('swap')}
          className="group p-5 rounded-2xl bg-white border border-[#111111]/15 hover:border-[#1F6B4A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
          tabIndex={0}
          role="button"
          aria-label="Reserve a bundle in The Swap"
          onKeyDown={e => e.key === 'Enter' && setRequesterScreen('swap')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#DCE8E0] flex items-center justify-center text-[#1F6B4A] group-hover:bg-[#1F6B4A] group-hover:text-white transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-[#1F6B4A] bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#111111]/10">
                The Swap
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111] group-hover:text-[#1F6B4A] transition-colors">
                {t('reserve_bundle')}
              </h3>
              <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
                {t('reserve_bundle_desc')} Coarse pickup locations in Westlands, Kasarani, and Embakasi.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-medium text-[#1F6B4A] border-t border-[#111111]/5 mt-4">
            <span>Browse 4 bundles available</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Tile 2: The Pool */}
        <div
          onClick={() => setRequesterScreen('pool')}
          className="group p-5 rounded-2xl bg-white border border-[#111111]/15 hover:border-[#1F6B4A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
          tabIndex={0}
          role="button"
          aria-label="Pay a bill or fee in The Pool"
          onKeyDown={e => e.key === 'Enter' && setRequesterScreen('pool')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#DCE8E0] flex items-center justify-center text-[#1F6B4A] group-hover:bg-[#1F6B4A] group-hover:text-white transition-colors">
                <ReceiptText className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-[#1F6B4A] bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#111111]/10">
                The Pool
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111] group-hover:text-[#1F6B4A] transition-colors">
                {t('pay_bill')}
              </h3>
              <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
                {t('pay_bill_desc')} Direct institutional settlement with object verification.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-medium text-[#1F6B4A] border-t border-[#111111]/5 mt-4">
            <span>Direct to institution</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

      </div>

      {/* Opportunity Surfaced (Design Pattern Demo) */}
      <OpportunityCard />

      {/* Recent Requests Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-bold text-[#111111]">
              {t('my_requests')}
            </h3>
            <span className="text-xs font-mono text-[#111111]/60">
              {displayedRequests.length} active records
            </span>
          </div>
        </div>

        {/* Demo Controls Panel (Item 7) */}
        <div className="p-3 bg-white/70 border border-[#111111]/15 rounded-xl flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111]/60 font-bold">
            {t('demo_controls')}:
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setIsLoadingRequests(!isLoadingRequests)}
              className="px-2.5 py-1 bg-white border border-[#111111]/15 rounded-md hover:bg-black/5 cursor-pointer text-[#111111]/80 focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            >
              {isLoadingRequests ? 'Stop Skeleton' : 'Test Skeleton View'}
            </button>
            <button
              type="button"
              onClick={() => setEmptyRequestsMode(!emptyRequestsMode)}
              className="px-2.5 py-1 bg-white border border-[#111111]/15 rounded-md hover:bg-black/5 cursor-pointer text-[#111111]/80 focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            >
              {emptyRequestsMode ? 'Restore List' : 'Test Empty List'}
            </button>
          </div>
        </div>

        {/* Skeleton Loading State */}
        {isLoadingRequests ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3.5 rounded-xl bg-white border border-[#111111]/10 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-black/10 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-3.5 bg-black/10 rounded" />
                    <div className="w-24 h-2.5 bg-black/10 rounded" />
                  </div>
                </div>
                <div className="w-16 h-4 bg-black/10 rounded" />
              </div>
            ))}
          </div>
        ) : displayedRequests.length === 0 ? (
          /* Empty State: No requests yet */
          <div className="p-6 rounded-2xl bg-white border border-[#111111]/10 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F4] flex items-center justify-center text-[#111111]/40 mx-auto">
              <Inbox className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-sm font-bold text-[#111111]">No requests yet</h4>
            <p className="text-xs text-[#111111]/60 max-w-xs mx-auto leading-relaxed">
              Once you reserve a bundle or submit a bill, your active request status will appear here.
            </p>
          </div>
        ) : (
          /* Normal List */
          <div className="space-y-2">
            {displayedRequests.slice(0, 4).map(req => {
              const isFulfilled = req.status === 'fulfilled';
              const isVerified = req.status === 'verified';

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    setActiveRequestId(req.id);
                    setRequesterScreen('detail');
                  }}
                  className="p-3.5 rounded-xl bg-white border border-[#111111]/10 hover:border-[#1F6B4A]/50 transition-all cursor-pointer flex items-center justify-between gap-3 group focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
                  tabIndex={0}
                  role="button"
                  aria-label={`View request detail for ${req.categoryTitle}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setActiveRequestId(req.id);
                      setRequesterScreen('detail');
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FAF8F4] border border-[#111111]/10 flex items-center justify-center text-[#111111]/70 group-hover:text-[#1F6B4A] shrink-0">
                      {req.type === 'swap' ? <Package className="w-4 h-4" /> : <ReceiptText className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-[#111111]">
                          {req.categoryTitle}
                        </span>
                        <span className="text-[10px] font-mono text-[#111111]/60">
                          {req.coarseLocation}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#111111]/60 font-mono mt-0.5 flex items-center gap-2">
                        <span>{req.objectIdMasked}</span>
                        <span>Â·</span>
                        <span>KES {req.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        isFulfilled
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isVerified
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {req.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#111111]/30 group-hover:text-[#111111] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Link to Consent & Data Rights Screen */}
      <div className="p-3 rounded-xl bg-white/70 border border-[#111111]/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#111111]/80">
          <FileText className="w-4 h-4 text-[#1F6B4A]" />
          <span>Learn how your data is handled under KDPA</span>
        </div>
        <button
          onClick={() => setRequesterScreen('data_rights')}
          className="text-xs font-semibold text-[#1F6B4A] hover:underline cursor-pointer"
        >
          {t('data_rights')} â†’
        </button>
      </div>

      {/* Phase 2 Modules Locked Preview */}
      <Phase2Cards />

    </div>
  );
};


