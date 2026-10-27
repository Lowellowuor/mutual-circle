import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'sticky';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'sticky';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-150 active:scale-[0.98] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  // Strict 44px min height & minimum 14px font size (no text under 14px)
  const sizeStyles = {
    sm: 'text-sm px-3.5 py-2.5 min-h-[44px]',
    md: 'text-sm px-4 py-3 min-h-[48px]',
    lg: 'text-base px-6 py-3.5 min-h-[52px]',
    sticky: 'text-base px-6 h-[52px] min-h-[52px] rounded-2xl font-semibold shadow-sm'
  }[size];

  const variantStyles = {
    primary: 'bg-[#1F6B4A] hover:bg-[#18553A] active:bg-[#13432E] text-white',
    sticky: 'bg-[#1F6B4A] hover:bg-[#18553A] active:bg-[#13432E] text-white',
    secondary: 'bg-[#DCE8E0] hover:bg-[#CFDFD4] text-[#1F6B4A] font-semibold',
    outline: 'bg-transparent border border-[#111111]/20 hover:bg-black/5 text-[#111111]',
    ghost: 'bg-transparent hover:bg-black/5 text-[#111111]/80',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white'
  }[variant];

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="mr-2 shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="ml-2 shrink-0">{icon}</span>}
    </button>
  );
};
