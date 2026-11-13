import React, { useEffect, useRef, useState } from 'react';
import {
  HeartHandshake, Package, CreditCard, FileText,
  Coins, Users, Hash, ShieldCheck, Droplet,
  Zap, GraduationCap, Menu, ArrowRight, Check,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '../i18n';
import { Button } from '../ui/Button';
import { IconTile } from '../ui/IconTile';
import { Chip } from '../ui/Chip';
import { Accordion } from '../ui/Accordion';
import { Sheet } from '../ui/Sheet';

const APP_URL = import.meta.env.BASE_URL + 'app';
const DONOR_URL = import.meta.env.BASE_URL + 'donor';

// Curated photography — served locally from frontend/public/images/landing/
// (see ROLE.txt amendment 2026-11-13). No people, no partner logos.
const BASE = import.meta.env.BASE_URL;
const IMG = {
  food: BASE + 'images/landing/food.jpg',
  hygiene: BASE + 'images/landing/hygiene.jpg',
  utility: BASE + 'images/landing/utility.jpg',
  school: BASE + 'images/landing/school.jpg',
  heroAccent: BASE + 'images/landing/hero-accent.jpg',
  architecture: BASE + 'images/landing/architecture.jpg',
  giving: BASE + 'images/landing/giving.jpg',
  institutions: BASE + 'images/landing/institutions.jpg',
};

// ── Reveal / scroll animation ───────────────────────────────────────────────

const useInView = <T extends HTMLElement>(ref: React.RefObject<T | null>) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return visible;
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
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

// ── Ambient backdrop (subtle drifting orbs) ─────────────────────────────────

const AmbientBackdrop: React.FC = () => (
  <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
    <div
      className="absolute -top-32 -left-20 w-[500px] h-[500px] rounded-full blur-3xl orb-drift"
      style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.55) 0%, rgba(220,232,224,0) 70%)' }}
    />
    <div
      className="absolute -bottom-40 -right-24 w-[600px] h-[600px] rounded-full blur-3xl orb-drift-slow"
      style={{ background: 'radial-gradient(circle, rgba(31,107,74,0.08) 0%, rgba(31,107,74,0) 70%)' }}
    />
  </div>
);

// ── Shared decorative primitives ────────────────────────────────────────────

const Eyebrow: React.FC<{ children: React.ReactNode; number?: string }> = ({ children, number }) => (
  <span className="eyebrow">
    {number && <span className="mr-1.5 tabular-nums text-lp-green/60">{number}</span>}
    {children}
  </span>
);

const DotGrid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={'absolute inset-0 pointer-events-none ' + className}
    style={{
      backgroundImage: 'radial-gradient(circle, rgba(31,107,74,0.14) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
    }}
    aria-hidden="true"
  />
);

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
  const [scrolled, setScrolled] = useState(false);
  const [whatOpen, setWhatOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const closeTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const sectionIds = ['how-it-works', 'inside-circle', 'what-you-can-get', 'give', 'partners', 'faq'];
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      let current = '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 130) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatItems = [
    { label: t.navItems.food, href: '#what-you-can-get', Icon: Package, sub: 'Standardised pantry bundle' },
    { label: t.navItems.hygiene, href: '#what-you-can-get', Icon: Droplet, sub: 'Soap, sanitary, cleaning' },
    { label: t.navItems.bills, href: '#what-you-can-get', Icon: Zap, sub: 'Power and water' },
    { label: t.navItems.school, href: '#what-you-can-get', Icon: GraduationCap, sub: 'Paid to the school' },
  ];

  const navLinks = [
    { href: '#how-it-works', label: t.nav.howItWorks, slug: 'how-it-works' },
    { href: '#inside-circle', label: t.nav.theCircle, slug: 'inside-circle' },
    { href: '#partners', label: t.nav.partners, slug: 'partners' },
    { href: '#faq', label: t.nav.faq, slug: 'faq' },
  ];

  const openWhat = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setWhatOpen(true);
  };
  const scheduleCloseWhat = () => {
    closeTimer.current = window.setTimeout(() => setWhatOpen(false), 150);
  };

  return (
    <>
      <header className={'sticky top-0 z-40 ' + (scrolled ? 'shadow-sm' : '')}>
        {/* Main bar - 72px desktop, 64px mobile */}
        <div className="relative bg-white/70 backdrop-blur-xl border-b border-white/50">
          <div className="max-w-[1120px] mx-auto px-6 h-16 md:h-[72px] flex items-center justify-between">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-lp-green flex items-center justify-center shadow-lg shadow-lp-green/20 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold text-lp-ink tracking-tight">{t.nav.brand}</span>
            </a>

            <nav className="hidden md:flex items-center gap-0.5">
              <a
                href="#how-it-works"
                className={
                  'relative px-3 py-2 text-sm font-medium rounded-full transition-all ' +
                  (activeSection === 'how-it-works'
                    ? 'text-lp-ink'
                    : 'text-lp-ink/60 hover:text-lp-ink hover:bg-lp-ink/[0.04]')
                }
              >
                {t.nav.howItWorks}
                {activeSection === 'how-it-works' && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-lp-green" aria-hidden="true" />
                )}
              </a>

              <button
                type="button"
                onMouseEnter={openWhat}
                onMouseLeave={scheduleCloseWhat}
                onClick={() => setWhatOpen(o => !o)}
                aria-expanded={whatOpen}
                aria-haspopup="true"
                className={
                  'relative px-3 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-1 ' +
                  (activeSection === 'what-you-can-get'
                    ? 'text-lp-ink'
                    : 'text-lp-ink/60 hover:text-lp-ink hover:bg-lp-ink/[0.04]')
                }
              >
                {t.navItems.whatYouGetLabel}
                <svg width="10" height="10" viewBox="0 0 10 10" className={'transition-transform ' + (whatOpen ? 'rotate-180' : '')} aria-hidden="true">
                  <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </svg>
                {activeSection === 'what-you-can-get' && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-lp-green" aria-hidden="true" />
                )}
              </button>

              {navLinks.slice(1).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={
                    'relative px-3 py-2 text-sm font-medium rounded-full transition-all ' +
                    (activeSection === link.slug
                      ? 'text-lp-ink'
                      : 'text-lp-ink/60 hover:text-lp-ink hover:bg-lp-ink/[0.04]')
                  }
                >
                  {link.label}
                  {activeSection === link.slug && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-lp-green" aria-hidden="true" />
                  )}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="glass"
                onClick={() => { window.location.href = DONOR_URL; }}
                className="!h-10 !px-4 !text-sm"
              >
                {t.common.give}
              </Button>
              <Button
                onClick={() => { window.location.href = APP_URL; }}
                className="!h-10 !px-4 !text-sm"
              >
                {t.common.getHelp}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-lp-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-lp-green"
              aria-label={t.common.menu}
            >
              <Menu className="w-5 h-5 text-lp-ink" />
            </button>
          </div>

          {/* Mega menu - full-width, drops from main bar */}
          {whatOpen && (
            <div
              onMouseEnter={openWhat}
              onMouseLeave={scheduleCloseWhat}
              className="absolute left-0 right-0 top-full bg-white border-t border-lp-ink/8 shadow-2xl z-50 content-in"
              role="region"
              aria-label={t.navItems.whatYouGetLabel}
            >
              <div className="max-w-[1120px] mx-auto px-6 py-6 grid grid-cols-[1fr_1fr_260px] gap-6">
                <div className="col-span-2 grid grid-cols-2 gap-1">
                  {whatItems.map((item) => {
                    const I = item.Icon;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setWhatOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-lp-sage/30 transition-colors press-scale"
                      >
                        <div className="w-9 h-9 rounded-full bg-lp-sage flex items-center justify-center shrink-0">
                          <I className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-lp-ink">{item.label}</div>
                          <div className="text-xs text-lp-ink/55 mt-0.5">{item.sub}</div>
                        </div>
                      </a>
                    );
                  })}
                </div>
                <div className="bg-[#020B43] rounded-xl p-5 flex flex-col text-white">
                  <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-emerald-400 mb-3">
                    The principle
                  </div>
                  <p className="display-serif text-base text-white leading-tight">
                    Every gift enters the pool. Every request leaves from the pool.
                  </p>
                  <p className="text-xs text-white/60 mt-2 leading-relaxed flex-1">
                    No line between giver and receiver.
                  </p>
                  <a
                    href="#inside-circle"
                    onClick={() => setWhatOpen(false)}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Inside the circle <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
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
          <div className="pt-4 text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-ink/40">
            {t.navItems.whatYouGetLabel}
          </div>
          <div className="flex flex-col gap-1 mt-1">
            {whatItems.map((it) => {
              const I = it.Icon;
              return (
                <a
                  key={it.label}
                  href={it.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 text-sm text-lp-ink/70 py-2 px-1 press-scale"
                >
                  <div className="w-7 h-7 rounded-full bg-lp-sage/60 flex items-center justify-center shrink-0">
                    <I className="w-3.5 h-3.5 text-lp-green" strokeWidth={1.75} />
                  </div>
                  {it.label}
                </a>
              );
            })}
          </div>
          <div className="pt-4">
            <a href={APP_URL} className="block text-sm font-medium text-lp-ink py-2">
              Sign in →
            </a>
          </div>
        </div>
      </Sheet>
    </>
  );
};

const PhoneMockup: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div
      className="relative mx-auto w-[290px] md:w-[320px] rounded-[2.75rem] bg-gradient-to-br from-lp-ink via-[#232b26] to-lp-ink p-[3px] shadow-[0_60px_100px_-20px_rgba(17,17,17,0.55),0_20px_40px_-10px_rgba(31,107,74,0.15)]"
      style={{ transform: 'rotateY(-8deg) rotateX(2deg)', transformStyle: 'preserve-3d' }}
    >
      <div className="rounded-[2.6rem] bg-lp-canvas overflow-hidden flex flex-col" style={{ height: '620px' }}>
        <div className="text-center text-[10px] pt-3 pb-1 text-lp-ink/40 font-medium">9:41</div>
        <div className="px-4 py-3 flex items-center justify-between border-b border-lp-ink/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lp-green flex items-center justify-center">
              <HeartHandshake className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold text-lp-ink">{t.phoneMockup.header}</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-lp-sage/60" />
        </div>
        <div className="p-3 space-y-2">
          <div className="p-3 rounded-xl bg-lp-green text-white space-y-1 shadow-lg shadow-lp-green/25">
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
    <section className="relative overflow-hidden mesh-hero">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 -left-20 w-[460px] h-[460px] rounded-full bg-lp-sage/60 blur-3xl orb-drift" />
        <div className="absolute -top-32 right-0 w-[560px] h-[560px] rounded-full bg-lp-green/10 blur-3xl orb-drift-slow" />
      </div>
      <DotGrid className="opacity-40" />

      <div className="relative max-w-[1120px] mx-auto px-6 min-h-[80vh] md:min-h-[calc(100vh-6.5rem)] py-16 md:py-24 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-6 animate-fade-up">
          <Eyebrow>{t.hero.eyebrow}</Eyebrow>
          <h1 className="display-serif mt-6 text-[44px] md:text-[64px] lg:text-[76px] leading-[0.98] text-lp-ink">
            {t.hero.h1}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-lp-ink/65 max-w-lg leading-relaxed">
            {t.hero.sub}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button onClick={() => { window.location.href = APP_URL; }}>
              {t.common.openApp}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              variant="glass"
              onClick={() => { document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              {t.common.partnerWithUs}
            </Button>
          </div>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full glass px-4 py-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-lp-ink/80">{t.hero.chip}</span>
          </div>
        </div>

        <div className="md:col-span-6 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[420px] h-[420px] rounded-full bg-gradient-to-br from-lp-green/25 via-lp-sage/40 to-transparent blur-3xl" />
          </div>

          <div
            className="absolute top-2 -left-6 md:-left-10 w-[190px] rounded-2xl bg-lp-canvas p-4 shadow-[0_30px_60px_-15px_rgba(17,17,17,0.32)] border border-lp-ink/8 float-slow hidden md:block"
            style={{ transform: 'rotate(-3deg)' }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-lp-ink/50">
                Reserved
              </span>
            </div>
            <div className="text-xs font-semibold text-lp-ink">Standard Pantry</div>
            <div className="text-[10px] text-lp-ink/55 mt-0.5">Kibera Hub</div>
            <div className="mt-3 pt-3 border-t border-lp-ink/8 flex justify-between items-baseline">
              <span className="text-[9px] uppercase tracking-[0.18em] text-lp-ink/40">PIN</span>
              <span className="display-serif text-xl text-lp-green tracking-[0.1em] tabular-nums">
                4712
              </span>
            </div>
          </div>

          <div
            className="absolute bottom-16 -right-6 float-medium hidden md:block shadow-2xl rounded-2xl overflow-hidden w-[170px] border-[6px] border-white bg-lp-sage/40 ring-1 ring-lp-ink/8"
            style={{ transform: 'rotate(4deg)' }}
          >
            <div className="relative">
              <img
                src={IMG.heroAccent}
                alt={t.hero.accentAlt}
                className="w-full h-full object-cover aspect-square"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(31,107,74,0.05) 0%, transparent 40%, rgba(17,17,17,0.10) 100%)' }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="relative float-slow" style={{ perspective: '1400px' }}>
            <PhoneMockup />
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-[260px] h-[28px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(17,17,17,0.25) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Promise ─────────────────────────────────────────────────────────────────

const Promise: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-lp-canvas border-t border-lp-ink/5">
      <AmbientBackdrop />
      <div className="max-w-4xl mx-auto px-6 text-center">
        <Eyebrow number={t.promise.number}>{t.promise.eyebrow}</Eyebrow>
        <h2 className="display-serif mt-6 text-[36px] md:text-[56px] lg:text-[64px] leading-[1.05] text-lp-ink">
          {t.promise.headline}
        </h2>
        <p className="mt-8 text-lg md:text-xl text-lp-ink/60 max-w-2xl mx-auto leading-relaxed">
          {t.promise.body}
        </p>
      </div>
    </section>
  );
};

// ── How it works ────────────────────────────────────────────────────────────

const InsideTheCircle: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section
      id="inside-circle"
      className="relative py-20 md:py-32 mesh-navy overflow-hidden text-white"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-[420px] h-[420px] rounded-full bg-lp-green/30 blur-3xl orb-drift" />
        <div className="absolute bottom-10 right-10 w-[380px] h-[380px] rounded-full bg-lp-green/20 blur-3xl orb-drift-slow" />
      </div>

      <div className="relative max-w-[1120px] mx-auto px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow-dark"><span className="mr-1.5 tabular-nums text-emerald-400/70">{t.insideCircle.number}</span>{t.insideCircle.eyebrow}</span>
            <h2 className="display-serif mt-5 text-[44px] md:text-[72px] leading-[1.0] text-white">
              {t.insideCircle.headline}
            </h2>
            <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed">
              {t.insideCircle.body}
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-16 grid md:grid-cols-2 gap-8 md:gap-20">
            <div>
              <div className="glass-dark rounded-3xl p-7 md:p-8">
                <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-400 mb-5">
                  {t.insideCircle.requestLabel}
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="text-white/50">{t.insideCircle.requestBill}</span>
                    <span className="display-serif text-2xl md:text-[28px] leading-none text-white tabular-nums">KES 850</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-white/50">{t.insideCircle.requestRef}</span>
                    <span className="font-mono text-white">541234567</span>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/30 mb-1.5">
                    Status
                  </div>
                  <div className="text-sm font-medium text-emerald-400">
                    {t.insideCircle.requestStatus}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/25 text-center font-medium">
                {t.insideCircle.example}
              </div>
            </div>

            <div>
              <div className="glass-dark rounded-3xl p-7 md:p-8">
                <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-400 mb-5">
                  {t.insideCircle.giftLabel}
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="text-white/50">{t.insideCircle.giftAmount}</span>
                    <span className="display-serif text-2xl md:text-[28px] leading-none text-white tabular-nums">KES 850</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-white/50">{t.insideCircle.giftDonor}</span>
                    <span className="text-white">{t.insideCircle.giftDonorValue}</span>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/30 mb-1.5">
                    Status
                  </div>
                  <div className="text-sm font-medium text-emerald-400">
                    {t.insideCircle.giftStatus}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/25 text-center font-medium">
                {t.insideCircle.example}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  const [flow, setFlow] = useState<'need' | 'give'>('need');

  const renderFlow = (steps: { title: string; body: string }[]) => (
    <div>
      {steps.map((step, i) => (
        <div
          key={i}
          className="py-10 md:py-14 border-b border-lp-ink/8 last:border-0"
        >
          <div className="md:hidden">
            <span className="display-serif text-[48px] leading-none text-lp-green/25 tabular-nums block mb-3">
              0{i + 1}
            </span>
            <h3 className="text-lg font-semibold text-lp-ink">{step.title}</h3>
            <p className="mt-2 text-base text-lp-ink/60 leading-relaxed">{step.body}</p>
          </div>
          <div className="hidden md:grid grid-cols-[auto_1fr] gap-10 items-baseline">
            <span className="display-serif text-[96px] leading-none text-lp-green/25 tabular-nums">
              0{i + 1}
            </span>
            <div>
              <h3 className="text-2xl font-semibold text-lp-ink">{step.title}</h3>
              <p className="mt-2 text-base text-lp-ink/60 leading-relaxed">{step.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 md:py-32">
      <AmbientBackdrop />
      <div className="max-w-[1120px] mx-auto px-6">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow number={t.howItWorks.number}>{t.howItWorks.eyebrow}</Eyebrow>
            <h2 className="display-serif mt-4 text-[40px] md:text-[56px] leading-[1.02] text-lp-ink">
              {t.howItWorks.title}
            </h2>
          </div>
        </Reveal>

        <div className="md:hidden mt-10">
          <div className="inline-flex rounded-full border border-lp-ink/10 p-1">
            <button
              type="button"
              onClick={() => setFlow('need')}
              className={
                'px-5 py-2 text-sm font-medium rounded-full transition-colors ' +
                (flow === 'need' ? 'bg-lp-green text-white' : 'text-lp-ink/60')
              }
            >
              {t.howItWorks.needLabel}
            </button>
            <button
              type="button"
              onClick={() => setFlow('give')}
              className={
                'px-5 py-2 text-sm font-medium rounded-full transition-colors ' +
                (flow === 'give' ? 'bg-lp-green text-white' : 'text-lp-ink/60')
              }
            >
              {t.howItWorks.giveLabel}
            </button>
          </div>
        </div>

        <div className="md:hidden mt-4">
          {renderFlow(flow === 'need' ? t.howItWorks.needSteps : t.howItWorks.giveSteps)}
        </div>

        <Reveal delay={100}>
          <div className="hidden md:grid md:grid-cols-2 gap-16 lg:gap-20 mt-16">
            <div>
              <div className="pb-6 text-[11px] uppercase tracking-[0.22em] font-semibold text-lp-green">
                {t.howItWorks.needLabel}
              </div>
              {renderFlow(t.howItWorks.needSteps)}
            </div>
            <div>
              <div className="pb-6 text-[11px] uppercase tracking-[0.22em] font-semibold text-lp-green">
                {t.howItWorks.giveLabel}
              </div>
              {renderFlow(t.howItWorks.giveSteps)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ── What you can get ────────────────────────────────────────────────────────

// ── Interactive demo ─────────────────────────────────────────────────────────

const DEMO_TABS = [
  {
    id: 'request' as const,
    number: '01',
    label: 'Request',
    subtitle: 'Choose what you need.',
    header: 'What do you need?',
    items: [
      { Icon: Package, label: 'Food bundle', sub: 'Reserved in seconds' },
      { Icon: CreditCard, label: 'Pay a bill', sub: 'Utility, school, hospital' },
      { Icon: Users, label: 'Match', sub: 'Opt-in opportunities' },
    ],
  },
  {
    id: 'verify' as const,
    number: '02',
    label: 'Verify',
    subtitle: 'We check the bill, not you.',
    header: 'Upload your bill',
    items: [
      { Icon: FileText, label: 'Photo of bill', sub: 'JPEG, PNG, or PDF' },
      { Icon: ShieldCheck, label: 'Verified by staff', sub: 'Under review' },
      { Icon: Check, label: 'Approved', sub: 'Funds go to the institution' },
    ],
  },
  {
    id: 'collect' as const,
    number: '03',
    label: 'Collect',
    subtitle: 'PIN. Collect. Done.',
    header: 'Locker reserved',
    items: [
      { Icon: Hash, label: 'PIN 4712', sub: 'Sent by SMS' },
      { Icon: Package, label: 'Food bundle', sub: 'Standard Pantry' },
      { Icon: Check, label: 'Ready to collect', sub: 'Kibera Hub' },
    ],
  },
];

const DemoPhone: React.FC<{ tab: typeof DEMO_TABS[number] }> = ({ tab }) => (
  <div className="relative mx-auto w-[290px] md:w-[320px] rounded-[2.75rem] bg-gradient-to-br from-lp-ink via-[#232b26] to-lp-ink p-[3px] shadow-[0_40px_80px_-20px_rgba(17,17,17,0.45)]">
    <div className="rounded-[2.6rem] bg-lp-canvas overflow-hidden flex flex-col" style={{ height: '620px' }}>
      <div className="text-center text-[10px] pt-3 pb-1 text-lp-ink/40 font-medium">9:41</div>
      <div className="px-4 py-3 flex items-center gap-2 border-b border-lp-ink/5">
        <div className="w-7 h-7 rounded-lg bg-lp-green flex items-center justify-center">
          <HeartHandshake className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold text-lp-ink">{tab.header}</span>
      </div>
      <div className="p-4 space-y-3 flex-1">
        {tab.items.map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-lp-surface border border-lp-ink/8 space-y-1 content-in"
            style={{ animationDelay: i * 80 + 'ms' }}
          >
            <item.Icon className="w-4 h-4 text-lp-green" strokeWidth={2} />
            <div className="text-xs font-semibold text-lp-ink">{item.label}</div>
            <div className="text-[10px] text-lp-ink/50">{item.sub}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-lp-ink/10 bg-lp-surface grid grid-cols-3 py-2">
        {[
          { label: 'Home', active: true },
          { label: 'Activity', active: false },
          { label: 'Settings', active: false },
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

const InteractiveDemo: React.FC = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setActive(a => (a + 1) % DEMO_TABS.length), 6000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section className="relative overflow-hidden py-20 md:py-32 border-t border-lp-ink/5">
      <AmbientBackdrop />
      <div className="relative max-w-[1120px] mx-auto px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>See it in action</Eyebrow>
            <h2 className="display-serif mt-4 text-[40px] md:text-[56px] leading-[1.05] text-lp-ink">
              Three actions. One screen.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <Reveal delay={100}>
            <div className="order-2 md:order-1">
              {DEMO_TABS.map((tab, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setActive(i); setPaused(true); }}
                    className={
                      'w-full text-left flex gap-5 py-5 border-b border-lp-ink/8 last:border-0 press-scale transition-all ' +
                      (isActive ? 'bg-lp-green/[0.04]' : 'row-lift')
                    }
                  >
                    <span
                      className={
                        'display-serif text-3xl md:text-4xl tabular-nums w-14 shrink-0 transition-colors ' +
                        (isActive ? 'text-lp-green' : 'text-lp-ink/15')
                      }
                    >
                      {tab.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold text-lp-ink">{tab.label}</div>
                      <div className="text-sm text-lp-ink/55 mt-1">{tab.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="order-1 md:order-2 flex justify-center">
              <DemoPhone tab={DEMO_TABS[active]} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const WhatYouCanGet: React.FC = () => {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const items = [
    { Icon: Package, title: t.whatYouCanGet.item1Title, body: t.whatYouCanGet.item1Body, img: IMG.food, alt: t.whatYouCanGet.item1Alt },
    { Icon: Droplet, title: t.whatYouCanGet.item2Title, body: t.whatYouCanGet.item2Body, img: IMG.hygiene, alt: t.whatYouCanGet.item2Alt },
    { Icon: Zap, title: t.whatYouCanGet.item3Title, body: t.whatYouCanGet.item3Body, img: IMG.utility, alt: t.whatYouCanGet.item3Alt },
    { Icon: GraduationCap, title: t.whatYouCanGet.item4Title, body: t.whatYouCanGet.item4Body, img: IMG.school, alt: t.whatYouCanGet.item4Alt },
  ];

  return (
    <section id="what-you-can-get" className="relative overflow-hidden py-20 md:py-32 border-t border-lp-ink/5">
      <AmbientBackdrop />
      <div className="max-w-[1120px] mx-auto px-6">
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow number={t.whatYouCanGet.number}>{t.whatYouCanGet.eyebrow}</Eyebrow>
            <h2 className="display-serif mt-4 text-[40px] md:text-[56px] leading-[1.02] text-lp-ink">
              {t.whatYouCanGet.title}
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
          <div className="md:col-span-5">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-lp-sage/40 shadow-2xl ring-1 ring-lp-ink/10">
              {items.map((item, i) => (
                <img
                  key={i}
                  src={item.img}
                  alt={item.alt}
                  className={
                    'absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ' +
                    (i === active ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]')
                  }
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                />
              ))}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(31,107,74,0.05) 0%, transparent 30%, transparent 70%, rgba(17,17,17,0.15) 100%)' }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="md:col-span-7">
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={
                  'w-full text-left flex gap-5 py-5 border-b border-lp-ink/8 last:border-0 transition-colors ' +
                  (i === active ? 'bg-lp-green/[0.05]' : 'hover:bg-lp-ink/[0.02]')
                }
              >
                <span
                  className={
                    'display-serif text-3xl md:text-4xl tabular-nums w-12 shrink-0 transition-colors ' +
                    (i === active ? 'text-lp-green' : 'text-lp-ink/15')
                  }
                >
                  0{i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <item.Icon className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
                    <h3 className="text-lg font-semibold text-lp-ink">{item.title}</h3>
                  </div>
                  <p className="mt-1.5 text-sm text-lp-ink/60 leading-relaxed">{item.body}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Private by design ───────────────────────────────────────────────────────

const PhotoBreak: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[70vh] md:h-[85vh] min-h-[500px] max-h-[800px]">
        <img
          src={IMG.architecture}
          alt={t.photoBreak.alt}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(31,107,74,0.10) 0%, transparent 40%)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-ink/85 via-lp-ink/30 to-lp-ink/40" />
        <div className="relative z-10 h-full max-w-[1120px] mx-auto px-6 flex items-end pb-16 md:pb-24">
          <div className="max-w-3xl">
            <span className="eyebrow-dark">{t.photoBreak.eyebrow}</span>
            <p className="display-serif mt-5 text-[36px] md:text-[56px] lg:text-[64px] leading-[1.05] text-white">
              {t.photoBreak.quote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Private: React.FC = () => {
  const { t } = useLanguage();
  const principles = [
    { title: t.private.p1Title, body: t.private.p1Body },
    { title: t.private.p2Title, body: t.private.p2Body },
    { title: t.private.p3Title, body: t.private.p3Body },
  ];
  return (
    <section id="private" className="relative py-16 md:py-28 overflow-hidden mesh-sage">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-[420px] h-[420px] rounded-full bg-lp-green/10 blur-3xl orb-drift" />
        <div className="absolute bottom-10 left-10 w-[380px] h-[380px] rounded-full bg-lp-sage/60 blur-3xl orb-drift-slow" />
      </div>
      <div className="relative max-w-[1120px] mx-auto px-6">
        <Reveal>
          <div className="max-w-3xl">
            <Eyebrow number={t.private.number}>{t.private.eyebrow}</Eyebrow>
            <h2 className="display-serif mt-4 text-[40px] md:text-[64px] leading-[1.0] text-lp-ink">
              {t.private.headline}
            </h2>
            <p className="mt-6 text-lg md:text-xl text-lp-ink/65 leading-relaxed">
              {t.private.body}
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-16 md:mt-20 max-w-3xl">
            {principles.map((p, i) => (
              <div
                key={i}
                className="py-6 md:py-8 border-b border-lp-ink/8 last:border-0 grid grid-cols-[auto_1fr] gap-6 md:gap-10 items-baseline"
              >
                <span className="display-serif text-xl md:text-2xl text-lp-green/40 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="md:flex md:gap-8 md:items-baseline">
                  <h3 className="text-base md:text-lg font-semibold text-lp-ink md:w-40 shrink-0">
                    {p.title}
                  </h3>
                  <p className="mt-1 md:mt-0 text-sm md:text-base text-lp-ink/60 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-20 md:mt-28 max-w-3xl">
            <p className="display-serif text-[32px] md:text-[48px] leading-[1.1] text-lp-green">
              {t.private.line}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ── Section arrow (SC .m-benefits pattern) ──────────────────────────────
// Thin sage dashed line + chevron pointing from the photo toward the benefits
// it introduces. Only on md+. Lives inside the sticky photo column so it
// moves with the image as the user scrolls the numbered rows.

const SectionArrow: React.FC<{ direction: 'left' | 'right'; className?: string }> = ({ direction, className = '' }) => (
  <div
    className={'hidden md:block absolute pointer-events-none text-lp-green/40 ' + className}
    aria-hidden="true"
  >
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
      <line
        x1={direction === 'left' ? 44 : 4}
        y1="16"
        x2={direction === 'left' ? 8 : 40}
        y2="16"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 4"
        strokeLinecap="round"
      />
      <polyline
        points={direction === 'left' ? '12,8 4,16 12,24' : '36,8 44,16 36,24'}
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const Givers: React.FC = () => {
  const { t } = useLanguage();
  const principles = [
    { title: t.givers.p1Title, body: t.givers.p1Body },
    { title: t.givers.p2Title, body: t.givers.p2Body },
    { title: t.givers.p3Title, body: t.givers.p3Body },
  ];
  return (
    <section id="give" className="relative overflow-hidden py-20 md:py-32 border-t border-lp-ink/5">
      <AmbientBackdrop />
      <div className="relative max-w-[1120px] mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">
          {/* Text column */}
          <div className="md:col-span-3">
            <Reveal>
              <div>
                <Eyebrow number={t.givers.number}>{t.givers.eyebrow}</Eyebrow>
                <h2 className="display-serif mt-4 text-[40px] md:text-[64px] leading-[1.0] text-lp-ink">
                  {t.givers.headline}
                </h2>
                <p className="mt-6 text-lg md:text-xl text-lp-ink/65 leading-relaxed">
                  {t.givers.body}
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-12 md:mt-16">
                {principles.map((p, i) => (
                  <div
                    key={i}
                    className="py-6 md:py-8 border-b border-lp-ink/8 last:border-0 grid grid-cols-[auto_1fr] gap-6 md:gap-8 items-baseline"
                  >
                    <span className="display-serif text-xl md:text-2xl text-lp-green/40 tabular-nums">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-lp-ink">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-sm md:text-base text-lp-ink/60 leading-relaxed">
                        {p.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-14 md:mt-20">
                <p className="display-serif text-[28px] md:text-[44px] leading-[1.1] text-lp-green">
                  {t.givers.line}
                </p>
                <div className="mt-8">
                  <Button onClick={() => { window.location.href = DONOR_URL; }}>
                    {t.givers.cta}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Photo column */}
          <Reveal delay={150} className="md:col-span-2">
            <div className="md:sticky md:top-28 relative">
              <SectionArrow direction="left" className="-left-14 top-32" />
              <figure className="relative">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-lp-sage/40 shadow-2xl ring-1 ring-lp-ink/10">
                  <img
                    src={IMG.giving}
                    alt={t.givers.photoAlt}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.03]"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(31,107,74,0.06) 0%, rgba(31,107,74,0.02) 50%, rgba(17,17,17,0.18) 100%)' }}
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-emerald-300 mb-1">
                      The pool
                    </div>
                    <div className="display-serif text-xl leading-tight">Where gifts gather.</div>
                  </div>
                </div>
              </figure>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const Partners: React.FC = () => {
  const { t } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => { setSheetOpen(false); setSubmitted(false); }, 1800);
  };

  const principles = [
    { title: t.partners.p1Title, body: t.partners.p1Body },
    { title: t.partners.p2Title, body: t.partners.p2Body },
    { title: t.partners.p3Title, body: t.partners.p3Body },
  ];

  return (
    <section id="partners" className="relative overflow-hidden py-20 md:py-32 border-t border-lp-ink/5">
      <AmbientBackdrop />
      <div className="relative max-w-[1120px] mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">
          {/* Photo column (left on desktop) */}
          <Reveal delay={150} className="md:col-span-2 md:order-1">
            <div className="md:sticky md:top-28 relative">
              <SectionArrow direction="right" className="-right-14 top-32" />
              <figure className="relative">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-lp-sage/40 shadow-2xl ring-1 ring-lp-ink/10">
                  <img
                    src={IMG.institutions}
                    alt={t.partners.photoAlt}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.03]"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(31,107,74,0.06) 0%, rgba(31,107,74,0.02) 50%, rgba(17,17,17,0.22) 100%)' }}
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-emerald-300 mb-1">
                      The settle
                    </div>
                    <div className="display-serif text-xl leading-tight">Where bills get paid.</div>
                  </div>
                </div>
              </figure>
            </div>
          </Reveal>

          {/* Text column (right on desktop) */}
          <div className="md:col-span-3 md:order-2">
            <Reveal>
              <div>
                <Eyebrow number={t.partners.number}>{t.partners.eyebrow}</Eyebrow>
                <h2 className="display-serif mt-4 text-[40px] md:text-[64px] leading-[1.0] text-lp-ink">
                  {t.partners.headline}
                </h2>
                <p className="mt-6 text-lg md:text-xl text-lp-ink/65 leading-relaxed">
                  {t.partners.body}
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-12 md:mt-16">
                {principles.map((p, i) => (
                  <div
                    key={i}
                    className="py-6 md:py-8 border-b border-lp-ink/8 last:border-0 grid grid-cols-[auto_1fr] gap-6 md:gap-8 items-baseline"
                  >
                    <span className="display-serif text-xl md:text-2xl text-lp-green/40 tabular-nums">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-lp-ink">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-sm md:text-base text-lp-ink/60 leading-relaxed">
                        {p.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-14 md:mt-20">
                <p className="display-serif text-[28px] md:text-[44px] leading-[1.1] text-lp-green">
                  {t.partners.line}
                </p>
                <div className="mt-8">
                  <Button onClick={() => setSheetOpen(true)}>
                    {t.partners.cta}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
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
              <input type="text" required placeholder={t.partners.fieldOrgPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink placeholder:text-lp-ink/40 focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-lp-ink mb-1.5">{t.partners.fieldType}</label>
              <select required
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent">
                <option value="">Select</option>
                {t.partners.typeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-lp-ink mb-1.5">{t.partners.fieldEmail}</label>
              <input type="email" required placeholder={t.partners.fieldEmailPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink placeholder:text-lp-ink/40 focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-lp-ink mb-1.5">{t.partners.fieldMessage}</label>
              <textarea rows={3} placeholder={t.partners.fieldMessagePlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-lp-canvas border border-lp-ink/15 text-base text-lp-ink placeholder:text-lp-ink/40 focus:outline-none focus:ring-2 focus:ring-lp-green focus:border-transparent resize-none" />
            </div>
            <Button type="submit" fullWidth>{t.partners.submit}</Button>
          </form>
        )}
      </Sheet>
    </section>
  );
};

const Faq: React.FC = () => {
  const { t } = useLanguage();
  const items = [
    { id: 'q1', question: t.faq.q1, answer: t.faq.a1 },
    { id: 'q2', question: t.faq.q2, answer: t.faq.a2 },
    { id: 'q3', question: t.faq.q3, answer: t.faq.a3 },
    { id: 'q4', question: t.faq.q4, answer: t.faq.a4 },
    { id: 'q5', question: t.faq.q5, answer: t.faq.a5 },
  ];
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  return (
    <section id="faq" className="relative overflow-hidden py-16 md:py-28">
      <WaveDivider />
      <AmbientBackdrop />
      <div className="max-w-[1120px] mx-auto px-6 mt-6 md:mt-10">
        <Reveal>
          <div className="text-center">
            <Eyebrow number={t.faq.number}>{t.faq.eyebrow}</Eyebrow>
            <h2 className="display-serif mt-3 text-4xl md:text-5xl text-lp-ink">
              {t.faq.title}
            </h2>
          </div>
        </Reveal>

        {/* Desktop: two-column swap. Questions left, answer right. */}
        <Reveal delay={100}>
          <div className="hidden md:grid grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 mt-14 items-start">
            <div>
              {items.map((item, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={isActive}
                    className={
                      'w-full text-left flex items-start gap-4 py-4 border-b border-lp-ink/8 last:border-0 press-scale transition-colors ' +
                      (isActive ? 'text-lp-ink' : 'text-lp-ink/55 hover:text-lp-ink row-lift')
                    }
                  >
                    <span
                      className={
                        'display-serif text-xl tabular-nums shrink-0 w-8 transition-colors ' +
                        (isActive ? 'text-lp-green' : 'text-lp-ink/20')
                      }
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-base font-medium leading-snug flex-1">
                      {item.question}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-lp-green shrink-0 mt-2" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="card-editorial rounded-3xl p-8 md:p-10 min-h-[220px]" key={active}>
              <div className="content-in">
                <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-lp-green mb-4">
                  Answer
                </div>
                <p className="text-base md:text-lg text-lp-ink leading-relaxed">
                  {current.answer}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Mobile: accordion (unchanged from before) */}
        <Reveal delay={100}>
          <div className="md:hidden mt-10">
            <Accordion items={items} />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="relative overflow-hidden mesh-navy text-white mt-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[420px] h-[420px] rounded-full bg-lp-green/20 blur-3xl orb-drift" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-lp-green/10 blur-3xl orb-drift-slow" />
      </div>

      <div className="relative max-w-[1120px] mx-auto px-6 pt-20 md:pt-28 pb-16 md:pb-20">

        {/* Statement - the whole footer message in one line */}
        <div className="max-w-3xl">
          <p className="display-serif text-[44px] md:text-[64px] lg:text-[72px] leading-[1.0] text-white">
            {t.footer.tagline}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/40 font-semibold">
            <span>{t.footer.brand}</span>
            <span className="w-1 h-1 rounded-full bg-white/25" aria-hidden="true" />
            <span>{t.footer.city}</span>
          </div>
        </div>

        {/* Three columns, compact */}
        <div className="mt-20 md:mt-28 grid md:grid-cols-3 gap-10 md:gap-16">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-5 font-semibold">
              {t.footer.product}
            </div>
            <ul className="space-y-3 text-sm">
              <li><a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">{t.footer.linkHowItWorks}</a></li>
              <li><a href="#inside-circle" className="text-white/70 hover:text-white transition-colors">{t.footer.linkTheCircle}</a></li>
              <li><a href="#give" className="text-white/70 hover:text-white transition-colors">{t.footer.linkGive}</a></li>
              <li><a href="#partners" className="text-white/70 hover:text-white transition-colors">{t.footer.linkPartners}</a></li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-5 font-semibold">
              {t.footer.company}
            </div>
            <ul className="space-y-3 text-sm">
              <li><a href="https://lumierecore.org" className="text-white/70 hover:text-white transition-colors">{t.footer.linkParent}</a></li>
              <li><a href="#status" className="text-white/70 hover:text-white transition-colors">{t.footer.linkRoadmap}</a></li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-5 font-semibold">
              {t.footer.contact}
            </div>
            <ul className="space-y-3 text-sm">
              <li><a href={'https://' + t.footer.website} className="text-white/70 hover:text-white transition-colors">{t.footer.website}</a></li>
              <li><a href={'mailto:' + t.footer.email1} className="text-white/70 hover:text-white transition-colors">{t.footer.email1}</a></li>
              <li><a href={'mailto:' + t.footer.email2} className="text-white/70 hover:text-white transition-colors">{t.footer.email2}</a></li>
              <li><span className="text-white/70">{t.footer.phone}</span></li>
            </ul>
          </div>
        </div>

        {/* Legal strip - one row, quiet */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-white/40">
          <div>{t.footer.copyright}</div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href={'mailto:' + t.footer.email2 + '?subject=Privacy%20policy%20request'} className="hover:text-white transition-colors">{t.footer.privacy}</a>
            <a href={'mailto:' + t.footer.email2 + '?subject=Terms%20of%20service%20request'} className="hover:text-white transition-colors">{t.footer.terms}</a>
            <a href={'mailto:' + t.footer.email2 + '?subject=Data%20protection%20policy%20request'} className="hover:text-white transition-colors">{t.footer.linkDataProtection}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};


// ── Mobile dock ─────────────────────────────────────────────────────────────

const MobileDock: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-white/95 backdrop-blur-xl border-t border-lp-ink/10 px-4 pt-3 pb-3">
        <div className="flex gap-2">
          <Button
            variant="glass"
            onClick={() => { window.location.href = DONOR_URL; }}
            className="!h-11 flex-1"
          >
            {t.common.give}
          </Button>
          <Button
            onClick={() => { window.location.href = APP_URL; }}
            className="!h-11 flex-[1.4]"
          >
            {t.common.getHelp}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Page root ───────────────────────────────────────────────────────────────

const LandingInner: React.FC = () => (
  <>
    <TopBar />
    <main>
      <Hero />
      <Promise />
      <InsideTheCircle />
      <HowItWorks />
      <InteractiveDemo />
      <WhatYouCanGet />
      <PhotoBreak />
      <Private />
      <Givers />
      <Partners />
      <Faq />
    </main>
    <Footer />
    <MobileDock />
  </>
);

const Landing: React.FC = () => (
  <LanguageProvider>
    <LandingInner />
  </LanguageProvider>
);

export default Landing;
