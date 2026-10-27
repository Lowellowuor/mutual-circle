import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { SwapFlow } from '../features/swap/SwapFlow';
import { PoolFlow } from '../features/pool/PoolFlow';
import { RequestsTab } from '../features/requests/RequestsTab';
import { PrivacyTab } from '../features/privacy/PrivacyTab';
import { FirstLaunchIntro } from '../features/intro/FirstLaunchIntro';
import { ChannelChooser } from '../components/Requester/ChannelChooser';
import { WelcomeScreen } from '../components/Requester/WelcomeScreen';
import { PhoneVerification } from '../components/Requester/PhoneVerification';
import { DataRightsScreen } from '../components/Requester/DataRightsScreen';
import { RequestDetailModal } from '../components/Requester/RequestDetailModal';
import { RateLimitDemo, ErrorDemo } from '../components/Requester/StateSimulators';
import { 
  Home, 
  Clock, 
  Shield, 
  Package, 
  ReceiptText, 
  PhoneCall, 
  MessageSquare,
  Globe,
  Plus,
  Info 
} from 'lucide-react';

export const RequesterShell: React.FC = () => {
  const { 
    requesterScreen, 
    setRequesterScreen, 
    setRequesterChannel, 
    t 
  } = useApp();

  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'requests' | 'privacy'>('home');
  const [showIntro, setShowIntro] = useState<boolean>(false);
  const [networkInfoOpen, setNetworkInfoOpen] = useState<boolean>(false);
  const [fabSheetOpen, setFabSheetOpen] = useState<boolean>(false);

  // If sub-flow or sub-screen active: render that view inside shell
  if (requesterScreen === 'swap') {
    return <SwapFlow />;
  }
  if (requesterScreen === 'pool') {
    return <PoolFlow />;
  }
  if (requesterScreen === 'channel') {
    return <ChannelChooser />;
  }
  if (requesterScreen === 'verification') {
    return <PhoneVerification />;
  }
  if (requesterScreen === 'welcome') {
    return <WelcomeScreen />;
  }
  if (requesterScreen === 'data_rights') {
    return <DataRightsScreen />;
  }
  if (requesterScreen === 'detail') {
    return <RequestDetailModal />;
  }
  if (requesterScreen === 'rate_limit_demo') {
    return <RateLimitDemo />;
  }
  if (requesterScreen === 'error_demo') {
    return <ErrorDemo />;
  }

  return (
    <div className="flex flex-col min-h-[640px] w-full max-w-md mx-auto pb-24 relative select-none animate-in fade-in">
      
      {/* 3-Card First Launch Story Intro Modal */}
      {showIntro && (
        <FirstLaunchIntro onComplete={() => setShowIntro(false)} />
      )}

      {/* Top Header Bar: 56px */}
      <div className="h-14 flex items-center justify-between border-b border-[#111111]/10 px-1">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-[28px] font-bold text-[#111111]">
            {activeBottomTab === 'home' ? t('home_title') : activeBottomTab === 'requests' ? t('requests_title') : t('privacy_title')}
          </h1>
          <span className="text-sm font-mono text-[#1F6B4A] bg-[#DCE8E0] px-2 py-0.5 rounded-full font-medium">
            {t('simulated_badge')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowIntro(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer font-medium text-sm"
            title="3-Card Intro"
          >
            Intro
          </button>
          <button
            onClick={() => setNetworkInfoOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
            aria-label="Network information"
          >
            <Info className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Main Tab View Rendering (Tab change cross-fades 150ms) */}
      <div className="pt-3 flex-1 transition-opacity duration-150">
        
        {/* TAB 1: HOME */}
        {activeBottomTab === 'home' && (
          <div className="space-y-4">
            
            {/* Quick Channels Bar (SMS removed, SMS, USSD, Web only) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setRequesterChannel('sms');
                  setRequesterScreen('channel');
                }}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#111111]/10 text-sm font-medium text-[#111111] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <MessageSquare className="w-4 h-4 text-[#1F6B4A]" strokeWidth={1.75} />
                <span>{t('channel_sms')}</span>
              </button>

              <button
                onClick={() => {
                  setRequesterChannel('ussd');
                  setRequesterScreen('channel');
                }}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#111111]/10 text-sm font-medium text-[#111111] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <PhoneCall className="w-4 h-4 text-[#1F6B4A]" strokeWidth={1.75} />
                <span>{t('channel_ussd')}</span>
              </button>

              <button
                onClick={() => {
                  setRequesterChannel('web');
                  setRequesterScreen('channel');
                }}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#111111]/10 text-sm font-medium text-[#111111] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <Globe className="w-4 h-4 text-[#1F6B4A]" strokeWidth={1.75} />
                <span>{t('channel_web')}</span>
              </button>
            </div>

            {/* Two Primary Cards: Reserve & Pay */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              
              {/* Tile 1: Reserve */}
              <Card
                variant="interactive"
                onClick={() => setRequesterScreen('swap')}
                className="p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="font-serif text-[20px] font-bold text-[#111111]">
                      {t('swap_title')}
                    </h2>
                  </div>
                </div>
                <div className="font-mono text-base font-bold text-[#1F6B4A]">
                  14
                </div>
              </Card>

              {/* Tile 2: Pay */}
              <Card
                variant="interactive"
                onClick={() => setRequesterScreen('pool')}
                className="p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <ReceiptText className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="font-serif text-[20px] font-bold text-[#111111]">
                      {t('pool_title')}
                    </h2>
                  </div>
                </div>
                <div className="font-mono text-base font-bold text-[#1F6B4A]">
                  2
                </div>
              </Card>

            </div>

          </div>
        )}

        {/* TAB 2: REQUESTS */}
        {activeBottomTab === 'requests' && (
          <RequestsTab />
        )}

        {/* TAB 3: PRIVACY */}
        {activeBottomTab === 'privacy' && (
          <PrivacyTab />
        )}

      </div>

      {/* Floating Action Button (FAB) on Requester Home (bottom right, above tabs) */}
      {activeBottomTab === 'home' && (
        <button
          onClick={() => setFabSheetOpen(true)}
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#1F6B4A] text-white shadow-lg flex items-center justify-center hover:bg-[#18553A] active:scale-95 transition-all z-40 cursor-pointer"
          aria-label="New action"
        >
          <Plus className="w-7 h-7" strokeWidth={2} />
        </button>
      )}

      {/* FAB Options Bottom Sheet (Reserve, Pay) */}
      <Sheet
        isOpen={fabSheetOpen}
        onClose={() => setFabSheetOpen(false)}
        title={t('home_title')}
      >
        <div className="space-y-3">
          <button
            onClick={() => {
              setFabSheetOpen(false);
              setRequesterScreen('swap');
            }}
            className="w-full p-4 rounded-2xl bg-[#FAF8F4] border border-[#111111]/10 flex items-center gap-3.5 hover:bg-black/5 active:scale-98 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="text-left font-serif text-[20px] font-bold text-[#111111]">
              {t('swap_title')}
            </div>
          </button>

          <button
            onClick={() => {
              setFabSheetOpen(false);
              setRequesterScreen('pool');
            }}
            className="w-full p-4 rounded-2xl bg-[#FAF8F4] border border-[#111111]/10 flex items-center gap-3.5 hover:bg-black/5 active:scale-98 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
              <ReceiptText className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="text-left font-serif text-[20px] font-bold text-[#111111]">
              {t('pool_title')}
            </div>
          </button>
        </div>
      </Sheet>

      {/* Consumer Mobile Bottom Tab Bar: 64px, 3 tabs, active indicator pill */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#111111]/10 max-w-md mx-auto h-16 flex items-center justify-around z-30 shadow-lg px-2"
        aria-label="Requester Bottom Navigation"
      >
        <button
          onClick={() => setActiveBottomTab('home')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeBottomTab === 'home' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/60 hover:text-[#111111]'
          }`}
          aria-label={t('tab_home')}
        >
          {activeBottomTab === 'home' && (
            <span className="absolute -top-1 w-8 h-1 bg-[#1F6B4A] rounded-full" />
          )}
          <Home 
            className="w-6 h-6" 
            strokeWidth={1.75} 
            fill={activeBottomTab === 'home' ? '#1F6B4A' : 'none'} 
          />
          <span className="text-sm mt-0.5">{t('tab_home')}</span>
        </button>

        <button
          onClick={() => setActiveBottomTab('requests')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeBottomTab === 'requests' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/60 hover:text-[#111111]'
          }`}
          aria-label={t('tab_requests')}
        >
          {activeBottomTab === 'requests' && (
            <span className="absolute -top-1 w-8 h-1 bg-[#1F6B4A] rounded-full" />
          )}
          <Clock 
            className="w-6 h-6" 
            strokeWidth={1.75} 
            fill={activeBottomTab === 'requests' ? '#1F6B4A' : 'none'} 
          />
          <span className="text-sm mt-0.5">{t('tab_requests')}</span>
        </button>

        <button
          onClick={() => setActiveBottomTab('privacy')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeBottomTab === 'privacy' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/60 hover:text-[#111111]'
          }`}
          aria-label={t('tab_privacy')}
        >
          {activeBottomTab === 'privacy' && (
            <span className="absolute -top-1 w-8 h-1 bg-[#1F6B4A] rounded-full" />
          )}
          <Shield 
            className="w-6 h-6" 
            strokeWidth={1.75} 
            fill={activeBottomTab === 'privacy' ? '#1F6B4A' : 'none'} 
          />
          <span className="text-sm mt-0.5">{t('tab_privacy')}</span>
        </button>
      </nav>

      {/* Network Info Bottom Sheet */}
      <Sheet
        isOpen={networkInfoOpen}
        onClose={() => setNetworkInfoOpen(false)}
        title="The Mutual Circle"
        subtitle="LumiereCore CLG Â· Nairobi Network"
      >
        <div className="space-y-3 text-sm leading-relaxed text-[#111111]/80">
          <p>
            A resource-sharing network for Nairobi allowing community members to obtain bundles and settle institutional bills without disclosing need.
          </p>
          <div className="p-3.5 bg-[#FAF8F4] rounded-xl border border-[#111111]/10 font-mono text-sm space-y-1.5">
            <div>â€¢ Non-evaluative language: Request, reserve, collect, share.</div>
            <div>â€¢ Separation of duties: No human role holds contact and payment power.</div>
            <div>â€¢ Direct settlement: Funds disburse directly to institutional ledgers.</div>
          </div>
          <Button fullWidth variant="outline" size="md" onClick={() => setNetworkInfoOpen(false)}>
            {t('btn_close')}
          </Button>
        </div>
      </Sheet>

    </div>
  );
};

