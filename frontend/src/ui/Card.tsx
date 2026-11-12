import React from 'react';

/**
 * Landing-page Card. ROLE.txt: 16-20px radius, 1px border OR soft shadow.
 * Never both. We use border-only for the bank-grade restraint.
 */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={['bg-lp-surface rounded-2xl border border-lp-ink/10 p-6', className].filter(Boolean).join(' ')}
    {...props}
  >
    {children}
  </div>
);
