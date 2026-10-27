import React from 'react';
import { useApp } from '../../context/AppContext';
import { Surface, RequesterChannel } from '../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Switch } from '../../ui/Switch';
import { 
  X, 
  RotateCcw, 
  Smartphone, 
  HeartHandshake, 
  ScanLine, 
  ShieldCheck, 
  BookOpen, 
  Sparkles,
  ExternalLink,
  Globe
} from 'lucide-react';

export const DemoDrawer: React.FC = () => {
  const { 
    demoDrawerOpen, 
    setDemoDrawerOpen, 
    surface, 
    setSurface,
    setRequesterScreen,
    setRequesterChannel,
    resetToDefaults,
    isLoadingRequests,
    setIsLoadingRequests,
    emptyRequestsMode,
    setEmptyRequestsMode,
    isPhoneFramed,
    setIsPhoneFramed,
    language,
    setLanguage
  } = useApp();

  if (!demoDrawerOpen) return null;

  const navigateTo = (target: Surface, screen?: any, channel?: RequesterChannel) => {
    setSurface(target);
    if (screen) setRequesterScreen(screen);
    if (channel) setRequesterChannel(channel);
    setDemoDrawerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0"
        onClick={() => setDemoDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className="relative w-full max-w-sm bg-[#FAF8F4] h-full shadow-2xl flex flex-col border-l border-[#111111]/15 z-10 overflow-hidden"
        role="dialog"
        aria-label="Demo Navigator & Controls"
      >
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#111111]/10 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[#111111]">Demo Controls</h3>
            <span className="text-[10px] font-mono text-[#111111]/50">Project R.U.T.H · Prototype</span>
          </div>
          <button
            onClick={() => setDemoDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
            aria-label="Close demo drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          
          {/* Shell Switcher */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold text-[#111111]/60 tracking-wider block">
              1. Switch Shell Interface
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <Button
                variant={surface === 'requester' ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => navigateTo('requester', 'home')}
                icon={<Smartphone className="w-4 h-4" />}
              >
                Requester Shell (Consumer Mobile)
              </Button>

              <Button
                variant={surface === 'donor' ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => navigateTo('donor')}
                icon={<HeartHandshake className="w-4 h-4" />}
              >
                Donor Shell (Give &amp; Impact)
              </Button>

              <Button
                variant={surface === 'console' ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => navigateTo('console')}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Console Shell (Operations Sidebar)
              </Button>

              <Button
                variant={surface === 'partner' ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => navigateTo('partner')}
                icon={<ScanLine className="w-4 h-4" />}
              >
                Partner Till Shell (Terminal POS)
              </Button>

              <Button
                variant={surface === 'architecture' ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => navigateTo('architecture')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                Docs Shell (9 Assumptions)
              </Button>

              <Button
                variant={surface === 'phase2' ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => navigateTo('phase2')}
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
              >
                Phase 2 Features Hub (5 Modules)
              </Button>
            </div>
          </div>

          {/* Requester Channels (SMS, USSD, Web) */}
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase font-bold text-[#111111]/60 tracking-wider block">
              2. Launch Mobile Channel
            </span>
            <div className="grid grid-cols-1 gap-2 font-mono text-sm">
              <button
                onClick={() => navigateTo('requester', 'channel', 'sms')}
                className="min-h-[44px] p-2.5 rounded-xl bg-white border border-[#111111]/15 hover:border-[#1F6B4A] text-left cursor-pointer flex items-center gap-2"
              >
                <span>✉️</span>
                <span>SMS Gateway</span>
              </button>
              <button
                onClick={() => navigateTo('requester', 'channel', 'ussd')}
                className="min-h-[44px] p-2.5 rounded-xl bg-white border border-[#111111]/15 hover:border-[#1F6B4A] text-left cursor-pointer flex items-center gap-2"
              >
                <span>📞</span>
                <span>USSD Session</span>
              </button>
              <button
                onClick={() => navigateTo('requester', 'verification')}
                className="min-h-[44px] p-2.5 rounded-xl bg-white border border-[#111111]/15 hover:border-[#1F6B4A] text-left cursor-pointer flex items-center gap-2"
              >
                <span>🔑</span>
                <span>Web Token Gateway</span>
              </button>
            </div>
          </div>

          {/* Test Toggles */}
          <div className="space-y-3 p-3 bg-white rounded-xl border border-[#111111]/12">
            <span className="font-mono text-[10px] uppercase font-bold text-[#111111]/60 tracking-wider block">
              3. Demo State Toggles
            </span>
            
            <div className="flex items-center justify-between">
              <span className="text-xs">Skeleton Loading</span>
              <Switch checked={isLoadingRequests} onChange={setIsLoadingRequests} id="skeleton-toggle" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs">Empty Requests List</span>
              <Switch checked={emptyRequestsMode} onChange={setEmptyRequestsMode} id="empty-toggle" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs">390px Phone Frame</span>
              <Switch checked={isPhoneFramed} onChange={setIsPhoneFramed} id="frame-toggle" />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#111111]/10">
              <span className="text-xs">Language (EN / SW)</span>
              <button
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className="px-2 py-1 rounded bg-[#FAF8F4] border border-[#111111]/15 font-mono text-[11px] font-bold cursor-pointer"
              >
                {language.toUpperCase()}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Reset */}
        <div className="p-4 bg-white border-t border-[#111111]/10 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetToDefaults();
              setDemoDrawerOpen(false);
            }}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset State
          </Button>
          <span className="text-[10px] font-mono text-[#111111]/50">LumiereCore CLG</span>
        </div>

      </div>

    </div>
  );
};
