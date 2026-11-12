import React from 'react';

interface StatDisplayProps {
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'text-2xl',
  md: 'text-3xl md:text-4xl',
  lg: 'text-4xl md:text-5xl',
};

export const StatDisplay: React.FC<StatDisplayProps> = ({
  label,
  value,
  unit,
  sublabel,
  size = 'md',
  className = '',
}) => (
  <div className={className}>
    <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-ink/40">
      {label}
    </div>
    <div className="mt-2 flex items-baseline gap-1.5">
      {unit && <span className="text-xs text-lp-ink/50 font-medium">{unit}</span>}
      <span className={`stat-display ${sizeMap[size]} text-lp-ink tabular-nums`}>{value}</span>
    </div>
    {sublabel && (
      <div className="mt-1 text-xs text-lp-ink/50">{sublabel}</div>
    )}
  </div>
);
