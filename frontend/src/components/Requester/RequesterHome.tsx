import React from 'react';
import { CheckCircle, X, Package, CreditCard, Users, MessageCircle } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';
import { ScreenHeader, StatDisplay } from '../../ui';

interface RequesterHomeProps {
  tokenHash: string | null;
  unseenRedemptions: any[];
  dismissRedemptions: () => void;
  unseen: any[];
  dismissUnseen: () => void;
  rate: { count: number };
  MAX_REQUESTS: number;
  rateLimited: boolean;
  goTab: (tab: 'swap' | 'pool' | 'match' | 'bench') => void;
  myVouchers: any[];
  mergedHistory: any[];
  swapRequests: any[];
  handleWithdraw: (id: string, type: 'swap' | 'pool') => void;
  collectError: string | null;
  setCollectError: (err: string | null) => void;
  collectRequest: (id: string, pin: string) => Promise<boolean>;
  setPayingRequest: (req: { id: string, amount: number } | null) => void;
  sessionStats: { total: number, dispatched: number, pending: number };
}

const mapStatus = (s: string, type: string): any => {
  if (s === 'collected') return 'Collected';
  if (s === 'fulfilled') return 'Fulfilled';
  if (s === 'pending_check') return 'Under Review';
  if (type === 'swap') return 'Reserved';
  return 'Ready';
};

export const RequesterHome: React.FC<RequesterHomeProps> = (props) => {
  const [showAll, setShowAll] = React.useState(false);
  const remaining = Math.max(0, props.MAX_REQUESTS - props.rate.count);

  const actionTiles = [
    { id: 'swap' as const, Icon: Package, label: 'Reserve', sub: 'Food bundle' },
    { id: 'pool' as const, Icon: CreditCard, label: 'Pool', sub: 'Bills & fees' },
    { id: 'match' as const, Icon: Users, label: 'Match', sub: 'Opportunities' },
    { id: 'bench' as const, Icon: MessageCircle, label: 'Bench', sub: 'Peer support' },
  ];

  return (
    <div className="relative pb-20 content-in">
      {/* Ambient sage orb, drifts slowly */}
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{
          background: 'radial-gradient(circle, rgba(220,232,224,0.65) 0%, rgba(220,232,224,0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* 01 — Header */}
      <ScreenHeader
        number="01"
        eyebrow="Home"
        title="Welcome back"
        subtitle="Reserve a bundle, pay a bill, or check on your requests."
      />

      {/* Redemption alert */}
      {props.unseenRedemptions.length > 0 && (
        <div className="mb-6 rounded-2xl border border-lp-green/20 bg-lp-sage/30 px-4 py-3 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-lp-green mt-0.5 shrink-0" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-green">
              Voucher redeemed
            </div>
            {props.unseenRedemptions.slice(0, 2).map(({ redemption, voucher }: any) => (
              <p key={redemption.id} className="text-sm text-lp-ink mt-1">
                <span className="font-semibold">{voucher?.partnerName}</span>
                <span className="text-lp-ink/50"> · {redemption.timestamp}</span>
              </p>
            ))}
          </div>
          <button
            onClick={props.dismissRedemptions}
            className="text-lp-ink/40 hover:text-lp-ink p-1 press-scale"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collect error banner */}
      {props.collectError && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3">
          <div className="flex-1 text-sm text-rose-700">{props.collectError}</div>
          <button
            onClick={() => props.setCollectError(null)}
            className="text-rose-400 hover:text-rose-700 press-scale"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Weekly allowance */}
      <div className="card-editorial rounded-2xl p-5 mb-6">
        <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-ink/40">
          Weekly allowance
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="stat-display text-4xl text-lp-ink tabular-nums">
            {String(remaining).padStart(2, '0')}
          </span>
          <span className="text-sm text-lp-ink/55">requests remaining</span>
        </div>
        <div className="mt-3 h-1.5 bg-lp-ink/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-lp-green rounded-full transition-all duration-500"
            style={{ width: `${(props.rate.count / props.MAX_REQUESTS) * 100}%` }}
          />
        </div>
        <p className="text-xs text-lp-ink/50 mt-2">
          Resets Monday · {props.rate.count}/{props.MAX_REQUESTS} used
        </p>
      </div>

      {/* Action tiles */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {actionTiles.map((item) => {
          const I = item.Icon;
          const disabled = props.rateLimited && (item.id === 'swap' || item.id === 'pool');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => props.goTab(item.id)}
              disabled={disabled}
              className="card-editorial rounded-2xl p-4 text-left press-scale transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center mb-3">
                <I className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
              </div>
              <div className="text-sm font-semibold text-lp-ink">{item.label}</div>
              <div className="text-xs text-lp-ink/55 mt-0.5">{item.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Session summary — stats */}
      {props.sessionStats.total > 0 && (
        <div className="card-editorial rounded-2xl p-5 mb-8 grid grid-cols-3 gap-4">
          <StatDisplay label="Total" value={String(props.sessionStats.total).padStart(2, '0')} size="sm" />
          <StatDisplay label="Ready" value={String(props.sessionStats.dispatched).padStart(2, '0')} size="sm" />
          <StatDisplay label="Pending" value={String(props.sessionStats.pending).padStart(2, '0')} size="sm" />
        </div>
      )}

      {/* Vouchers */}
      {props.myVouchers.length > 0 && (
        <div className="mb-8">
          <div className="eyebrow mb-3">Vouchers</div>
          <div>
            {props.myVouchers.map((v, i) => (
              <div key={v.id} className="flex gap-4 py-4 border-b border-lp-ink/8 last:border-0">
                <span className="stat-display text-xl text-lp-green/40 tabular-nums shrink-0 w-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-lp-ink">{v.partnerName}</div>
                      <div className="text-xs text-lp-ink/55 mt-0.5">{v.description}</div>
                    </div>
                    <StatusChip status={v.status === 'active' ? 'Ready' : 'Collected'} />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-lp-ink/40 font-semibold">PIN</span>
                    <span className="stat-display text-lg text-lp-green tabular-nums tracking-[0.2em]">{v.pin}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {props.mergedHistory.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow">Recent activity</div>
            {props.mergedHistory.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-lp-green hover:underline press-scale"
              >
                {showAll ? 'Show less' : 'See all'}
              </button>
            )}
          </div>
          <div>
            {(showAll ? props.mergedHistory : props.mergedHistory.slice(0, 5)).map((r: any, i: number) => {
              const isWithdrawn = r.status === 'withdrawn';
              const canWithdraw = r.type === 'swap' ? r.status === 'reserved' : (r.status === 'verified' || r.status === 'pending_check');
              const liveSwap: any = r.type === 'swap' ? props.swapRequests.find((s: any) => s.id === r.id) : null;
              const resolvedPin: string | null =
                liveSwap?.pin && String(liveSwap.pin) !== '----' && String(liveSwap.pin).length >= 3
                  ? String(liveSwap.pin)
                  : (r.pin && String(r.pin) !== '----' && String(r.pin).length >= 3 ? String(r.pin) : null);
              const canCollect = r.type === 'swap' && !isWithdrawn && !!resolvedPin && ['reserved', 'verified', 'submitted_to_partner', 'voucher_issued'].includes(r.status);
              const canSettle = r.type === 'pool' && r.status === 'fulfilled' && r.paymentStatus !== 'paid';
              const pinPending = r.type === 'swap' && !resolvedPin && ['reserved', 'verified', 'submitted_to_partner', 'voucher_issued'].includes(r.status);
              const hasActions = canWithdraw || canCollect || canSettle || pinPending;

              return (
                <div key={r.id} className="py-5 border-b border-lp-ink/8 last:border-0">
                  <div className="flex gap-4">
                    <span className="stat-display text-xl text-lp-green/40 tabular-nums shrink-0 w-8">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-lp-ink truncate">
                            {r.type === 'swap' ? r.bundleCategory : r.category?.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-lp-ink/55 truncate mt-0.5">
                            {r.type === 'swap' ? r.lockerLocation : 'Bill payment'}
                            {resolvedPin && (
                              <span className="ml-2">
                                · PIN <span className="font-semibold text-lp-green">{resolvedPin}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusChip status={mapStatus(r.status, r.type)} />
                      </div>
                      {hasActions && (
                        <div className="flex items-center gap-4 mt-3">
                          {canWithdraw && (
                            <button
                              type="button"
                              onClick={() => props.handleWithdraw(r.id, r.type)}
                              className="text-xs text-lp-ink/60 hover:text-rose-600 transition-colors press-scale"
                            >
                              Withdraw
                            </button>
                          )}
                          {canCollect && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!resolvedPin) return;
                                await props.collectRequest(r.id, resolvedPin);
                              }}
                              className="text-xs font-semibold text-lp-green hover:underline press-scale"
                            >
                              Confirm pickup
                            </button>
                          )}
                          {canSettle && (
                            <button
                              type="button"
                              onClick={() => props.setPayingRequest({ id: r.id, amount: r.amount * 100 })}
                              className="inline-flex items-center px-3 py-1.5 rounded-full bg-lp-green text-white text-xs font-semibold press-scale"
                            >
                              Settle
                            </button>
                          )}
                          {pinPending && (
                            <span className="text-xs italic text-lp-ink/40">PIN sent via SMS</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {props.mergedHistory.length === 0 && props.myVouchers.length === 0 && (
        <div className="py-16 text-center">
          <p className="display-serif text-3xl text-lp-ink">Nothing here yet.</p>
          <p className="mt-3 text-sm text-lp-ink/55 max-w-xs mx-auto leading-relaxed">
            Reserve a food bundle or pay a bill. Your activity will show up here.
          </p>
        </div>
      )}

      {/* Token footnote */}
      {props.tokenHash && (
        <div className="mt-12 pt-6 border-t border-lp-ink/8">
          <div className="text-[10px] uppercase tracking-[0.18em] text-lp-ink/40 font-semibold mb-2">
            Your private token
          </div>
          <p className="text-xs font-mono text-lp-ink/50 truncate">{props.tokenHash}</p>
        </div>
      )}
    </div>
  );
};
