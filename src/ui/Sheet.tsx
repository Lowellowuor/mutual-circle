import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content Container - 200ms slide up */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#111111]/10 max-h-[88vh] flex flex-col overflow-hidden z-10 transition-transform duration-200 ease-out animate-in slide-in-from-bottom"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-black/20" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-[#111111]/10 flex items-center justify-between">
          <div>
            {title && (
              <h3 id="sheet-title" className="font-serif text-[20px] font-bold text-[#111111]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-[#111111]/65 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 rounded-full hover:bg-black/5 text-[#111111]/70 hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body Content - Minimum 14px text */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-[#111111]/85 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};
