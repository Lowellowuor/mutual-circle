import React from 'react';
import { ArrowRight, Package, CreditCard } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { APP_URL, DONOR_URL } from './constants';

const Hero: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative bg-[#FAF8F4]">
      <div className="max-w-[1120px] mx-auto px-6 pt-14 pb-20 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-center">
          <div className="md:col-span-6">
            <h1 className="type-display-m md:type-display-d text-[#111111] tracking-tighter leading-[0.95]">{t.hero.h1}</h1>
            <p className="type-body-m md:type-body-d text-[#4A4F4B] mt-8 max-w-[60ch] leading-relaxed">{t.hero.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href={APP_URL} className="btn btn-primary">{t.common.openApp}</a>
              <a href={DONOR_URL} className="btn-tertiary">
                {t.hero.ctaSecondary} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#4A4F4B]">
              <span>{t.hero.trust1}</span>
              <span className="w-1 h-1 rounded-full bg-[#4A4F4B]/40" aria-hidden="true" />
              <span>{t.hero.trust2}</span>
              <span className="w-1 h-1 rounded-full bg-[#4A4F4B]/40" aria-hidden="true" />
              <span>{t.hero.trust3}</span>
            </div>
          </div>
          <div className="md:col-span-6 flex justify-center md:justify-end">
            <div className="w-[280px] md:w-[300px] rounded-[2.5rem] bg-[#111111] p-2">
              <div className="rounded-[2.1rem] bg-[#FAF8F4] overflow-hidden flex flex-col" style={{ height: '580px' }}>
                <div className="text-center text-sm pt-3 pb-1 text-[#4A4F4B]">{t.phoneMockup.statusTime}</div>
                <div className="px-4 py-3 flex items-center gap-2 border-b border-[#E8E6DE]">
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <circle cx="10" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                    <circle cx="18" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                  </svg>
                  <span className="text-sm font-semibold text-[#111111]">{t.phoneMockup.header}</span>
                </div>
                <div className="p-3 space-y-2 flex-1">
                  <div className="p-4 rounded-2xl bg-[#1F6B4A] text-white space-y-1">
                    <Package className="w-4 h-4" strokeWidth={2} />
                    <div className="text-sm font-semibold">{t.phoneMockup.reserve}</div>
                    <div className="text-sm text-white/75">{t.phoneMockup.reserveSub}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#E8E6DE] space-y-1">
                    <CreditCard className="w-4 h-4 text-[#1F6B4A]" strokeWidth={2} />
                    <div className="text-sm font-semibold text-[#111111]">{t.phoneMockup.pay}</div>
                    <div className="text-sm text-[#4A4F4B]">{t.phoneMockup.paySub}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#DCE8E0]/60 flex justify-between items-center">
                    <span className="text-sm text-[#111111]">{t.phoneMockup.recentRequest}</span>
                    <span className="text-sm px-2 py-0.5 rounded-full bg-[#1F6B4A] text-white font-medium">
                      {t.phoneMockup.recentRequestStatus}
                    </span>
                  </div>
                </div>
                <div className="border-t border-[#E8E6DE] bg-white grid grid-cols-3 py-3">
                  {[t.phoneMockup.tabHome, t.phoneMockup.tabRequests, t.phoneMockup.tabPrivacy].map((label, i) => (
                    <div key={label} className="text-center">
                      <div className={'w-4 h-4 mx-auto rounded-sm ' + (i === 0 ? 'bg-[#1F6B4A]' : 'bg-[#111111]/20')} />
                      <div className={'text-sm mt-1 ' + (i === 0 ? 'text-[#1F6B4A] font-medium' : 'text-[#4A4F4B]')}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
