import React from 'react';

interface EditorialRowProps {
  number?: string | number;
  title: string;
  body?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  href?: string;
}

export const EditorialRow: React.FC<EditorialRowProps> = ({
  number,
  title,
  body,
  icon,
  action,
  onClick,
  active = false,
  href,
}) => {
  const isLink = Boolean(href);
  const isButton = Boolean(onClick) && !isLink;
  const baseProps: React.HTMLAttributes<HTMLElement> & { href?: string; type?: 'button' } = {};
  if (href) baseProps.href = href;
  if (isButton) baseProps.type = 'button';
  if (onClick) baseProps.onClick = onClick;

  const Tag: React.ElementType = isLink ? 'a' : isButton ? 'button' : 'div';

  return (
    <Tag
      {...baseProps}
      className={
        'w-full text-left flex gap-4 py-4 border-b border-lp-ink/8 last:border-0 press-scale ' +
        (active ? 'bg-lp-green/[0.04]' : 'row-lift')
      }
    >
      {number !== undefined && (
        <span className="stat-display text-xl text-lp-green/40 tabular-nums shrink-0 w-8">
          {typeof number === 'number' ? String(number).padStart(2, '0') : number}
        </span>
      )}
      {icon && <span className="shrink-0 pt-0.5">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-lp-ink">{title}</span>
        {body && <span className="block mt-1 text-sm text-lp-ink/55 leading-relaxed">{body}</span>}
      </span>
      {action && <span className="shrink-0 self-center">{action}</span>}
    </Tag>
  );
};
