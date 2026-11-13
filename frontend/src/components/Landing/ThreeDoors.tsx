import React from 'react';
import { Package, HeartHandshake, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { APP_URL, DONOR_URL } from './constants';

const ThreeDoors: React.FC = () => {
  const { t } = useLanguage();
  const doors = [
    { Icon: Package, title: t.threeDoors.needTitle, body: t.threeDoors.needBody, cta: t.threeDoors.needCta, href: APP_URL },
    { Icon: HeartHandshake, title: t.threeDoors.giveTitle, body: t.threeDoors.giveBody, cta: t.threeDoors.giveCta, href: DONOR_URL },
    { Icon: Users, title: t.threeDoors.partnerTitle, body: t.threeDoors.partnerBody, cta: t.threeDoors.partnerCta, href: '#partners' },
  ];
  return (
    <section id="three-doors" className="bg-white border-y border-[#E8E6DE]">
      <div className="max-w-[1120px] mx-auto px-6 section-pad">
        <div className="max-w-2xl mb-10 md:mb-14">
          <span className="section-label">{t.threeDoors.eyebrow}</span>
          <h2 className="type-h2-m md:type-h2-d mt-3 text-[#111111]">
            {t.threeDoors.headline}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {doors.map(({ Icon, title, body, cta, href }) => (
            <a
              key={title}
              href={href}
              className="surface-solid r-card p-8 md:p-10 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] focus-visible:ring-offset-2 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-[#DCE8E0] flex items-center justify-center mb-6">
                <Icon className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.5} />
              </div>
              <div className="type-h2-m text-[#111111] mb-2">{title}</div>
              <p className="type-body-m type-secondary flex-1 mb-5">{body}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#1F6B4A]">
                {cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThreeDoors;
