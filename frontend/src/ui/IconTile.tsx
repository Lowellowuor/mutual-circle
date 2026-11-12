import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface IconTileProps {
  Icon: LucideIcon;
  className?: string;
}

/**
 * Round sage icon container, 48px, green icon 24px with 1.75 stroke.
 * Per ROLE.txt component spec.
 */
export const IconTile: React.FC<IconTileProps> = ({ Icon, className = '' }) => (
  <div
    className={[
      'w-12 h-12 rounded-full bg-lp-sage flex items-center justify-center shrink-0',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <Icon className="w-6 h-6 text-lp-green" strokeWidth={1.75} />
  </div>
);
