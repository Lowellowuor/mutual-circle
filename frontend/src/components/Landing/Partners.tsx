import React, { useState } from 'react';
import { Hash, Coins, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { Sheet } from '../../ui/Sheet';

const Partners: React.FC = () => {
  const { t } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openSheet = () => {
    setSheetOpen(true);
    setSubmitState('idle');
    setErrorMessage(null);
    setSubmitted(false);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSubmitState('idle');
    setErrorMessage(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === 'loading') return;
    setSubmitState('loading');
    setErrorMessage(null);

    try {
      await new Promise((resolve, reject) => {
        window.setTimeout(() => {
          if (email.trim().toLowerCase().endsWith('@error.test')) {
            reject(new Error('Could not reach the server. Please try again.'));
          } else {
            resolve(true);
          }
        }, 1200);
      });
      setSubmitState('success');
      setSubmitted(true);
      window.setTimeout(() => {
        closeSheet();
      }, 1800);
    } catch (err) {
      setSubmitState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Could not send. Try again.');
    }
  };

  const principles = [
    { Icon: Hash, title: t.partners.p1Title, body: t.partners.p1Body },
    { Icon: Coins, title: t.partners.p2Title, body: t.partners.p2Body },
    { Icon: ShieldCheck, title: t.partners.p3Title, body: t.partners.p3Body },
  ];

  const isLoading = submitState === 'loading';

  return (
    <section id="partners" className="bg-[#FAF8F4]">
      <div className="max-w-[1120px] mx-auto px-6 section-pad">
        <div className="max-w-2xl mb-10 md:mb-14">
          <span className="section-label">{t.partners.eyebrow}</span>
          <h2 className="type-h2-m md:type-h2-d mt-3 text-[#111111]">{t.partners.headline}</h2>
          <p className="type-body-m md:type-body-d type-secondary mt-4 max-w-[60ch]">{t.partners.body}</p>
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

        <div className="mt-10 md:mt-14 max-w-2xl">
          <p className="type-h2-m !text-[#1F6B4A] leading-tight">{t.partners.line}</p>
          <div className="mt-6">
            <button type="button" onClick={openSheet} className="btn btn-primary">
              {t.partners.cta}
            </button>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onClose={closeSheet}>
        {submitted ? (
          <div className="py-12 text-center" role="status" aria-live="polite">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#DCE8E0] flex items-center justify-center mb-5">
              <ShieldCheck className="w-8 h-8 text-[#1F6B4A]" strokeWidth={1.75} />
            </div>
            <p className="type-h2-m text-[#111111]">{t.partners.success}</p>
            <p className="type-body-m type-secondary mt-2 max-w-xs mx-auto">{t.partners.successBody}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <span className="section-label">{t.partners.eyebrow}</span>
              <h2 className="type-h2-m mt-2 text-[#111111]">{t.partners.formTitle}</h2>
              <p className="type-body-m type-secondary mt-1">{t.partners.formSubtitle}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
              <div>
                <label htmlFor="partner-org" className="block section-label mb-2">{t.partners.fieldOrg}</label>
                <input
                  id="partner-org"
                  type="text"
                  required
                  placeholder={t.partners.fieldOrgPlaceholder}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF8F4] border border-[#E8E6DE] type-body-m text-[#111111] placeholder:text-[#4A4F4B]/50 focus:outline-none focus:border-[#1F6B4A] focus:ring-2 focus:ring-[#1F6B4A]/20 transition-all"
                />
              </div>
              <div>
                <div className="section-label mb-2">{t.partners.fieldType}</div>
                <div className="grid grid-cols-2 gap-2">
                  {t.partners.typeOptions.map((opt) => (
                    <label
                      key={opt}
                      className={
                        'relative flex items-center justify-center h-12 rounded-xl text-sm font-medium cursor-pointer transition-all focus-within:ring-2 focus-within:ring-[#1F6B4A]/30 ' +
                        (selectedType === opt
                          ? 'bg-[#1F6B4A] text-white'
                          : 'bg-[#FAF8F4] border border-[#E8E6DE] text-[#111111] hover:border-[#1F6B4A]/40')
                      }
                    >
                      <input
                        type="radio"
                        name="partnerType"
                        value={opt}
                        checked={selectedType === opt}
                        onChange={() => setSelectedType(opt)}
                        className="sr-only"
                        required
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="partner-email" className="block section-label mb-2">{t.partners.fieldEmail}</label>
                <input
                  id="partner-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.partners.fieldEmailPlaceholder}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF8F4] border border-[#E8E6DE] type-body-m text-[#111111] placeholder:text-[#4A4F4B]/50 focus:outline-none focus:border-[#1F6B4A] focus:ring-2 focus:ring-[#1F6B4A]/20 transition-all"
                />
              </div>
              <div>
                <label htmlFor="partner-msg" className="block section-label mb-2">{t.partners.fieldMessage}</label>
                <textarea
                  id="partner-msg"
                  rows={3}
                  placeholder={t.partners.fieldMessagePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF8F4] border border-[#E8E6DE] type-body-m text-[#111111] placeholder:text-[#4A4F4B]/50 focus:outline-none focus:border-[#1F6B4A] focus:ring-2 focus:ring-[#1F6B4A]/20 transition-all resize-none"
                />
              </div>

              {submitState === 'error' && errorMessage && (
                <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {isLoading ? 'Sending…' : t.partners.submit}
              </button>
            </form>
          </div>
        )}
      </Sheet>
    </section>
  );
};

export default Partners;
