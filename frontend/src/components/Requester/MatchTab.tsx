import React from 'react';
import { CheckCircle, ShieldAlert, X, Eye, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ScreenHeader } from '../../ui';

interface Opportunity {
  id: string;
  title: string;
  locality: string;
  commit: string;
  desc: string;
  Icon: React.ElementType;
  accent: string;
}

interface MatchTabProps {
  opportunitiesWithIcons: Opportunity[];
  declined: Set<string>;
  setDeclined: React.Dispatch<React.SetStateAction<Set<string>>>;
  matchSent: string | null;
  setMatchSent: (id: string) => void;
  selectedOpp: Opportunity | null;
  setSelectedOpp: (opp: Opportunity | null) => void;
  matchConfirmed: boolean;
  setMatchConfirmed: (v: boolean) => void;
  expressInterest: (opportunityId: string, title: string) => void;
}

export const MatchTab: React.FC<MatchTabProps> = (props) => {
  const visible = props.opportunitiesWithIcons.filter(o => !props.declined.has(o.id));

  return (
    <div className="relative pb-20 content-in">
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="04"
        eyebrow="Match"
        title="Opportunities."
        subtitle="Opt-in only. Your request history is never shared."
      />

      {props.matchSent && (
        <div className="mb-6 rounded-2xl border border-lp-green/20 bg-lp-sage/30 px-4 py-3 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-lp-green shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <div className="text-sm font-semibold text-lp-green">Interest sent.</div>
            <div className="text-xs text-lp-ink/55 mt-0.5">Provider will contact within 48h.</div>
          </div>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 leading-relaxed">
          Requires opt-in disclosure. Your token history is never shared.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="display-serif text-3xl text-lp-ink">No open opportunities.</p>
          <p className="mt-3 text-sm text-lp-ink/55 max-w-xs mx-auto leading-relaxed">
            Reset to view all declined opportunities, or check back later.
          </p>
        </div>
      ) : (
        <div>
          {visible.map((opp, i) => {
            const I = opp.Icon;
            const sent = props.matchSent === opp.id;
            return (
              <div key={opp.id} className="py-5 border-b border-lp-ink/8 last:border-0">
                <div className="flex gap-4">
                  <span className="stat-display text-xl text-lp-green/40 tabular-nums shrink-0 w-8">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-lp-ink">{opp.title}</div>
                        <div className="text-xs text-lp-ink/55 mt-0.5">{opp.locality} · {opp.commit}</div>
                      </div>
                      <button
                        onClick={() => props.setDeclined(s => new Set(s).add(opp.id))}
                        aria-label="Not interested"
                        className="p-1.5 rounded-full text-lp-ink/40 hover:text-rose-600 hover:bg-rose-50 shrink-0 transition-colors press-scale"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-lp-ink/65 leading-relaxed mt-2">{opp.desc}</p>
                    {sent ? (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-lp-green">
                        <CheckCircle className="w-3 h-3" /> Interest sent
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { props.setSelectedOpp(opp); props.setMatchConfirmed(false); }}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-lp-green hover:underline press-scale"
                      >
                        Express interest
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {props.selectedOpp && (
        <div className="fixed inset-0 z-50 bg-lp-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => props.setSelectedOpp(null)}>
          <div className="card-editorial rounded-3xl max-w-sm w-full p-6 space-y-4 content-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold uppercase tracking-[0.14em]">
                  <ShieldAlert className="w-3 h-3" /> Requires disclosure
                </div>
                <h3 className="display-serif text-2xl text-lp-ink mt-3">{props.selectedOpp.title}</h3>
              </div>
              <button
                onClick={() => props.setSelectedOpp(null)}
                aria-label="Close"
                className="text-lp-ink/40 hover:text-lp-ink press-scale"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-amber-50/60 border border-amber-200/60 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-amber-800">What this means</p>
              <ul className="text-sm text-amber-900/80 leading-relaxed space-y-1.5">
                <li>· Provider receives your contact channel</li>
                <li>· Your request history is <strong>not</strong> shared</li>
                <li>· Withdraw anytime before contact</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-lp-ink/10 cursor-pointer bg-lp-canvas press-scale">
              <input
                type="checkbox"
                checked={props.matchConfirmed}
                onChange={e => props.setMatchConfirmed(e.target.checked)}
                className="mt-1 accent-lp-green w-4 h-4"
              />
              <span className="text-sm text-lp-ink leading-relaxed">I consent to being contacted.</span>
            </label>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => props.setSelectedOpp(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  if (props.selectedOpp) {
                    props.setMatchSent(props.selectedOpp.id);
                    props.expressInterest(props.selectedOpp.id, props.selectedOpp.title);
                    props.setSelectedOpp(null);
                  }
                }}
                disabled={!props.matchConfirmed}
              >
                Send interest
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
