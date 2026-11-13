import React from 'react';
import { useLanguage } from '../../i18n';
import { DONOR_URL } from './constants';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const productLinks = [
    { href: '#how-it-works', label: t.footer.linkHowItWorks },
    { href: '#three-doors', label: t.footer.linkOpenApp },
    { href: DONOR_URL, label: t.footer.linkGive },
    { href: '#partners', label: t.footer.linkPartners },
    { href: '#faq', label: t.footer.linkFaq },
  ];
  return (
    <footer className="bg-[#0F1E17] text-white pb-24 md:pb-0">
      <div className="max-w-[1120px] mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="10" cy="14" r="8" stroke="#DCE8E0" strokeWidth="1.75" />
                <circle cx="18" cy="14" r="8" stroke="#DCE8E0" strokeWidth="1.75" />
              </svg>
              <span className="text-base font-semibold tracking-tight">{t.nav.brand}</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-[40ch]">{t.footer.tagline}</p>
                      </div>
          <div className="md:col-span-2">
            <div className="text-sm uppercase tracking-[0.1em] font-semibold text-white/40 mb-3">{t.footer.productLabel}</div>
            <ul className="space-y-2 text-sm">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-white/70 hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm uppercase tracking-[0.1em] font-semibold text-white/40 mb-3">{t.footer.companyLabel}</div>
            <ul className="space-y-2 text-sm">
              <li><a href="https://lumierecore.org" className="text-white/70 hover:text-white transition-colors">{t.footer.linkParent}</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="text-sm uppercase tracking-[0.1em] font-semibold text-white/40 mb-3">{t.footer.contactLabel}</div>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href={'https://' + t.footer.website} className="hover:text-white transition-colors">{t.footer.website}</a></li>
              <li><a href={'mailto:' + t.footer.email1} className="hover:text-white transition-colors">{t.footer.email1}</a></li>
              <li><a href={'mailto:' + t.footer.email2} className="hover:text-white transition-colors">{t.footer.email2}</a></li>
              <li>{t.footer.phone}</li>
              <li className="text-white/50">{t.footer.city}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-white/40">
          <div>{t.footer.copyright}</div>
          <div className="flex flex-wrap items-center gap-4">
            <a href={'mailto:' + t.footer.email2 + '?subject=Privacy%20policy'} className="hover:text-white transition-colors">{t.footer.privacy}</a>
            <a href={'mailto:' + t.footer.email2 + '?subject=Terms'} className="hover:text-white transition-colors">{t.footer.terms}</a>
            <a href={'mailto:' + t.footer.email2 + '?subject=Data%20protection'} className="hover:text-white transition-colors">{t.footer.dataProtection}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
