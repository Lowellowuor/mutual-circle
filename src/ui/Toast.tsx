import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'info';
  onDismiss?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onDismiss,
  className = ''
}) => {
  const icon = {
    success: <CheckCircle2 className="w-4 h-4 text-[#1F6B4A] shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-700 shrink-0" />
  }[type];

  const bg = {
    success: 'bg-[#DCE8E0]/70 text-[#1F6B4A] border-[#1F6B4A]/30',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    info: 'bg-blue-50 text-blue-900 border-blue-200'
  }[type];

  return (
    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-2xs ${bg} ${className}`} role="status">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="p-1 hover:bg-black/10 rounded cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
