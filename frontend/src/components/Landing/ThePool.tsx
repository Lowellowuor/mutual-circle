import React from 'react';
import { EyeOff, Coins, Users } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { DONOR_URL } from './constants';

const ThePool: React.FC = () => {
  const { t } = useLanguage();
  const points = [
    { Icon: EyeOff, label: t.thePool.pointAnonymousLabel, body: t.thePool.pointAnonymousBody },
    { Icon: Coins, label: t.thePool.pointPooledLabel, body: t.thePool.pointPooledBody },
    { Icon: Users, label: t.thePool.pointCampaignsLabel, body: t.thePool.pointCampaignsBody },
  ];
  return (
    <section id="the-pool" className="bg-[#0F1E17] py-16 md:py-24">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="max-w-2xl mb-10 md:mb-14">
          <span className="section-label !text-[#DCE8E0]">{t.thePool.eyebrow}</span>
          <h2 className="type-h2-m md:type-h2-d mt-3 !text-white">{t.thePool.headline}</h2>
          <p className="type-body-m md:type-body-d mt-4 !text-white/70 max-w-[60ch]">
            {t.thePool.body}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-14">
          {points.map(({ Icon, label, body }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#DCE8E0]" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-sm text-white/60 mt-0.5">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white r-card p-6 md:p-8">
            <div className="section-label !text-[#1F6B4A] mb-5">{t.thePool.requestLabel}</div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline gap-4">
                <span className="type-body-m type-secondary">{t.thePool.requestType}</span>
                <span className="type-h2-m !text-[#111111] tabular-nums">{t.thePool.requestAmount}</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#E8E6DE]">
              <div className="section-label mb-1">{t.thePool.statusLabel}</div>
              <div className="text-sm font-medium text-[#1F6B4A]">{t.thePool.requestStatus}</div>
            </div>
            <div className="mt-5 text-sm italic text-[#4A4F4B]">{t.thePool.exampleLabel}</div>
          </div>

          <div className="bg-white r-card p-6 md:p-8">
            <div className="section-label !text-[#1F6B4A] mb-5">{t.thePool.giftLabel}</div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline gap-4">
                <span className="type-body-m type-secondary">{t.thePool.giftType}</span>
                <span className="type-h2-m !text-[#111111] tabular-nums">{t.thePool.giftAmount}</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#E8E6DE]">
              <div className="section-label mb-1">{t.thePool.statusLabel}</div>
              <div className="text-sm font-medium text-[#1F6B4A]">{t.thePool.giftStatus}</div>
            </div>
            <div className="mt-5 text-sm italic text-[#4A4F4B]">{t.thePool.exampleLabel}</div>
          </div>
        </div>

        <div className="mt-14 md:mt-20 max-w-2xl">
          <p className="type-h2-m !text-[#DCE8E0]">{t.thePool.bookend}</p>
          <div className="mt-6">
            <a href={DONOR_URL} className="btn btn-primary">
              {t.thePool.giveCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThePool;
