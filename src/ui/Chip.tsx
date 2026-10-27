import React from 'react';

export interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'sage' | 'sample' | 'amber' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  selected = false
}) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all select-none';
  
  // No text under 14px (text-sm is 14px)
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2 min-h-[44px]'
  }[size];

  const variantStyles = {
    default: selected 
      ? 'bg-[#1F6B4A] text-white shadow-xs' 
      : 'bg-[#FAF8F4] text-[#111111]/80 border border-[#111111]/12 hover:bg-black/5',
    green: 'bg-[#1F6B4A] text-white',
    sage: 'bg-[#DCE8E0] text-[#1F6B4A]',
    sample: 'bg-[#FAF8F4] text-[#111111]/60 border border-[#111111]/15',
    amber: 'bg-amber-100 text-amber-900 border border-amber-200',
    blue: 'bg-blue-100 text-blue-900 border border-blue-200'
  }[variant];

  const clickable = onClick ? 'cursor-pointer active:scale-95' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`${base} ${sizeStyles} ${variantStyles} ${clickable} ${className}`}
    >
      {children}
    </button>
  );
};
