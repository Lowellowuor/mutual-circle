import React from 'react';
import { HeartHandshake, Package, CreditCard } from 'lucide-react';
import { useLanguage } from '../../i18n';

/**
 * Static phone mockup with 3D tilt. Historically used in the landing hero.
 * The Hero currently inlines its own straight-on mockup.
 * Preserved here so the style can be reused elsewhere.
 */
const PhoneMockup: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div
      className="relative mx-auto w-[290px] md:w-[320px] rounded-[2.75rem] bg-gradient-to-br from-lp-ink via-[#232b26] to-lp-ink p-[3px] shadow-[0_60px_100px_-20px_rgba(17,17,17,0.55),0_20px_40px_-10px_rgba(31,107,74,0.15)]"
      style={{ transform: 'rotateY(-8deg) rotateX(2deg)', transformStyle: 'preserve-3d' }}
    >
      <div className="rounded-[2.6rem] bg-lp-canvas overflow-hidden flex flex-col" style={{ height: '620px' }}>
        <div className="text-center text-sm pt-3 pb-1 text-lp-ink/40 font-medium">9:41</div>
        <div className="px-4 py-3 flex items-center justify-between border-b border-lp-ink/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lp-green flex items-center justify-center">
              <HeartHandshake className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold text-lp-ink">{t.phoneMockup.header}</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-lp-sage/60" />
        </div>
        <div className="p-3 space-y-2">
          <div className="p-3 rounded-xl bg-lp-green text-white space-y-1 shadow-lg shadow-lp-green/25">
            <Package className="w-4 h-4" strokeWidth={2} />
            <div className="text-sm font-semibold">{t.phoneMockup.reserve}</div>
            <div className="text-sm text-white/70">{t.phoneMockup.reserveSub}</div>
          </div>
          <div className="p-3 rounded-xl bg-lp-surface border border-lp-ink/10 space-y-1">
            <CreditCard className="w-4 h-4 text-lp-green" strokeWidth={2} />
            <div className="text-sm font-semibold text-lp-ink">{t.phoneMockup.pay}</div>
            <div className="text-sm text-lp-ink/50">{t.phoneMockup.paySub}</div>
          </div>
        </div>
        <div className="px-3 flex-1">
          <div className="text-sm uppercase tracking-wider text-lp-ink/40 mb-1">{t.phoneMockup.recentRequest}</div>
          <div className="p-2 rounded-lg bg-lp-sage/50 flex justify-between items-center">
            <span className="text-sm text-lp-ink">Bundle reserved</span>
            <span className="text-sm px-1.5 py-0.5 rounded-full bg-lp-green text-white font-medium">
              {t.phoneMockup.recentRequestStatus}
            </span>
          </div>
        </div>
        <div className="border-t border-lp-ink/10 bg-lp-surface grid grid-cols-3 py-2">
          {[
            { label: t.phoneMockup.tabHome, active: true },
            { label: t.phoneMockup.tabRequests, active: false },
            { label: t.phoneMockup.tabPrivacy, active: false },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={'w-4 h-4 mx-auto rounded-sm ' + (item.active ? 'bg-lp-green' : 'bg-lp-ink/20')} />
              <div className={'text-[8px] mt-0.5 ' + (item.active ? 'text-lp-green font-medium' : 'text-lp-ink/40')}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
