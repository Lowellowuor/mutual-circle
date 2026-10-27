import React from 'react';
import { useApp } from '../context/AppContext';
import { Surface } from '../types';
import { Compass, Smartphone, Monitor, Globe } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { 
    surface, 
    setSurface, 
    language, 
    setLanguage, 
    isPhoneFramed, 
    setIsPhoneFramed,
    demoDrawerOpen, 
    setDemoDrawerOpen 
  } = useApp();

  const navItems: { id: Surface; label: string }[] = [
    { id: 'requester', label: 'Requester' },
    { id: 'donor', label: 'Donor' },
    { id: 'console', label: 'Console' },
    { id: 'partner', label: 'Partner' },
    { id: 'architecture', label: 'Docs' },
    { id: 'phase2', label: 'Phase 2' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#111111]/10 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => { setSurface('requester'); }}
            className="text-left group cursor-pointer focus-visible:outline-none"
            aria-label="The Mutual Circle Home"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#111111] group-hover:text-[#1F6B4A] transition-colors whitespace-nowrap">
              The Mutual Circle
            </span>
          </button>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#1F6B4A] bg-[#DCE8E0]/70 px-2 py-0.5 rounded border border-[#1F6B4A]/20 hidden sm:inline-block">
            Simulated Prototype
          </span>
        </div>

        {/* Zone 2: 4-5 single-line clean navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#111111]/70" aria-label="Main Navigation">
          {navItems.map(item => {
            const isActive = surface === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSurface(item.id)}
                className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  isActive 
                    ? 'text-[#1F6B4A] border-[#1F6B4A] font-semibold' 
                    : 'border-transparent hover:text-[#111111] hover:border-[#111111]/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + fast utilities */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language stub */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-[#111111]/80 hover:text-[#111111] bg-white/70 hover:bg-white rounded-xl border border-[#111111]/15 transition-all cursor-pointer"
            title="Toggle English / Kiswahili"
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4 text-[#1F6B4A]" strokeWidth={1.75} />
            <span className="font-semibold text-sm">{language.toUpperCase()}</span>
          </button>

          {/* Viewport frame toggle for requester/donor */}
          {(surface === 'requester' || surface === 'donor') && (
            <button
              onClick={() => setIsPhoneFramed(!isPhoneFramed)}
              className="hidden sm:flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#111111]/80 hover:text-[#111111] bg-white/70 hover:bg-white rounded-xl border border-[#111111]/15 transition-all cursor-pointer"
              title={isPhoneFramed ? "Switch to Wide View" : "Switch to 390px Phone Frame"}
              aria-label="Toggle frame size"
            >
              {isPhoneFramed ? (
                <>
                  <Monitor className="w-4 h-4 text-[#111111]/70" strokeWidth={1.75} />
                  <span>Desktop</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-[#111111]/70" strokeWidth={1.75} />
                  <span>Phone</span>
                </>
              )}
            </button>
          )}

          {/* Primary Action: Demo Drawer */}
          <button
            onClick={() => setDemoDrawerOpen(!demoDrawerOpen)}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F6B4A] hover:bg-[#18553a] rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            aria-label="Open Demo Drawer"
          >
            <Compass className="w-4 h-4" strokeWidth={1.75} />
            <span className="font-semibold">Demo Drawer</span>
          </button>
        </div>

      </div>

      {/* Mobile navigation tab strip for small screens */}
      <div className="lg:hidden flex items-center justify-between overflow-x-auto gap-2 pt-2.5 mt-2 border-t border-[#111111]/10 text-sm">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setSurface(item.id)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-sm whitespace-nowrap shrink-0 cursor-pointer ${
              surface === item.id 
                ? 'bg-[#1F6B4A] text-white font-medium' 
                : 'text-[#111111]/70 hover:bg-black/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
