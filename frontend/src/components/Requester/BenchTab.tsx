import React from 'react';
import { ShieldCheck, Phone } from 'lucide-react';
import { ScreenHeader } from '../../ui';
import './BenchTab.css';

interface Helpline {
  id: string;
  name: string;
  number: string;
  sub: string;
}

interface BenchTabProps {
  helplines: Helpline[];
}

export const BenchTab: React.FC<BenchTabProps> = (props) => {
  return (
    <div className="relative pb-20 content-in">
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none bench-orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="05"
        eyebrow="Bench"
        title="Someone to talk to."
        subtitle="Isolated from your account. No identifiers shared."
      />

      <div className="mb-8 rounded-2xl border border-lp-green/20 bg-lp-sage/30 px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-lp-green shrink-0 mt-0.5" strokeWidth={2} />
        <div>
          <div className="text-sm font-semibold text-lp-green">Isolated from your account</div>
          <p className="text-xs text-lp-ink/55 mt-1 leading-relaxed">
            No shared identifiers with Swap or Pool. Peer chat is launching soon — the helplines below are available today.
          </p>
        </div>
      </div>

      <div className="eyebrow mb-3">Reach out directly</div>
      <div>
        {props.helplines.map((h, i) => (
          <a
            key={h.id}
            href={`tel:${h.number.replace(/\s/g, '')}`}
            className="flex gap-4 py-5 border-b border-lp-ink/8 last:border-0 press-scale row-lift -mx-2 px-2 rounded-lg"
          >
            <span className="stat-display text-xl text-lp-green/40 tabular-nums shrink-0 w-8">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-ink/40">
                {h.name}
              </div>
              <div className="stat-display text-2xl text-lp-ink mt-1 tabular-nums">
                {h.number}
              </div>
              <div className="text-xs text-lp-ink/55 mt-1">{h.sub}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center shrink-0 self-center">
              <Phone className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
