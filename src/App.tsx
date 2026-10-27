import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { DemoDrawer } from './features/drawer/DemoDrawer';
import { RequesterShell } from './shells/RequesterShell';
import { DonorShell } from './shells/DonorShell';
import { ConsoleShell } from './shells/ConsoleShell';
import { PartnerShell } from './shells/PartnerShell';
import { DocsShell } from './shells/DocsShell';
import { Phase2Hub } from './components/Phase2/Phase2Hub';
import { Wifi, Battery, Signal, Compass } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    surface, 
    isPhoneFramed, 
    setIsPhoneFramed,
    setDemoDrawerOpen 
  } = useApp();

  // Render the structured shell based on active surface
  const renderSurfaceContent = () => {
    switch (surface) {
      case 'requester':
        return <RequesterShell />;
      case 'donor':
        return <DonorShell />;
      case 'console':
        return <ConsoleShell />;
      case 'partner':
        return <PartnerShell />;
      case 'architecture':
        return <DocsShell />;
      case 'phase2':
        return <Phase2Hub />;
      default:
        return <RequesterShell />;
    }
  };

  // Mobile frame wrapper for consumer app surfaces
  const applyPhoneFrame = (surface === 'requester' || surface === 'donor' || surface === 'partner') && isPhoneFramed;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#111111]">
      
      {/* Top Bar Navigation */}
      <Navigation />

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        
        {applyPhoneFrame ? (
          /* Realistic 390px Mobile Phone Frame Container */
          <div className="w-full flex flex-col items-center py-2 animate-in fade-in duration-300">
            
            {/* Phone Shell */}
            <div className="w-full max-w-[390px] bg-white rounded-[40px] shadow-2xl border-[6px] border-[#222222] overflow-hidden flex flex-col min-h-[720px] relative">
              
              {/* Phone Notch & Status Bar */}
              <div className="bg-[#FAF8F4] px-4 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-[#111111]/80 select-none border-b border-[#111111]/5">
                <span className="font-semibold text-[10px]">09:42</span>
                <span className="inline-flex items-center gap-1 font-mono text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  Prototype: simulated data
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Signal className="w-3 h-3 text-[#111111]" />
                  <Wifi className="w-3 h-3 text-[#111111]" />
                  <Battery className="w-3.5 h-3.5 text-[#111111]" />
                </div>
              </div>

              {/* Scrollable Phone App Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#FAF8F4]">
                {renderSurfaceContent()}
              </div>

              {/* Phone Home Bar Indicator */}
              <div className="bg-[#FAF8F4] py-2 flex justify-center border-t border-[#111111]/5">
                <div className="w-32 h-1 bg-[#111111]/25 rounded-full" />
              </div>

            </div>

            {/* Frame switcher helper */}
            <div className="mt-3 flex items-center gap-2 text-xs text-[#111111]/60">
              <span>Mobile frame active (390px)</span>
              <span>·</span>
              <button 
                onClick={() => setIsPhoneFramed(false)}
                className="underline hover:text-[#111111] cursor-pointer"
              >
                Expand to desktop width
              </button>
            </div>

          </div>
        ) : (
          /* Desktop / Wide Frame */
          <div className="w-full max-w-5xl py-2">
            {renderSurfaceContent()}
          </div>
        )}

      </main>

      {/* Persistent Bottom Bar with Mandatory "Prototype: simulated data" badge */}
      <footer className="bg-white/95 backdrop-blur-xs border-t border-[#111111]/10 px-4 py-3 text-sm text-[#111111]/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {/* Non-negotiable: Persistent small Prototype badge on every screen */}
            <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-amber-100/90 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Prototype: simulated data
            </span>
            <span className="text-sm text-[#111111]/60 hidden sm:inline">
              &bull; Project R.U.T.H by LumiereCore CLG (Nairobi, Kenya)
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setDemoDrawerOpen(true)}
              className="min-h-[44px] text-[#1F6B4A] hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4" strokeWidth={1.75} />
              <span>Explore All Shells &amp; Controls in Demo Drawer</span>
            </button>
            <span className="text-[#111111]/30">|</span>
            <span className="text-[#111111]/60">Dignified mutual resource-sharing network</span>
          </div>

        </div>
      </footer>

      {/* Demo Drawer Modal */}
      <DemoDrawer />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
