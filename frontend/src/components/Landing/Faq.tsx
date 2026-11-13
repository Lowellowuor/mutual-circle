import React from 'react';
import { useLanguage } from '../../i18n';
import AccordionMulti from './AccordionMulti';

const Faq: React.FC = () => {
  const { t } = useLanguage();
  const items = [
    { id: 'q1', question: t.faq.q1, answer: t.faq.a1 },
    { id: 'q2', question: t.faq.q2, answer: t.faq.a2 },
    { id: 'q3', question: t.faq.q3, answer: t.faq.a3 },
    { id: 'q4', question: t.faq.q4, answer: t.faq.a4 },
    { id: 'q5', question: t.faq.q5, answer: t.faq.a5 },
  ];
  return (
    <section id="faq" className="bg-white border-y border-[#E8E6DE]">
      <div className="max-w-[800px] mx-auto px-6 section-pad">
        <div className="mb-10 md:mb-14">
          <span className="section-label">{t.faq.eyebrow}</span>
          <h2 className="type-h2-m md:type-h2-d mt-3 text-[#111111]">{t.faq.title}</h2>
        </div>
        <AccordionMulti items={items} />
      </div>
    </section>
  );
};

export default Faq;
