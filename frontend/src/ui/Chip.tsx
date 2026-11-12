import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'prototype';
}

/**
 * Small pill label. Used for "Nairobi pilot, in design" and
 * "Prototype" markers.
 */
export const Chip: React.FC<ChipProps> = ({ children, variant = 'default' }) => {
  const styles =
    variant === 'prototype'
      ? 'bg-lp-ink/5 text-lp-ink/70 border border-lp-ink/10'
      : 'bg-lp-sage text-lp-green';
  return (
    <span
      className={[
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        styles,
      ].join(' ')}
    >
      {children}
    </span>
  );
};
