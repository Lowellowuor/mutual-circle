import React from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

/**
 * FAQ accordion. Keyboard operable. 200ms expand.
 * aria-expanded and aria-controls for accessibility.
 */
export const Accordion: React.FC<AccordionProps> = ({ items }) => {
  const [open, setOpen] = React.useState<string | null>(null);

  return (
    <div className="divide-y divide-lp-ink/10 border-y border-lp-ink/10">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              aria-controls={'accordion-' + item.id}
              className="w-full py-5 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-lp-green focus-visible:ring-offset-2"
            >
              <span className="text-lg font-medium text-lp-ink">{item.question}</span>
              <ChevronDown
                className={
                  'w-5 h-5 text-lp-green shrink-0 transition-transform duration-200 ' +
                  (isOpen ? 'rotate-180' : '')
                }
                strokeWidth={1.75}
              />
            </button>
            <div
              id={'accordion-' + item.id}
              className={
                'overflow-hidden transition-all duration-200 ' +
                (isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0')
              }
            >
              <p className="text-base text-lp-ink/70 leading-relaxed pr-8">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
