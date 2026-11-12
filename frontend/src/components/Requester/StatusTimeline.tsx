import React from 'react';
import { Check } from 'lucide-react';

export type TimelineStep = {
  key: string;
  label: string;
  time?: string;
  state: 'done' | 'current' | 'pending';
};

export const StatusTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => (
  <div>
    {steps.map((s, i) => {
      const isLast = i === steps.length - 1;
      const done = s.state === 'done';
      const current = s.state === 'current';
      return (
        <div key={s.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={
                'w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ' +
                (done
                  ? 'bg-lp-green border-lp-green text-white'
                  : current
                  ? 'bg-white border-lp-green text-lp-green'
                  : 'bg-white border-lp-ink/20')
              }
            >
              {done ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : current ? (
                <div className="w-2 h-2 rounded-full bg-lp-green" />
              ) : null}
            </div>
            {!isLast && (
              <div
                className={'w-0.5 flex-1 min-h-[24px] ' + (done ? 'bg-lp-green' : 'bg-lp-ink/15')}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="pb-4 min-w-0 flex-1">
            <div
              className={
                'text-xs font-semibold ' +
                (done || current ? 'text-lp-ink' : 'text-lp-ink/40')
              }
            >
              {s.label}
            </div>
            {s.time && (
              <div className="text-[10px] font-mono text-lp-ink/50 mt-0.5">{s.time}</div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
