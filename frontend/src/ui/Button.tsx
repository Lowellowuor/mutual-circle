import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

/**
 * Landing-page Button. ROLE.txt: 48px min height, 12-16px radius,
 * one primary action per section, press scale 0.98.
 * Uses lp-* tokens (not app's pine/lime) to match ROLE.txt palette.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl h-12 px-6 text-base ' +
    'transition-all duration-200 active:scale-[0.98] ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-lp-green focus-visible:ring-offset-2 focus-visible:ring-offset-lp-canvas ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary: 'bg-lp-green text-white hover:bg-lp-green/90',
    secondary: 'bg-transparent text-lp-ink border border-lp-ink/15 hover:border-lp-ink/30',
  };

  return (
    <button
      className={[base, variants[variant], fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  );
};
