import React, { createContext, useContext, useState } from 'react';
import { en, type Strings } from './en';
import { sw } from './sw';

export type Lang = 'en' | 'sw';

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

const Ctx = createContext<LanguageCtx | null>(null);

/**
 * In-memory language provider. ROLE.txt: no localStorage/sessionStorage.
 * Language resets to EN on refresh - expected for a marketing page.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('en');

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
  };

  const t = lang === 'en' ? en : sw;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
};

export const useLanguage = (): LanguageCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
