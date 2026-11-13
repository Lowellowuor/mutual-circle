import React, { useState } from 'react';
import {
  Package, Droplet, CreditCard, FileText, ShieldCheck, Check, Hash, Zap, GraduationCap, Building2,
} from 'lucide-react';
import { useLanguage } from '../../i18n';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const tabs = [
    {
      id: 'request',
      label: t.howItWorks.tabRequest,
      step: t.howItWorks.requestStep,
      title: t.howItWorks.requestTitle,
      body: t.howItWorks.requestBody,
      items: [
        { Icon: Package, label: t.howItWorks.requestItem1, sub: t.howItWorks.requestItem1Sub },
        { Icon: Droplet, label: t.howItWorks.requestItem2, sub: t.howItWorks.requestItem2Sub },
        { Icon: CreditCard, label: t.howItWorks.requestItem3, sub: t.howItWorks.requestItem3Sub },
      ],
    },
    {
      id: 'verify',
      label: t.howItWorks.tabVerify,
      step: t.howItWorks.verifyStep,
      title: t.howItWorks.verifyTitle,
      body: t.howItWorks.verifyBody,
      items: [
        { Icon: FileText, label: t.howItWorks.verifyItem1, sub: t.howItWorks.verifyItem1Sub },
        { Icon: ShieldCheck, label: t.howItWorks.verifyItem2, sub: t.howItWorks.verifyItem2Sub },
        { Icon: Check, label: t.howItWorks.verifyItem3, sub: t.howItWorks.verifyItem3Sub },
      ],
    },
    {
      id: 'collect',
      label: t.howItWorks.tabCollect,
      step: t.howItWorks.collectStep,
      title: t.howItWorks.collectTitle,
      body: t.howItWorks.collectBody,
      items: [
        { Icon: Hash, label: t.howItWorks.collectItem1, sub: t.howItWorks.collectItem1Sub },
        { Icon: Package, label: t.howItWorks.collectItem2, sub: t.howItWorks.collectItem2Sub },
        { Icon: Check, label: t.howItWorks.collectItem3, sub: t.howItWorks.collectItem3Sub },
      ],
    },
  ];

  const current = tabs[activeTab] ?? tabs[0];

  const covers = [
    { Icon: Package, label: t.howItWorks.coversFood },
    { Icon: Droplet, label: t.howItWorks.coversHygiene },
    { Icon: Zap, label: t.howItWorks.coversUtility },
    { Icon: GraduationCap, label: t.howItWorks.coversSchool },
    { Icon: Building2, label: t.howItWorks.coversHospital },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="how-it-works" className="bg-[#FAF8F4]">
      <div className="max-w-[1120px] mx-auto px-6 section-pad">
        <div className="max-w-2xl mb-10 md:mb-14">
          <span className="section-label">{t.howItWorks.eyebrow}</span>
          <h2 className="type-h2-m md:type-h2-d mt-3 text-[#111111]">
            {t.howItWorks.title}
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="How it works steps"
          className="flex gap-1 md:gap-2 border-b border-[#E8E6DE] overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0"
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              id={'hiw-tab-' + tab.id}
              aria-selected={i === activeTab}
              aria-controls={'hiw-panel-' + tab.id}
              tabIndex={i === activeTab ? 0 : -1}
              onClick={() => setActiveTab(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={
                'shrink-0 px-4 md:px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] focus-visible:ring-offset-2 rounded-t-lg ' +
                (i === activeTab
                  ? 'text-[#1F6B4A] border-b-2 border-[#1F6B4A] -mb-px'
                  : 'text-[#4A4F4B] hover:text-[#111111] border-b-2 border-transparent')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={'hiw-panel-' + current.id}
          aria-labelledby={'hiw-tab-' + current.id}
          tabIndex={0}
          className="mt-10 md:mt-14 grid md:grid-cols-2 gap-10 md:gap-16 items-center focus:outline-none"
        >
          <div className="flex justify-center md:justify-start order-2 md:order-1">
            <div className="w-[280px] md:w-[300px] rounded-[2.5rem] bg-[#111111] p-2">
              <div className="rounded-[2.1rem] bg-[#FAF8F4] overflow-hidden flex flex-col" style={{ height: '580px' }}>
                <div className="text-center text-sm pt-3 pb-1 text-[#4A4F4B]">{t.phoneMockup.statusTime}</div>
                <div className="px-4 py-3 flex items-center gap-2 border-b border-[#E8E6DE]">
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <circle cx="10" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                    <circle cx="18" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                  </svg>
                  <span className="text-sm font-semibold text-[#111111]">{current.title}</span>
                </div>
                <div className="p-3 space-y-2 flex-1">
                  <div key={activeTab} className="space-y-2 content-in-fast">
                    {current.items.map((item, i) => {
                      const I = item.Icon;
                      return (
                        <div key={i} className="p-3 rounded-xl bg-white border border-[#E8E6DE] space-y-1">
                          <I className="w-4 h-4 text-[#1F6B4A]" strokeWidth={2} />
                          <div className="text-sm font-semibold text-[#111111]">{item.label}</div>
                          <div className="text-sm text-[#4A4F4B]">{item.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-[#E8E6DE] bg-white grid grid-cols-3 py-3">
                  {[t.phoneMockup.tabHome, t.phoneMockup.tabRequests, t.phoneMockup.tabPrivacy].map((lbl, i) => (
                    <div key={lbl} className="text-center">
                      <div className={'w-4 h-4 mx-auto rounded-sm ' + (i === 0 ? 'bg-[#1F6B4A]' : 'bg-[#111111]/20')} />
                      <div className={'text-sm mt-1 ' + (i === 0 ? 'text-[#1F6B4A] font-medium' : 'text-[#4A4F4B]')}>
                        {lbl}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="font-mono text-sm text-[#1F6B4A] mb-2">Step {current.step}</div>
            <h3 className="type-h2-m text-[#111111] mb-3">{current.title}</h3>
            <p className="type-body-m type-secondary max-w-[55ch]">{current.body}</p>
          </div>
        </div>

        <div className="mt-16 md:mt-24 pt-10 md:pt-14 border-t border-[#E8E6DE]">
          <div className="section-label mb-6 md:mb-8">{t.howItWorks.coversLabel}</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {covers.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4 bg-white border border-[#E8E6DE] r-control"
              >
                <div className="w-10 h-10 rounded-full bg-[#DCE8E0] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
                </div>
                <span className="text-sm font-medium text-[#111111]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
