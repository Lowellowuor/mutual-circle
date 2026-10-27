import React from 'react';

export interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = 'h-4 w-full',
  lines = 1
}) => {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`bg-black/8 rounded-lg animate-pulse ${idx === lines - 1 ? 'w-3/4' : 'w-full'} ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-black/8 rounded-lg animate-pulse ${className}`} />
  );
};
