import { ScreenHeader } from '../../ui';
import React from 'react';
import { CheckCircle, X, Package, Users, Activity, Send, Store } from 'lucide-react';
import { EmptyState } from '../Shared/EmptyState';

interface ConsoleQueueProps {
  filter: any;
  setFilter: (f: any) => void;
  emptyQueueMode: boolean;
  setEmptyQueueMode: (v: boolean) => void;
  receipt: string | null;
  setReceipt: (r: string | null) => void;
  awaitingPledges: any[];
  setMatchingPledge: (p: any) => void;
  matchInterests: any[];
  closeMatchInterest: (id: string, status: 'contacted' | 'closed') => Promise<{ ok: boolean; reason?: string }>;
  filteredPool: any[];
  filteredSwap: any[];
  handleDispatch: (id: string) => Promise<void>;
  setIssueModal: (v: any) => void;
  setIssueSuccess: (v: any) => void;
  push: (toast: any) => void;
}

export const ConsoleQueue: React.FC<ConsoleQueueProps> = (props) => {
  return (
    <div className="space-y-3">
      <ScreenHeader number="02" eyebrow="Operations" title="Queue" subtitle="Review and dispatch incoming requests." />
      {/* Filter pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {([{ id: 'all' as const, l: 'All' }, { id: 'swap' as const, l: 'Swap' }, { id: 'pool' as const, l: 'Pool' }, { id: 'pending' as const, l: 'Pending' }, { id: 'dispatched' as const, l: 'Sent' }]).map(f => (
          <button
            key={f.id}
            onClick={() => props.setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold transition-colors ${
              props.filter === f.id ? 'bg-ink text-white' : 'bg-tint text-muted hover:text-ink'
            }`}
          >
            {f.l}
          </button>
        ))}
        <button
          onClick={() => props.setEmptyQueueMode(!props.emptyQueueMode)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold border border-tile bg-surface whitespace-nowrap shrink-0 hover:bg-tint transition-colors"
        >
          {props.emptyQueueMode ? 'Restore' : 'Empty'}
        </button>
      </div>

      {/* Receipt banner */}
      {props.receipt && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-emerald-900">Dispatched</div>
            <div className="text-xs font-mono text-emerald-900/80 truncate">{props.receipt}</div>
          </div>
          <button onClick={() => props.setReceipt(null)} className="text-emerald-700 shrink-0" aria-label="Dismiss">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Awaiting pledges */}
      {props.awaitingPledges.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="text-sm font-bold text-amber-900 flex items-center gap-1">
            <Package className="w-4 h-4" /> Incoming pledges ({props.awaitingPledges.length})
          </div>
          {props.awaitingPledges.map(p => (
            <div key={p.id} className="p-3 bg-surface border border-tile rounded-lg flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink truncate">{p.description}</div>
                <div className="text-xs font-mono text-muted">{p.locality} - {p.type === 'service_credit' ? 'credit' : 'goods'}</div>
              </div>
              <button
                onClick={() => props.setMatchingPledge({ id: p.id, description: p.description, locality: p.locality, type: p.type })}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Match
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Match interests */}
      {props.matchInterests && props.matchInterests.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold text-blue-900 flex items-center gap-1">
              <Users className="w-4 h-4" /> Match interests
            </div>
            <div className="text-xs font-mono text-blue-900/60">
              {props.matchInterests.filter(m => m.status === 'pending').length} pending -{' '}
              {props.matchInterests.filter(m => m.status === 'contacted').length} contacted -{' '}
              {props.matchInterests.filter(m => m.status === 'closed').length} closed
            </div>
          </div>
          {props.matchInterests.slice(0, 4).map(m => (
            <div
              key={m.id}
              className={`p-3 rounded-lg border ${
                m.status === 'pending' ? 'bg-surface border-tile' : m.status === 'contacted' ? 'bg-amber-50 border-amber-200' : 'bg-canvas border-tile opacity-70'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink truncate">{m.title}</div>
                  <div className="text-xs font-mono text-muted">{m.timestamp} - token {m.tokenHash.slice(0, 8)}...</div>
                </div>
                <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                  m.status === 'pending' ? 'bg-blue-100 text-blue-800' : m.status === 'contacted' ? 'bg-amber-100 text-amber-800' : 'bg-tint text-muted'
                }`}>{m.status}</span>
              </div>
              {m.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      const r = await props.closeMatchInterest(m.id, 'contacted');
                      props.push(r.ok ? { kind: 'success', message: 'Marked as contacted' } : { kind: 'error', message: r.reason ?? 'Update failed' });
                    }}
                    className="flex-1 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Mark contacted
                  </button>
                  <button
                    onClick={async () => {
                      const r = await props.closeMatchInterest(m.id, 'closed');
                      props.push(r.ok ? { kind: 'success', message: 'Case closed' } : { kind: 'error', message: r.reason ?? 'Update failed' });
                    }}
                    className="flex-1 py-1.5 bg-surface border border-tile rounded-lg text-xs font-medium hover:bg-tint transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
              {m.status === 'contacted' && (
                <button
                  onClick={async () => {
                    const r = await props.closeMatchInterest(m.id, 'closed');
                    props.push(r.ok ? { kind: 'success', message: 'Case closed' } : { kind: 'error', message: r.reason ?? 'Update failed' });
                  }}
                  className="w-full mt-2 py-1.5 bg-surface border border-tile rounded-lg text-xs font-medium hover:bg-tint transition-colors"
                >
                  Close case
                </button>
              )}
            </div>
          ))}
          <div className="text-xs text-blue-900/70 leading-relaxed">
            Opt-in disclosure only. Provider must reach out within 48h.
          </div>
        </div>
      )}

      {/* Queue list */}
      {props.filteredPool.length === 0 && props.filteredSwap.length === 0 ? (
        <EmptyState Icon={Activity} title="Queue empty" body="All requests have been processed." />
      ) : (
        <div className="space-y-2">
          {props.filteredPool.map(r => {
            const canAct = r.status === 'verified';
            const isVoucher = r.status === 'voucher_issued';
            const isPending = r.status === 'pending_check';
            const isWithdrawn = r.status === 'withdrawn';
            const isSent = r.status === 'submitted_to_partner';
            return (
              <div key={r.id} className="p-4 bg-surface border border-tile rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{r.id}</span>
                  <span className="text-xs font-mono bg-tint px-2 py-0.5 rounded">T{r.tier}</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-ink uppercase">{r.category.replace('_', ' ')}</div>
                  <div className="text-xs font-mono text-pine">{r.hashedObjectId}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-ink">
                    <span className="text-xs text-muted mr-1">KES</span>
                    <span className="text-base tabular-nums">{r.amount.toLocaleString()}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${
                    isSent ? 'bg-emerald-50 text-emerald-800'
                    : isPending ? 'bg-amber-50 text-amber-800'
                    : isWithdrawn ? 'bg-canvas text-muted'
                    : isVoucher ? 'bg-purple-50 text-purple-800'
                    : 'bg-blue-50 text-blue-800'
                  }`}>
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {canAct ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => props.handleDispatch(r.id)}
                      className="py-2.5 bg-pine hover:bg-pine-deep text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                    >
                      <Send className="w-4 h-4" /> Dispatch
                    </button>
                    <button
                      onClick={() => { props.setIssueModal({ requestId: r.id, amount: r.amount }); props.setIssueSuccess(null); }}
                      className="py-2.5 bg-surface border border-tile text-ink rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-tint transition-colors active:scale-[0.98]"
                    >
                      <Store className="w-4 h-4" /> Voucher
                    </button>
                  </div>
                ) : isPending ? (
                  <div className="w-full py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm font-medium text-center">
                    Awaiting Audit (Tier 3 OCR)
                  </div>
                ) : isWithdrawn ? (
                  <div className="w-full py-2.5 bg-canvas text-muted rounded-lg text-sm font-mono text-center">
                    Withdrawn
                  </div>
                ) : isVoucher ? (
                  <div className="w-full py-2.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-sm font-medium text-center">
                    Voucher issued to partner
                  </div>
                ) : (
                  <div className="w-full py-2.5 bg-canvas text-muted rounded-lg text-sm font-mono text-center">
                    Dispatched
                  </div>
                )}
              </div>
            );
          })}
          {props.filteredSwap.map(r => (
            <div key={r.id} className="p-4 bg-surface border border-tile rounded-xl space-y-3 opacity-90">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">{r.id}</span>
                <span className="text-xs font-mono bg-tint px-2 py-0.5 rounded">SWAP</span>
              </div>
              <div>
                <div className="font-bold text-sm text-ink">{r.bundleCategory}</div>
                <div className="text-xs font-mono text-muted">{r.lockerLocation}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">Free</span>
                <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${
                  r.status === 'withdrawn' ? 'bg-canvas text-muted' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  {r.status}
                </span>
              </div>
              <div className="w-full py-2.5 bg-canvas text-muted rounded-lg text-sm font-mono text-center">
                {r.status === 'withdrawn' ? 'Withdrawn' : 'Self-collect'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};