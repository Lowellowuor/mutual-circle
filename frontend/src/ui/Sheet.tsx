import React from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

/**
 * Bottom sheet for mobile menu and partner contact form.
 * Escape closes. Backdrop click closes.
 */
export const Sheet: React.FC<SheetProps> = ({ open, onClose, children, title }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-lp-ink/60 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 bg-lp-surface rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom duration-300">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-lp-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-full hover:bg-lp-sage/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lp-green"
            >
              <X className="w-5 h-5 text-lp-ink" strokeWidth={1.75} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
