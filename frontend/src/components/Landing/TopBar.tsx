import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { Sheet } from '../../ui/Sheet';
import { APP_URL } from './constants';

const TopBar: React.FC = () => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const CircleMark = () => (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="10" cy="14" r="8" stroke="#1F6B4A" strokeWidth="1.75" />
      <circle cx="18" cy="14" r="8" stroke="#1F6B4A" strokeWidth="1.75" />
    </svg>
  );

  const links = [
    { href: '#how-it-works', label: t.nav.howItWorks },
    { href: '#three-doors', label: t.nav.give },
    { href: '#partners', label: t.nav.partners },
    { href: '#faq', label: t.nav.faq },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-sm border-b border-[#E8E6DE]">
        <div className="max-w-[1120px] mx-auto px-6 h-16 md:h-[72px] flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <CircleMark />
            <span className="text-base font-semibold text-[#111111] tracking-tight">{t.nav.brand}</span>
          </a>
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#111111] hover:text-[#1F6B4A] transition-colors focus:outline-none focus-visible:text-[#1F6B4A]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center">
            <a href={APP_URL} className="btn btn-primary !h-11 !px-5 !text-sm">
              {t.common.openApp}
            </a>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 -mr-2 text-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] rounded-lg"
            aria-label={t.common.menu}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col gap-0 py-2">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E8E6DE]">
            <CircleMark />
            <span className="text-base font-semibold text-[#111111]">{t.nav.brand}</span>
          </div>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-base font-medium text-[#111111] py-3.5 border-b border-[#E8E6DE]"
            >
              {link.label}
            </a>
          ))}
          <a href={APP_URL} onClick={() => setMenuOpen(false)} className="btn btn-primary !h-12 w-full mt-4">
            {t.common.openApp}
          </a>
        </div>
      </Sheet>
    </>
  );
};

export default TopBar;
