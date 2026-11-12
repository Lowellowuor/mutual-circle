import React from 'react';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={
        'inline-flex rounded-full border border-lp-ink/10 p-1 bg-white/60 backdrop-blur-md ' +
        className
      }
      role="tablist"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={
            'px-4 py-1.5 text-sm font-medium rounded-full transition-colors press-scale ' +
            (value === opt.value
              ? 'bg-lp-green text-white'
              : 'text-lp-ink/60 hover:text-lp-ink')
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
