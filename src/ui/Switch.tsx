import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  id = 'switch-input',
  disabled = false
}) => {
  return (
    <label htmlFor={id} className={`inline-flex items-center gap-3 min-h-[44px] cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-12 h-7 rounded-full transition-colors duration-200 ${checked ? 'bg-[#1F6B4A]' : 'bg-black/20'}`} />
        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-xs ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      {label && <span className="text-sm font-medium text-[#111111]">{label}</span>}
    </label>
  );
};
