import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  buttonLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  message,
  buttonLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center rounded-[18px] bg-white border border-[#111111]/10 flex flex-col items-center justify-center space-y-3 ${className}`}>
      {/* 48px round icon container in sage with green icon */}
      <div className="w-12 h-12 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <p className="text-sm text-[#111111]/75 font-medium max-w-xs">
        {message}
      </p>
      {buttonLabel && onAction && (
        <Button 
          variant="secondary" 
          size="md" 
          onClick={onAction}
          className="mt-1"
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
};
