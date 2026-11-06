import React from 'react';

type EmptyStateProps = {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  cta?: { label: string; onClick: () => void };
  iconClassName?: string;
  compact?: boolean;
};

/**
 * Shared empty state for any list-level "no items yet" moment.
 *
 * Pattern: brand-tinted icon circle + title + optional body + optional CTA.
 * Matches the card styling from B3 (border-5, shadow-sm, rounded-2xl).
 *
 * Used in place of ad-hoc inline empty markup across Requester, Donor,
 * Console, and Messages. Consistency is the point — if a section is
 * empty, the user sees the same visual language everywhere.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  Icon,
  title,
  body,
  cta,
  iconClassName = 'text-[#1F6B4A]',
  compact = false,
}) => (
  <div className={compact ? "text-center space-y-2 py-3" : "p-8 bg-white border border-[#111111]/5 shadow-sm rounded-2xl text-center space-y-3"}>
    <div className={(compact ? "w-9 h-9 rounded-xl" : "w-12 h-12 rounded-2xl") + " bg-[#DCE8E0] flex items-center justify-center mx-auto " + iconClassName}>
      <Icon className={compact ? "w-4 h-4" : "w-6 h-6"} />
    </div>
    <div>
      <div className={compact ? "text-xs font-semibold text-[#111111]" : "text-sm font-bold text-[#111111]"}>{title}</div>
      {body && (
        <p className="text-[11px] text-[#111111]/50 mt-1 max-w-xs mx-auto leading-relaxed">{body}</p>
      )}
    </div>
    {cta && (
      <button
        onClick={cta.onClick}
        className="px-4 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-xs font-semibold transition-colors"
      >
        {cta.label}
      </button>
    )}
  </div>
);
