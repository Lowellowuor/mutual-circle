import React from 'react';
import { ShieldCheck, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { ScreenHeader } from '../../ui';

interface SettingsTabProps {
  tokenHash: string | null;
  rate: { count: number; value: number };
  MAX_REQUESTS: number;
  MAX_VALUE: number;
  historyCount: number;
  showServer: boolean;
  setShowServer: (v: boolean) => void;
  onBack: () => void;
  onReset: () => void;
  logout: () => void;
}

const SPEC_COVERAGE = [
  'HMAC token (4.1)',
  'Simulated OTP verification',
  'Per-token rate limits (4.1)',
  'Persistent history',
  'Withdraw flow',
  'The Swap (4.2)',
  'The Pool (4.3)',
  'Hospital ban on clinical data (4.5)',
  'Tier 2/3 escalation (4.8)',
  'The Match + decline (4.4)',
  'The Bench referral (4.9)',
];

export const SettingsTab: React.FC<SettingsTabProps> = (props) => {
  return (
    <div className="relative pb-20 content-in">
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="07"
        eyebrow="Settings"
        title="Your account."
        subtitle="Privacy state, server view, session control."
        action={
          <button onClick={props.onBack} className="text-sm font-semibold text-lp-green hover:underline press-scale">
            Back
          </button>
        }
      />

      <div className="card-editorial rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lp-green" strokeWidth={2} />
            <span className="text-sm font-semibold text-lp-ink">Server view</span>
          </div>
          <button
            onClick={() => props.setShowServer(!props.showServer)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-lp-green hover:underline press-scale"
          >
            {props.showServer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {props.showServer ? 'Hide' : 'Reveal'}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-baseline pb-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Token (HMAC)</span>
            <span className="text-xs font-mono text-lp-green truncate ml-2 max-w-[60%]">{props.tokenHash}</span>
          </div>
          <div className="flex justify-between items-baseline pb-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Raw phone</span>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              {props.showServer ? 'NOT STORED' : '••••••'}
            </span>
          </div>
          <div className="flex justify-between items-baseline pb-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Name</span>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">NONE</span>
          </div>
          <div className="flex justify-between items-baseline pb-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Rate (per token)</span>
            <span className="text-sm text-lp-ink tabular-nums">{props.rate.count} / {props.MAX_REQUESTS}</span>
          </div>
          <div className="flex justify-between items-baseline pb-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Value (per token)</span>
            <span className="text-sm text-lp-ink tabular-nums">KES {props.rate.value.toLocaleString()} / {props.MAX_VALUE.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-lp-ink/55">Persisted history</span>
            <span className="text-sm text-lp-ink tabular-nums">{props.historyCount} records</span>
          </div>
        </div>

        {props.showServer && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800 leading-relaxed">
            <strong>Invariant:</strong> phone number hashed on verification, discarded immediately. Rate limits and history keyed to the HMAC token, not the session.
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="eyebrow mb-3">Spec coverage</div>
        <div>
          {SPEC_COVERAGE.map((f, i) => (
            <div key={f} className="flex gap-4 py-3 border-b border-lp-ink/8 last:border-0">
              <span className="stat-display text-base text-lp-green/40 tabular-nums shrink-0 w-7">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm text-lp-ink/70 leading-relaxed">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={props.onReset}
        className="w-full card-editorial rounded-2xl py-3.5 text-sm font-semibold text-rose-600 hover:bg-rose-50/60 flex items-center justify-center gap-2 press-scale"
      >
        <RotateCcw className="w-4 h-4" /> Reset session
      </button>
    </div>
  );
};
