import React, { useEffect, useRef, useState } from 'react';
import {
  HeartHandshake, Package, CreditCard, FileText,
  Coins, Users, Hash, ShieldCheck, Droplet,
  Zap, GraduationCap, Menu, ArrowRight, Check,
  EyeOff,
  Lock,
  Info,
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

// ── Ambient backdrop (subtle drifting orbs) ─────────────────────────────────

// ── Shared decorative primitives ────────────────────────────────────────────

// ── Top bar ─────────────────────────────────────────────────────────────────

const TopBar: React.FC = () => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const CircleMark = () => (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="10" cy="14" r="8" stroke="#1F6B4A" strokeWidth="1.75" />
      <circle cx="18" cy="14" r="8" stroke="#1F6B4A" strokeWidth="1.75" />
    </svg>
  );

  const links = [
    { href: '#how-it-works', label: t.nav.howItWorks },
    { href: '#three-doors', label: t.nav.give },
    { href: '#partners', label: t.nav.partners },
    { href: '#faq', label: t.nav.faq },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-sm border-b border-[#E8E6DE]">
        <div className="max-w-[1120px] mx-auto px-6 h-16 md:h-[72px] flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <CircleMark />
            <span className="text-base font-semibold text-[#111111] tracking-tight">{t.nav.brand}</span>
          </a>
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#111111] hover:text-[#1F6B4A] transition-colors focus:outline-none focus-visible:text-[#1F6B4A]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center">
            <a href={APP_URL} className="btn btn-primary !h-11 !px-5 !text-sm">
              {t.common.openApp}
            </a>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 -mr-2 text-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] rounded-lg"
            aria-label={t.common.menu}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col gap-0 py-2">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E8E6DE]">
            <CircleMark />
            <span className="text-base font-semibold text-[#111111]">{t.nav.brand}</span>
          </div>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-base font-medium text-[#111111] py-3.5 border-b border-[#E8E6DE]"
            >
              {link.label}
            </a>
          ))}
          <a href={APP_URL} onClick={() => setMenuOpen(false)} className="btn btn-primary !h-12 w-full mt-4">
            {t.common.openApp}
          </a>
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

// ── Hero ────────────────────────────────────────────────────────────────────

const Hero: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative bg-[#FAF8F4]">
      <div className="max-w-[1120px] mx-auto px-6 pt-14 pb-20 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-center">
          <div className="md:col-span-6">
            <h1 className="type-display-m md:type-display-d text-[#111111]">{t.hero.h1}</h1>
            <p className="type-body-m md:type-body-d text-[#4A4F4B] mt-6 max-w-[60ch]">{t.hero.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href={APP_URL} className="btn btn-primary">{t.common.openApp}</a>
              <a href={DONOR_URL} className="btn-tertiary">
                {t.hero.ctaSecondary} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#4A4F4B]">
              <span>{t.hero.trust1}</span>
              <span className="w-1 h-1 rounded-full bg-[#4A4F4B]/40" aria-hidden="true" />
              <span>{t.hero.trust2}</span>
              <span className="w-1 h-1 rounded-full bg-[#4A4F4B]/40" aria-hidden="true" />
              <span>{t.hero.trust3}</span>
            </div>
          </div>
          <div className="md:col-span-6 flex justify-center md:justify-end">
            <div className="w-[280px] md:w-[300px] rounded-[2.5rem] bg-[#111111] p-2">
              <div className="rounded-[2.1rem] bg-[#FAF8F4] overflow-hidden flex flex-col" style={{ height: '580px' }}>
                <div className="text-center text-[10px] pt-3 pb-1 text-[#4A4F4B]">{t.phoneMockup.statusTime}</div>
                <div className="px-4 py-3 flex items-center gap-2 border-b border-[#E8E6DE]">
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <circle cx="10" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                    <circle cx="18" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                  </svg>
                  <span className="text-xs font-semibold text-[#111111]">{t.phoneMockup.header}</span>
                </div>
                <div className="p-3 space-y-2 flex-1">
                  <div className="p-4 rounded-2xl bg-[#1F6B4A] text-white space-y-1">
                    <Package className="w-4 h-4" strokeWidth={2} />
                    <div className="text-sm font-semibold">{t.phoneMockup.reserve}</div>
                    <div className="text-[11px] text-white/75">{t.phoneMockup.reserveSub}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#E8E6DE] space-y-1">
                    <CreditCard className="w-4 h-4 text-[#1F6B4A]" strokeWidth={2} />
                    <div className="text-sm font-semibold text-[#111111]">{t.phoneMockup.pay}</div>
                    <div className="text-[11px] text-[#4A4F4B]">{t.phoneMockup.paySub}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#DCE8E0]/60 flex justify-between items-center">
                    <span className="text-[11px] text-[#111111]">{t.phoneMockup.recentRequest}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F6B4A] text-white font-medium">
                      {t.phoneMockup.recentRequestStatus}
                    </span>
                  </div>
                </div>
                <div className="border-t border-[#E8E6DE] bg-white grid grid-cols-3 py-3">
                  {[t.phoneMockup.tabHome, t.phoneMockup.tabRequests, t.phoneMockup.tabPrivacy].map((label, i) => (
                    <div key={label} className="text-center">
                      <div className={'w-4 h-4 mx-auto rounded-sm ' + (i === 0 ? 'bg-[#1F6B4A]' : 'bg-[#111111]/20')} />
                      <div className={'text-[9px] mt-1 ' + (i === 0 ? 'text-[#1F6B4A] font-medium' : 'text-[#4A4F4B]')}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Promise ─────────────────────────────────────────────────────────────────

// ── How it works ────────────────────────────────────────────────────────────

const ThePool: React.FC = () => {
  const { t } = useLanguage();
  const points = [
    { Icon: EyeOff, label: t.thePool.pointAnonymousLabel, body: t.thePool.pointAnonymousBody },
    { Icon: Coins, label: t.thePool.pointPooledLabel, body: t.thePool.pointPooledBody },
    { Icon: Users, label: t.thePool.pointCampaignsLabel, body: t.thePool.pointCampaignsBody },
  ];
  return (
    <section id="the-pool" className="bg-[#0F1E17] py-16 md:py-24">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="max-w-2xl mb-10 md:mb-14">
          <span className="section-label !text-[#DCE8E0]">{t.thePool.eyebrow}</span>
          <h2 className="type-h2-m md:type-h2-d mt-3 !text-white">{t.thePool.headline}</h2>
          <p className="type-body-m md:type-body-d mt-4 !text-white/70 max-w-[60ch]">
            {t.thePool.body}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-14">
          {points.map(({ Icon, label, body }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#DCE8E0]" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-sm text-white/60 mt-0.5">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white r-card p-6 md:p-8">
            <div className="section-label !text-[#1F6B4A] mb-5">{t.thePool.requestLabel}</div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline gap-4">
                <span className="type-body-m type-secondary">{t.thePool.requestType}</span>
                <span className="type-h2-m !text-[#111111] tabular-nums">{t.thePool.requestAmount}</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#E8E6DE]">
              <div className="section-label mb-1">{t.thePool.statusLabel}</div>
              <div className="text-sm font-medium text-[#1F6B4A]">{t.thePool.requestStatus}</div>
            </div>
            <div className="mt-5 text-sm italic text-[#4A4F4B]">{t.thePool.exampleLabel}</div>
          </div>

          <div className="bg-white r-card p-6 md:p-8">
            <div className="section-label !text-[#1F6B4A] mb-5">{t.thePool.giftLabel}</div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline gap-4">
                <span className="type-body-m type-secondary">{t.thePool.giftType}</span>
                <span className="type-h2-m !text-[#111111] tabular-nums">{t.thePool.giftAmount}</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#E8E6DE]">
              <div className="section-label mb-1">{t.thePool.statusLabel}</div>
              <div className="text-sm font-medium text-[#1F6B4A]">{t.thePool.giftStatus}</div>
            </div>
            <div className="mt-5 text-sm italic text-[#4A4F4B]">{t.thePool.exampleLabel}</div>
          </div>
        </div>

        <div className="mt-14 md:mt-20 max-w-2xl">
          <p className="type-h2-m !text-[#DCE8E0]">{t.thePool.bookend}</p>
          <div className="mt-6">
            <a href={DONOR_URL} className="btn btn-primary">
              {t.thePool.giveCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

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
              className="surface-solid r-card p-6 md:p-7 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] focus-visible:ring-offset-2 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-full bg-[#DCE8E0] flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
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

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

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
  ];

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
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => setActiveTab(i)}
              className={
                'shrink-0 px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6B4A] focus-visible:ring-offset-2 rounded-t-lg ' +
                (i === activeTab
                  ? 'text-[#1F6B4A] border-b-2 border-[#1F6B4A] -mb-px'
                  : 'text-[#4A4F4B] hover:text-[#111111] border-b-2 border-transparent')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-10 md:mt-14 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="flex justify-center md:justify-start order-2 md:order-1">
            <div className="w-[280px] md:w-[300px] rounded-[2.5rem] bg-[#111111] p-2">
              <div
                className="rounded-[2.1rem] bg-[#FAF8F4] overflow-hidden flex flex-col"
                style={{ height: '580px' }}
              >
                <div className="text-center text-[10px] pt-3 pb-1 text-[#4A4F4B]">9:41</div>
                <div className="px-4 py-3 flex items-center gap-2 border-b border-[#E8E6DE]">
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <circle cx="10" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                    <circle cx="18" cy="14" r="8" stroke="#1F6B4A" strokeWidth="2" />
                  </svg>
                  <span className="text-xs font-semibold text-[#111111]">{current.title}</span>
                </div>
                <div className="p-3 space-y-2 flex-1">
                  <div key={activeTab} className="space-y-2 content-in-fast">
                    {current.items.map((item, i) => {
                      const I = item.Icon;
                      return (
                        <div key={i} className="p-3 rounded-xl bg-white border border-[#E8E6DE] space-y-1">
                          <I className="w-4 h-4 text-[#1F6B4A]" strokeWidth={2} />
                          <div className="text-sm font-semibold text-[#111111]">{item.label}</div>
                          <div className="text-xs text-[#4A4F4B]">{item.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-[#E8E6DE] bg-white grid grid-cols-3 py-3">
                  {[t.phoneMockup.tabHome, t.phoneMockup.tabRequests, t.phoneMockup.tabPrivacy].map((lbl, i) => (
                    <div key={lbl} className="text-center">
                      <div className={'w-4 h-4 mx-auto rounded-sm ' + (i === 0 ? 'bg-[#1F6B4A]' : 'bg-[#111111]/20')} />
                      <div className={'text-[9px] mt-1 ' + (i === 0 ? 'text-[#1F6B4A] font-medium' : 'text-[#4A4F4B]')}>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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

// ── What you can get ────────────────────────────────────────────────────────

// ── Interactive demo ─────────────────────────────────────────────────────────

// ── Private by design ───────────────────────────────────────────────────────

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

// ── Section arrow (SC .m-benefits pattern) ──────────────────────────────
// Thin sage dashed line + chevron pointing from the photo toward the benefits
// it introduces. Only on md+. Lives inside the sticky photo column so it
// moves with the image as the user scrolls the numbered rows.

const Partners: React.FC = () => {
  const { t } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => { setSheetOpen(false); setSubmitted(false); }, 1800);
  };

  const principles = [
    { Icon: Hash, title: t.partners.p1Title, body: t.partners.p1Body },
    { Icon: Coins, title: t.partners.p2Title, body: t.partners.p2Body },
    { Icon: ShieldCheck, title: t.partners.p3Title, body: t.partners.p3Body },
  ];

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
            <button type="button" onClick={() => setSheetOpen(true)} className="btn btn-primary">
              {t.partners.cta}
            </button>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {submitted ? (
          <div className="py-12 text-center">
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
            <form onSubmit={handleSubmit} className="space-y-5">
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
              <button type="submit" className="btn btn-primary w-full">{t.partners.submit}</button>
            </form>
          </div>
        )}
      </Sheet>
    </section>
  );
};

const AccordionMulti: React.FC<{ items: { id: string; question: string; answer: string }[] }> = ({ items }) => {
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

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const productLinks = [
    { href: '#how-it-works', label: t.footer.linkHowItWorks },
    { href: '#three-doors', label: t.footer.linkOpenApp },
    { href: DONOR_URL, label: t.footer.linkGive },
    { href: '#partners', label: t.footer.linkPartners },
    { href: '#faq', label: t.footer.linkFaq },
  ];
  return (
    <footer className="bg-[#0F1E17] text-white pb-24 md:pb-0">
      <div className="max-w-[1120px] mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="10" cy="14" r="8" stroke="#DCE8E0" strokeWidth="1.75" />
                <circle cx="18" cy="14" r="8" stroke="#DCE8E0" strokeWidth="1.75" />
              </svg>
              <span className="text-base font-semibold tracking-tight">{t.nav.brand}</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-[40ch]">{t.footer.tagline}</p>
            <p className="text-sm text-white/40 mt-2">{t.footer.taglineCredit}</p>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm uppercase tracking-[0.1em] font-semibold text-white/40 mb-3">{t.footer.productLabel}</div>
            <ul className="space-y-2 text-sm">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-white/70 hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm uppercase tracking-[0.1em] font-semibold text-white/40 mb-3">{t.footer.companyLabel}</div>
            <ul className="space-y-2 text-sm">
              <li><a href="https://lumierecore.org" className="text-white/70 hover:text-white transition-colors">{t.footer.linkParent}</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="text-sm uppercase tracking-[0.1em] font-semibold text-white/40 mb-3">{t.footer.contactLabel}</div>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href={'https://' + t.footer.website} className="hover:text-white transition-colors">{t.footer.website}</a></li>
              <li><a href={'mailto:' + t.footer.email1} className="hover:text-white transition-colors">{t.footer.email1}</a></li>
              <li><a href={'mailto:' + t.footer.email2} className="hover:text-white transition-colors">{t.footer.email2}</a></li>
              <li>{t.footer.phone}</li>
              <li className="text-white/50">{t.footer.city}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-white/40">
          <div>{t.footer.copyright}</div>
          <div className="flex flex-wrap items-center gap-4">
            <a href={'mailto:' + t.footer.email2 + '?subject=Privacy%20policy'} className="hover:text-white transition-colors">{t.footer.privacy}</a>
            <a href={'mailto:' + t.footer.email2 + '?subject=Terms'} className="hover:text-white transition-colors">{t.footer.terms}</a>
            <a href={'mailto:' + t.footer.email2 + '?subject=Data%20protection'} className="hover:text-white transition-colors">{t.footer.dataProtection}</a>
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
      className="fixed inset-x-0 bottom-0 z-30 md:hidden bg-white border-t border-[#E8E6DE]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="p-3">
        <a href={APP_URL} className="btn btn-primary w-full">
          {t.common.openApp}
        </a>
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
      <ThreeDoors />
      <HowItWorks />
      <Private />
      <ThePool />
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
