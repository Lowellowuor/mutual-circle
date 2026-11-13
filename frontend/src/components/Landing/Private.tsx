import React from 'react';
import { EyeOff, Lock, FileText, Info } from 'lucide-react';
import { useLanguage } from '../../i18n';

const Private: React.FC = () => {
  const { t } = useLanguage();
  const principles = [
    { Icon: EyeOff, title: t.private.p1Title, body: t.private.p1Body },
    { Icon: Lock, title: t.private.p2Title, body: t.private.p2Body },
    { Icon: FileText, title: t.private.p3Title, body: t.private.p3Body },
  ];
  return (
    <section id="private" className="bg-white border-y border-[#E8E6DE]">
      <div className="max-w-[1120px] mx-auto px-6 section-pad">
        <div className="max-w-2xl mb-10 md:mb-14">
          <span className="section-label">{t.private.eyebrow}</span>
          <h2 className="type-h2-m md:type-h2-d mt-3 text-[#111111]">
            {t.private.headline}
          </h2>
          <p className="type-body-m md:type-body-d type-secondary mt-4 max-w-[60ch]">
            {t.private.body}
          </p>
        </div>

        <div className="border-t border-[#E8E6DE]">
          {principles.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="grid grid-cols-[48px_1fr] md:grid-cols-[48px_180px_1fr] gap-4 md:gap-6 py-6 border-b border-[#E8E6DE] items-start"
            >
              <div className="w-11 h-11 rounded-full bg-[#DCE8E0] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
              </div>
              <div className="text-base font-semibold text-[#111111] md:pt-2.5">{title}</div>
              <p className="type-body-m type-secondary col-span-2 md:col-span-1 md:pt-2.5">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 max-w-2xl">
          <Info className="w-4 h-4 text-[#4A4F4B] shrink-0 mt-1" strokeWidth={1.75} />
          <p className="text-[15px] leading-relaxed text-[#4A4F4B]">{t.private.line}</p>
        </div>
      </div>
    </section>
  );
};

export default Private;
