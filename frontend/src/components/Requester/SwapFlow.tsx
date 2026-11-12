import React from 'react';
import { CheckCircle, Copy, Check, MapPin, Package, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ScreenHeader } from '../../ui';

const BUNDLES = [
  { id: 'Standard Pantry', name: 'Standard Pantry', desc: 'Maize flour, rice, oil, lentils.', Icon: Package },
  { id: 'Hygiene Kit', name: 'Hygiene & Dignity', desc: 'Soap, sanitary pads, toothpaste.', Icon: Package },
];

const LOCATIONS = [
  { id: 'Kibera Hub', sub: '24/7 · 12 available' },
  { id: 'Mathare Central', sub: '6am–10pm · 18 available' },
  { id: 'Kawangware Station', sub: '24/7 · 4 available' },
];

interface SwapFlowProps {
  swapStep: 'bundle' | 'location' | 'success';
  setSwapStep: (step: 'bundle' | 'location') => void;
  swapBundle: string | null;
  setSwapBundle: (id: string) => void;
  swapLocation: string | null;
  setSwapLocation: (id: string) => void;
  swapResult: any | null;
  swapError: string | null;
  swapping: boolean;
  rateLimited: boolean;
  handleReserve: () => void;
  copyPin: () => void;
  pinCopied: boolean;
  goTab: (tab: 'home') => void;
}

export const SwapFlow: React.FC<SwapFlowProps> = (props) => {
  // ── Success bookend ──────────────────────────────────────────────────
  if (props.swapStep === 'success' && props.swapResult) {
    return (
      <div className="relative pb-20 content-in">
        <div
          className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
          style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
          aria-hidden="true"
        />

        <div className="relative text-center pt-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-lp-sage flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-lp-green" strokeWidth={1.75} />
          </div>
          <span className="eyebrow">03 — Reserved</span>
          <h2 className="display-serif mt-3 text-4xl text-lp-ink leading-tight">
            Locker reserved.
          </h2>
          <p className="mt-3 text-sm text-lp-ink/55">
            Collect any time. PIN sent via SMS.
          </p>
        </div>

        <div className="relative card-editorial rounded-3xl p-6 text-center mb-8">
          <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-lp-ink/40">
            Collection PIN
          </div>
          <div className="stat-display text-5xl md:text-6xl text-lp-green tracking-[0.12em] mt-3 tabular-nums">
            {props.swapResult.pin}
          </div>
          <button
            onClick={props.copyPin}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-lp-ink/60 hover:text-lp-ink transition-colors press-scale"
          >
            {props.pinCopied ? (
              <><Check className="w-3 h-3 text-lp-green" /> Copied</>
            ) : (
              <><Copy className="w-3 h-3" /> Copy PIN</>
            )}
          </button>
        </div>

        <div className="relative mb-8">
          <div className="eyebrow mb-3">Details</div>
          <div className="flex justify-between items-baseline py-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Bundle</span>
            <span className="text-sm font-semibold text-lp-ink">{props.swapResult.bundleCategory}</span>
          </div>
          <div className="flex justify-between items-baseline py-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Locker</span>
            <span className="text-sm font-semibold text-lp-ink">{props.swapResult.lockerLocation}</span>
          </div>
          <div className="flex justify-between items-baseline py-3">
            <span className="text-sm text-lp-ink/55">Reference</span>
            <span className="text-xs font-mono text-lp-ink/70">REF-{props.swapResult.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <div className="relative mb-8">
          <div className="eyebrow mb-3">How to collect</div>
          {[
            'Go to ' + props.swapResult.lockerLocation,
            'Enter your PIN at the terminal',
            'Take your bundle',
          ].map((step, i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-lp-ink/8 last:border-0">
              <span className="stat-display text-xl text-lp-green/40 tabular-nums shrink-0 w-8">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm text-lp-ink/70 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>

        <Button onClick={() => props.goTab('home')} fullWidth>
          Done
        </Button>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────
  return (
    <div className="relative pb-20 content-in">
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="02"
        eyebrow="Swap"
        title={props.swapStep === 'bundle' ? 'Choose a bundle.' : 'Choose a locker.'}
        subtitle={props.swapStep === 'bundle' ? 'Pick what fits your household.' : 'Pick where you can collect.'}
      />

      {props.rateLimited && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-900">Daily limit reached. Try again tomorrow.</p>
        </div>
      )}
      {props.swapError && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-900">{props.swapError}</p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <div className={'flex items-center gap-2 ' + (props.swapStep === 'bundle' ? 'text-lp-green' : 'text-lp-ink/40')}>
          <span className="stat-display text-base tabular-nums">01</span>
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">Bundle</span>
        </div>
        <div className={'flex-1 h-px ' + (props.swapStep === 'location' ? 'bg-lp-green/40' : 'bg-lp-ink/10')} />
        <div className={'flex items-center gap-2 ' + (props.swapStep === 'location' ? 'text-lp-green' : 'text-lp-ink/40')}>
          <span className="stat-display text-base tabular-nums">02</span>
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">Location</span>
        </div>
      </div>

      {props.swapStep === 'bundle' && (
        <div className="space-y-3">
          {BUNDLES.map(b => {
            const I = b.Icon;
            const selected = props.swapBundle === b.id;
            return (
              <button
                key={b.id}
                onClick={() => props.setSwapBundle(b.id)}
                className={'w-full text-left card-editorial rounded-2xl p-4 flex items-start gap-3 press-scale transition-all ' + (selected ? 'ring-2 ring-lp-green' : '')}
              >
                <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center shrink-0">
                  <I className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-lp-ink">{b.name}</div>
                  <div className="text-xs text-lp-ink/55 mt-1 leading-relaxed">{b.desc}</div>
                </div>
                {selected && <CheckCircle className="w-5 h-5 text-lp-green shrink-0" strokeWidth={2} />}
              </button>
            );
          })}
          <div className="pt-2">
            <Button variant="primary" fullWidth onClick={() => props.setSwapStep('location')} disabled={!props.swapBundle}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {props.swapStep === 'location' && (
        <div className="space-y-3">
          {LOCATIONS.map(l => {
            const selected = props.swapLocation === l.id;
            return (
              <button
                key={l.id}
                onClick={() => props.setSwapLocation(l.id)}
                className={'w-full text-left card-editorial rounded-2xl p-4 flex items-center gap-3 press-scale transition-all ' + (selected ? 'ring-2 ring-lp-green' : '')}
              >
                <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-lp-ink">{l.id}</div>
                  <div className="text-xs text-lp-ink/55 mt-0.5">{l.sub}</div>
                </div>
                {selected && <CheckCircle className="w-5 h-5 text-lp-green shrink-0" strokeWidth={2} />}
              </button>
            );
          })}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => props.setSwapStep('bundle')}>
              Back
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={props.handleReserve}
              disabled={!props.swapLocation || props.swapping || props.rateLimited}
            >
              {props.swapping ? 'Reserving…' : 'Reserve'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
