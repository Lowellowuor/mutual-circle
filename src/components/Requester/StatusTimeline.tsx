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
              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                done
                  ? 'bg-[#1F6B4A] border-[#1F6B4A] text-white'
                  : current
                  ? 'bg-white border-[#1F6B4A] text-[#1F6B4A]'
                  : 'bg-white border-[#111111]/20'
              }`}
            >
              {done ? (
                <Check className="w-3 h-3" />
              ) : current ? (
                <div className="w-2 h-2 rounded-full bg-[#1F6B4A]" />
              ) : null}
            </div>
            {!isLast && (
              <div className={`w-0.5 flex-1 min-h-[24px] ${done ? 'bg-[#1F6B4A]' : 'bg-[#111111]/15'}`} />
            )}
          </div>
          <div className="pb-4 min-w-0 flex-1">
            <div className={`text-[12px] font-semibold ${done || current ? 'text-[#111111]' : 'text-[#111111]/40'}`}>
              {s.label}
            </div>
            {s.time && <div className="text-[10px] font-mono text-[#111111]/50 mt-0.5">{s.time}</div>}
          </div>
        </div>
      );
    })}
  </div>
);
