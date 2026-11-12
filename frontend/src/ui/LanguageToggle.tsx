import React from 'react';
import { useLanguage } from '../i18n';

/**
 * EN/SW toggle. Updates page copy and html lang attribute.
 * aria-pressed for screen readers.
 */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className={[
        'inline-flex items-center rounded-full border border-lp-ink/15 p-1',
        className,
      ].join(' ')}
      role="group"
      aria-label="Language"
    >
      {(['en', 'sw'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={
            'px-3 py-1 text-sm font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lp-green ' +
            (lang === l ? 'bg-lp-green text-white' : 'text-lp-ink/60 hover:text-lp-ink')
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
