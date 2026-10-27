import React from 'react';

export interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  value,
  label,
  className = ''
}) => {
  return (
    <div className={`p-4 rounded-[18px] bg-white border border-[#111111]/10 flex flex-col items-start gap-2 ${className}`}>
      {/* Icon + Number first! */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="font-mono text-2xl font-bold text-[#111111]">
          {value}
        </div>
      </div>
      {/* Label second */}
      <div className="text-sm font-medium text-[#111111]/70">
        {label}
      </div>
    </div>
  );
};
