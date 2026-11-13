import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

const AccordionMulti: React.FC<{ items: AccordionItem[] }> = ({ items }) => {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOpen(next);
  };
  return (
    <div className="divide-y divide-[#E8E6DE] border-y border-[#E8E6DE]">
      {items.map((item) => {
        const isOpen = open.has(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={'faq-' + item.id}
              className="w-full py-5 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] focus-visible:ring-offset-2"
            >
              <span className="text-base font-medium text-[#111111]">{item.question}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className={'shrink-0 transition-transform duration-200 ' + (isOpen ? 'rotate-180' : '')}
                aria-hidden="true"
              >
                <path d="M3 6L8 11L13 6" stroke="#111111" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            <div
              id={'faq-' + item.id}
              className={'overflow-hidden transition-all duration-200 ' + (isOpen ? 'max-h-96 pb-5' : 'max-h-0')}
            >
              <p className="type-body-m type-secondary leading-relaxed pr-8">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AccordionMulti;
