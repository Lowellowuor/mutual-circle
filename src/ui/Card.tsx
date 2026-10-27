import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shadow' | 'muted' | 'interactive' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  // 16 to 20px radius (rounded-[18px]), 1px border OR soft shadow, never both
  const base = 'rounded-[18px] transition-all';
  
  const variants = {
    default: 'bg-white border border-[#111111]/10',
    shadow: 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]',
    muted: 'bg-[#FAF8F4] border border-[#111111]/10',
    interactive: 'bg-white border border-[#111111]/10 hover:border-[#1F6B4A] active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A]',
    outline: 'bg-transparent border border-dashed border-[#111111]/20'
  }[variant];

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6'
  }[padding];

  return (
    <div className={`${base} ${variants} ${paddings} ${className}`} {...props}>
      {children}
    </div>
  );
};
