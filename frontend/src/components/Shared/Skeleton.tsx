import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#111111]/5 rounded ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="p-4 bg-white border border-[#111111]/5 rounded-xl shadow-sm space-y-2">
    <Skeleton className="h-3 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);