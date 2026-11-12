import React, { useEffect, useRef, useState } from 'react';
import {
  HeartHandshake, Package, CreditCard, EyeOff, Lock, FileText,
  Coins, Users, Hash, ClipboardList, ShieldCheck, MapPin, Droplet,
  Zap, GraduationCap, Menu,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconTile } from '../ui/IconTile';
import { Chip } from '../ui/Chip';
import { Accordion } from '../ui/Accordion';
import { Sheet } from '../ui/Sheet';
import { LanguageToggle } from '../ui/LanguageToggle';

const APP_URL = import.meta.env.BASE_URL + 'app';

// ── Motion primitives (respect prefers-reduced-motion via CSS) ─────────────

const useInView = <T extends HTMLElement>(ref: React.RefObject<T | null>) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return visible;
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      data-reveal
      data-visible={visible}
      style={{ transitionDelay: delay + 'ms' }}
      className={className}
    >
      {children}
    </div>
  );
};

// Decorative dot-grid background. Pure CSS, no images, mask-faded at edges.
const DotGrid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={'absolute inset-0 pointer-events-none ' + className}
    style={{
      backgroundImage: 'radial-gradient(circle, rgba(31,107,74,0.14) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
    }}
    aria-hidden="true"
  />
);

// Soft sage radial glow. Slow drift for a "live" feel.
const OrbGlow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={'absolute w-[420px] h-[420px] rounded-full pointer-events-none ' + className}
    style={{
      background: 'radial-gradient(circle, rgba(220,232,224,0.7) 0%, rgba(220,232,224,0) 70%)',
      filter: 'blur(60px)',
    }}
    aria-hidden="true"
  />
);

// Sage wave divider between major sections. Replaces the flat border at 2 transitions.
const WaveDivider: React.FC = () => (
  <div className="w-full overflow-hidden -mt-px" aria-hidden="true">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10 md:h-14 block">
      <path
        d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,40 1440,30 L1440,60 L0,60 Z"
        fill="rgba(220,232,224,0.4)"
      />
    </svg>
  </div>
);

// ── Top bar ─────────────────────────────────────────────────────────────────

const TopBar: React.FC = () => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { href: '#how-it-works', label: t.nav.howItWorks },
    { href: '#give', label: t.nav.give },
    { href: '#partners', label: t.nav.partners },
    { href: '#faq', label: t.nav.faq },
  ];
  return (
    <>
      <header className="sticky top-0 z-40 bg-lp-canvas/85 backdrop-blur-md border-b border-lp-ink/10">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold text-lp-ink">{t.nav.brand}</span>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-lp-ink/70">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-lp-ink transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden md:block"><LanguageToggle /></div>
            <div className="hidden md:block"><Chip variant="prototype">{t.common.prototype}</Chip></div>
            <div className="hidden md:block">
              <Button onClick={() => { window.location.href = APP_URL; }}>{t.common.openApp}</Button>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-lp-sage/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lp-green"
              aria-label={t.common.menu}
            >
              <Menu className="w-5 h-5 text-lp-ink" />
            </button>
          </div>
        </div>
      </header>
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t.nav.brand}>
        <div className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-base font-medium text-lp-ink py-3 border-b border-lp-ink/5"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 mt-2"><LanguageToggle /></div>
          <div className="pt-2">
            <Button fullWidth onClick={() => { window.location.href = APP_URL; }}>
              {t.common.openApp}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
};

// ── Phone mockup ────────────────────────────────────────────────────────────

const PhoneMockup: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="relative mx-auto w-[280px] md:w-[300px] rounded-[2.5rem] bg-lp-ink p-2 shadow-2xl">
      <div className="rounded-[2rem] bg-lp-canvas overflow-hidden flex flex-col" style={{ height: '580px' }}>
        <div className="text-center text-[10px] pt-2 pb-1 text-lp-ink/40 font-medium">9:41</div>
        <div className="px-4 py-3 flex items-center gap-2 border-b border-lp-ink/5">
          <div className="w-7 h-7 rounded-lg bg-lp-green flex items-center justify-center">
            <HeartHandshake className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold text-lp-ink">{t.phoneMockup.header}</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="p-3 rounded-xl bg-lp-green text-white space-y-1">
            <Package className="w-4 h-4" strokeWidth={2} />
            <div className="text-xs font-semibold">{t.phoneMockup.reserve}</div>
            <div className="text-[10px] text-white/70">{t.phoneMockup.reserveSub}</div>
          </div>
          <div className="p-3 rounded-xl bg-lp-surface border border-lp-ink/10 space-y-1">
            <CreditCard className="w-4 h-4 text-lp-green" strokeWidth={2} />
            <div className="text-xs font-semibold text-lp-ink">{t.phoneMockup.pay}</div>
            <div className="text-[10px] text-lp-ink/50">{t.phoneMockup.paySub}</div>
          </div>
        </div>
        <div className="px-3 flex-1">
          <div className="text-[9px] uppercase tracking-wider text-lp-ink/40 mb-1">{t.phoneMockup.recentRequest}</div>
          <div className="p-2 rounded-lg bg-lp-sage/50 flex justify-between items-center">
            <span className="text-[10px] text-lp-ink">Bundle reserved</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lp-green text-white font-medium">
              {t.phoneMockup.recentRequestStatus}
            </span>
          </div>
        </div>
        <div className="border-t border-lp-ink/10 bg-lp-surface grid grid-cols-3 py-2">
          {[
            { label: t.phoneMockup.tabHome, active: true },
            { label: t.phoneMockup.tabActivity, active: false },
            { label: t.phoneMockup.tabSettings, active: false },
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

// ── Hero ────────────────────────────────────────────────────────────────────

const Hero: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative py-14 md:py-24 overflow-hidden">
      <DotGrid className="opacity-60" />
      <OrbGlow className="-top-20 -right-20 md:top-10 md:right-10 animate-glow" />
      <div className="relative max-w-[1120px] mx-auto px-6 grid md:grid-cols-2 gap-12 items-center animate-fade-up">
        <div>
          <h1
            className="text-[40px] md:text-[56px] leading-[1.05] text-lp-ink"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.hero.h1}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-lp-ink/70 leading-relaxed">{t.hero.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => { window.location.href = APP_URL; }}>{t.common.openApp}</Button>
            <Button
              variant="secondary"
              onClick={() => { document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              {t.common.partnerWithUs}
            </Button>
          </div>
          <div className="mt-8"><Chip>{t.hero.chip}</Chip></div>
        </div>
        <div><PhoneMockup /></div>
      </div>
    </section>
  );
};

// ── How it works ────────────────────────────────────────────────────────────

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  const steps = [
    { Icon: ClipboardList, title: t.howItWorks.step1Title, body: t.howItWorks.step1Body },
    { Icon: ShieldCheck, title: t.howItWorks.step2Title, body: t.howItWorks.step2Body },
    { Icon: MapPin, title: t.howItWorks.step3Title, body: t.howItWorks.step3Body },
  ];
  return (
    <section id="how-it-works" className="py-14 md:py-24">
      <WaveDivider />
      <div className="max-w-[1120px] mx-auto px-6 mt-8 md:mt-12">
        <Reveal>
          <h2
            className="text-3xl md:text-4xl text-lp-ink text-center mb-12 md:mb-16"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.howItWorks.title}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="relative grid md:grid-cols-3 gap-10 md:gap-12">
            <div
              className="hidden md:block absolute top-6 left-[16.66%] right-[16.66%] border-t border-dashed border-lp-green/25 pointer-events-none"
              aria-hidden="true"
            />
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="flex justify-center relative z-10"><IconTile Icon={step.Icon} /></div>
                <h3 className="mt-4 text-lg font-semibold text-lp-ink">{step.title}</h3>
                <p className="mt-2 text-base text-lp-ink/60 leading-relaxed max-w-xs mx-auto">{step.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ── What you can get ────────────────────────────────────────────────────────

const WhatYouCanGet: React.FC = () => {
  const { t } = useLanguage();
  const items = [
    { Icon: Package, title: t.whatYouCanGet.item1Title, body: t.whatYouCanGet.item1Body },
    { Icon: Droplet, title: t.whatYouCanGet.item2Title, body: t.whatYouCanGet.item2Body },
    { Icon: Zap, title: t.whatYouCanGet.item3Title, body: t.whatYouCanGet.item3Body },
    { Icon: GraduationCap, title: t.whatYouCanGet.item4Title, body: t.whatYouCanGet.item4Body },
  ];
  return (
    <section id="what-you-can-get" className="py-14 md:py-24 border-t border-lp-ink/10">
      <div className="max-w-[1120px] mx-auto px-6">
        <Reveal>
          <h2
            className="text-3xl md:text-4xl text-lp-ink text-center mb-12 md:mb-16"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.whatYouCanGet.title}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {items.map((item, i) => (
              <Card key={i} className="space-y-3 lift-hover">
                <IconTile Icon={item.Icon} />
                <h3 className="text-base font-semibold text-lp-ink">{item.title}</h3>
                <p className="text-sm text-lp-ink/60 leading-relaxed">{item.body}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ── Private by design ───────────────────────────────────────────────────────

const Private: React.FC = () => {
  const { t } = useLanguage();
  const points = [
    { Icon: EyeOff, body: t.private.point1 },
    { Icon: Lock, body: t.private.point2 },
    { Icon: FileText, body: t.private.point3 },
  ];
  return (
    <section id="private" className="relative py-14 md:py-24 border-t border-lp-ink/10 overflow-hidden">
      <DotGrid className="opacity-30" />
      <div className="relative max-w-[1120px] mx-auto px-6">
        <Reveal>
          <h2
            className="text-3xl md:text-4xl text-lp-ink text-center mb-12 md:mb-16"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.private.title}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
            {points.map((point, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center"><IconTile Icon={point.Icon} /></div>
                <p className="mt-4 text-base text-lp-ink leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-12 text-sm text-lp-ink/50 text-center max-w-2xl mx-auto leading-relaxed">
            {t.private.line}
          </p>
        </Reveal>
      </div>
    </section>
  );
};

// ── For givers ──────────────────────────────────────────────────────────────

const Givers: React.FC = () => {
  const { t } = useLanguage();
  const points = [
    { Icon: HeartHandshake, body: t.givers.point1 },
    { Icon: Coins, body: t.givers.point2 },
    { Icon: Users, body: t.givers.point3 },
    { Icon: Hash, body: t.givers.point4 },
  ];
  return (
    <section id="give" className="py-14 md:py-24 border-t border-lp-ink/10">
      <div className="max-w-[1120px] mx-auto px-6">
        <Reveal>
          <h2
            className="text-3xl md:text-4xl text-lp-ink text-center mb-12 md:mb-16"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.givers.title}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {points.map((point, i) => (
              <div
                key={i}
                className="text-center p-5 rounded-2xl border border-lp-ink/10 bg-lp-surface lift-hover"
              >
                <div className="flex justify-center"><IconTile Icon={point.Icon} /></div>
                <p className="mt-3 text-sm text-lp-ink leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-12 text-base font-medium text-lp-green text-center">{t.givers.line}</p>
          <div className="mt-6 text-center">
            <Button onClick={() => { window.location.href = APP_URL + '/donor'; }}>{t.givers.cta}</Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ── For partners ────────────────────────────────────────────────────────────

const Partners: React.FC = () => {
  const { t } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => { setSheetOpen(false); setSubmitted(false); }, 1800);
  };

  const points = [t.partners.point1, t.partners.point2, t.partners.point3];

  return (
    <section id="partners" className="py-14 md:py-24 border-t border-lp-ink/10">
      <div className="max-w-[1120px] mx-auto px-6">
        <Reveal>
          <h2
            className="text-3xl md:text-4xl text-lp-ink text-center mb-6"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.partners.title}
          </h2>
          <p className="text-base md:text-lg text-lp-ink/70 text-center mb-12 max-w-2xl mx-auto leading-relaxed">
            {t.partners.line}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-10">
            {points.map((point, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl border border-lp-ink/10 bg-lp-surface lift-hover"
              >
                <p className="text-base text-lp-ink leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="text-center">
            <Button onClick={() => setSheetOpen(true)}>{t.partners.cta}</Button>
          </div>
        </Reveal>
      </div>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t.partners.formTitle}>
        {submitted ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-lp-sage flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-lp-green" strokeWidth={2} />
            </div>
            <p className="mt-4 text-base text-lp-ink">{t.partners.success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-lp-ink mb-1.5">{t.partners.fieldOrg}</label>
              <input
                type="text"
                required
                placeholder={t.partners.fieldOrgPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink placeholder:text-lp-ink/40 focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-lp-ink mb-1.5">{t.partners.fieldType}</label>
              <select
                required
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent"
              >
                <option value="">—</option>
                {t.partners.typeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-lp-ink mb-1.5">{t.partners.fieldEmail}</label>
              <input
                type="email"
                required
                placeholder={t.partners.fieldEmailPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink placeholder:text-lp-ink/40 focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-lp-ink mb-1.5">{t.partners.fieldMessage}</label>
              <textarea
                rows={3}
                placeholder={t.partners.fieldMessagePlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink placeholder:text-lp-ink/40 focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent resize-none"
              />
            </div>
            <Button type="submit" fullWidth>{t.partners.submit}</Button>
          </form>
        )}
      </Sheet>
    </section>
  );
};

// ── Where we are ────────────────────────────────────────────────────────────

const Status: React.FC = () => {
  const { t } = useLanguage();
  const steps = [t.status.step1, t.status.step2, t.status.step3, t.status.step4];
  return (
    <section id="status" className="py-14 md:py-24 border-t border-lp-ink/10">
      <div className="max-w-[1120px] mx-auto px-6">
        <Reveal>
          <h2
            className="text-3xl md:text-4xl text-lp-ink text-center mb-6"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.status.title}
          </h2>
          <p className="text-base md:text-lg text-lp-ink/70 text-center mb-12 max-w-2xl mx-auto">
            {t.status.current}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-lp-sage text-lp-green flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <div className="mt-3 text-sm md:text-base text-lp-ink font-medium">{step}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-12 text-sm text-lp-ink/50 text-center max-w-2xl mx-auto">{t.status.line}</p>
        </Reveal>
      </div>
    </section>
  );
};

// ── FAQ ─────────────────────────────────────────────────────────────────────

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
    <section id="faq" className="py-14 md:py-24">
      <WaveDivider />
      <div className="max-w-[800px] mx-auto px-6 mt-8 md:mt-12">
        <Reveal>
          <h2
            className="text-3xl md:text-4xl text-lp-ink text-center mb-12"
            style={{ fontFamily: 'var(--font-lp-serif)' }}
          >
            {t.faq.title}
          </h2>
        </Reveal>
        <Reveal delay={100}><Accordion items={items} /></Reveal>
      </div>
    </section>
  );
};

// ── Footer ──────────────────────────────────────────────────────────────────

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-lp-ink/10 py-12 bg-lp-sage/20">
      <div className="max-w-[1120px] mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <div className="text-lg font-semibold text-lp-ink">{t.footer.brand}</div>
          <div className="mt-2 text-sm text-lp-ink/60">{t.footer.tagline}</div>
        </div>
        <div className="text-sm space-y-1.5">
          <div><a href={'https://' + t.footer.website} className="text-lp-ink/70 hover:text-lp-ink transition-colors">{t.footer.website}</a></div>
          <div><a href={'mailto:' + t.footer.email1} className="text-lp-ink/70 hover:text-lp-ink transition-colors">{t.footer.email1}</a></div>
          <div><a href={'mailto:' + t.footer.email2} className="text-lp-ink/70 hover:text-lp-ink transition-colors">{t.footer.email2}</a></div>
          <div className="text-lp-ink/70">{t.footer.phone}</div>
        </div>
        <div className="flex flex-col md:items-end gap-3">
          <LanguageToggle />
          <div className="flex gap-4 text-sm text-lp-ink/60">
            <a href="#" className="hover:text-lp-ink transition-colors">{t.footer.privacy}</a>
            <a href="#" className="hover:text-lp-ink transition-colors">{t.footer.terms}</a>
          </div>
        </div>
      </div>
      <div className="max-w-[1120px] mx-auto px-6 mt-10 pt-6 border-t border-lp-ink/10 text-xs text-lp-ink/40 text-center">
        {t.footer.copyright}
      </div>
    </footer>
  );
};

// ── Page root ───────────────────────────────────────────────────────────────

const LandingInner: React.FC = () => (
  <>
    <TopBar />
    <main>
      <Hero />
      <HowItWorks />
      <WhatYouCanGet />
      <Private />
      <Givers />
      <Partners />
      <Status />
      <Faq />
    </main>
    <Footer />
  </>
);

const Landing: React.FC = () => (
  <LanguageProvider>
    <LandingInner />
  </LanguageProvider>
);

export default Landing;
