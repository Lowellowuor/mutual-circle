import React from 'react';

interface ScreenHeaderProps {
  number?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  number,
  eyebrow,
  title,
  subtitle,
  action,
}) => (
  <div className="flex items-start justify-between gap-4 mb-6">
    <div className="min-w-0 flex-1">
      {(number || eyebrow) && (
        <span className="eyebrow">
          {number && <span className="mr-1.5 tabular-nums text-lp-green/60">{number}</span>}
          {eyebrow}
        </span>
      )}
      <h1 className="display-serif mt-2 text-2xl md:text-3xl text-lp-ink leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-lp-ink/55 leading-relaxed">{subtitle}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
