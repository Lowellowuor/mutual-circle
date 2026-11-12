import React, { createContext, useContext } from 'react';
import { en, type Strings } from './en';

interface LanguageCtx {
  t: Strings;
}

const Ctx = createContext<LanguageCtx | null>(null);

/**
 * English-only language provider. Kept as a provider (rather than direct
 * imports of `en`) so a future second language can be reintroduced here
 * without touching any consumer component.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Ctx.Provider value={{ t: en }}>{children}</Ctx.Provider>;
};

export const useLanguage = (): LanguageCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
