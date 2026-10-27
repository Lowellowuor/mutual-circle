import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Package, ReceiptText, Lock, ArrowRight, Smartphone } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { setRequesterScreen, t } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Network Header */}
      <div className="space-y-2 text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE8E0] text-[#1F6B4A] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LumiereCore CLG · Nairobi Network</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight leading-tight">
          {t('welcome_title')}
        </h1>
        <p className="text-sm sm:text-base text-[#111111]/70 max-w-md mx-auto leading-relaxed">
          {t('welcome_desc')}
        </p>
      </div>

      {/* Two Pillars Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="p-4 rounded-xl bg-white border border-[#111111]/10 space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-[#DCE8E0] flex items-center justify-center text-[#1F6B4A]">
            <Package className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-base font-bold text-[#111111]">The Swap</h2>
          <p className="text-xs text-[#111111]/70 leading-relaxed">
            Standardised food and hygiene bundles reserved in automated smart lockers across Nairobi.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#111111]/10 space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-[#DCE8E0] flex items-center justify-center text-[#1F6B4A]">
            <ReceiptText className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-base font-bold text-[#111111]">The Pool</h2>
          <p className="text-xs text-[#111111]/70 leading-relaxed">
            Direct institutional payments for KPLC electricity tokens, water, and school tuition fees.
          </p>
        </div>
      </div>

      {/* Mandatory Plain-Language Privacy Note */}
      <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6B4A]">
          <Lock className="w-4 h-4" />
          <span>{t('privacy_title')}</span>
        </div>
        <p className="text-xs text-[#111111]/80 leading-relaxed">
          {t('privacy_body')}
        </p>
        <div className="pt-1 text-[11px] text-[#111111]/60 font-mono">
          Strict policy: Zero clinical questions · Zero names · Zero residential addresses.
        </div>
        <div className="pt-1">
          <button
            onClick={() => setRequesterScreen('data_rights')}
            className="text-xs text-[#1F6B4A] hover:text-[#18553a] underline font-medium cursor-pointer inline-flex items-center gap-1"
          >
            <span>Learn more in &quot;Your data and your rights&quot; →</span>
          </button>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          onClick={() => setRequesterScreen('channel')}
          className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer group"
        >
          <span>{t('get_started')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Low-bandwidth channel signpost */}
      <div className="text-center pt-1">
        <button 
          onClick={() => setRequesterScreen('channel')}
          className="text-xs text-[#111111]/70 hover:text-[#1F6B4A] underline cursor-pointer inline-flex items-center gap-1"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Works on all basic phones via SMS and USSD ([Placeholder USSD code])</span>
        </button>
      </div>

    </div>
  );
};
