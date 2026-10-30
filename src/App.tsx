import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { RequesterView } from './components/Requester/RequesterView';
import { RequesterMessages } from './components/Requester/Messages';
import { ConsoleView } from './components/Console/ConsoleView';
import { DonorView } from './components/Donor/DonorView';
import { SmsDonorSimulator } from './components/Donor/SmsDonorSimulator';
import { ArchitectureView } from './components/Architecture/ArchitectureView';
import { BenchView } from './components/Bench/BenchView';
import { SmsSimulator } from './components/Requester/SmsSimulator';
import { UssdSimulator } from './components/Requester/UssdSimulator';
import { WhatsAppSimulator } from './components/Requester/WhatsAppSimulator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutDashboard, User, HeartHandshake, Workflow, MessageCircle, Smartphone, PhoneCall, MessageSquare, RotateCcw , Heart , Bell } from 'lucide-react';

type View = 'requester' | 'sms' | 'ussd' | 'whatsapp' | 'console' | 'donor' | 'sms-donor' | 'architecture' | 'bench' | 'messages';

function App() {
  const [currentView, setCurrentView] = useState<View>('requester');

  const navItems = [
    { id: 'requester' as View, label: 'Mutual Circle', icon: User },
    { id: 'messages' as View, label: 'Messages', icon: Bell },
    { id: 'sms' as View, label: 'SMS', icon: Smartphone },
    { id: 'ussd' as View, label: 'USSD', icon: PhoneCall },
    { id: 'whatsapp' as View, label: 'WhatsApp', icon: MessageSquare },
    { id: 'console' as View, label: 'Operations', icon: LayoutDashboard },
    { id: 'donor' as View, label: 'Donor Portal', icon: HeartHandshake },
    { id: 'sms-donor' as View, label: 'SMS Donor', icon: Heart },
    { id: 'architecture' as View, label: 'Architecture', icon: Workflow },
    { id: 'bench' as View, label: 'The Bench', icon: MessageCircle },
  ] as const;

  const handleReset = () => {
    if (!window.confirm('Reset the entire demo? All state (requests, vouchers, audit log, sessions) will be cleared.')) return;
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="min-h-screen bg-[#F6F4EE] pb-12">
          <div className="bg-[#111111] text-white p-3 flex flex-wrap justify-center gap-2 sticky top-0 z-50 shadow-md">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ' + (currentView === item.id ? 'bg-[#1F6B4A] shadow-inner' : 'hover:bg-white/10 text-white/70')}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 ml-2"
              title="Reset demo - clears all state"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {currentView === 'requester' && <RequesterView />}
            {currentView === 'messages' && <RequesterMessages />}
            {currentView === 'sms' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="font-serif text-3xl font-bold text-[#111111]">SMS Channel</h1>
                  <p className="text-sm text-[#111111]/60">Send HELP to begin. STOP to opt out.</p>
                </div>
                <SmsSimulator />
              </div>
            )}
            {currentView === 'ussd' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="font-serif text-3xl font-bold text-[#111111]">USSD Channel</h1>
                  <p className="text-sm text-[#111111]/60">Dial *384*22384#. Session auto-ends after 90 seconds.</p>
                </div>
                <UssdSimulator />
              </div>
            )}
            {currentView === 'whatsapp' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="font-serif text-3xl font-bold text-[#111111]">WhatsApp Channel</h1>
                  <p className="text-sm text-[#111111]/60">Meta-operated. Extra privacy disclosure required.</p>
                </div>
                <WhatsAppSimulator />
              </div>
            )}
            {currentView === 'console' && <ConsoleView />}
            {currentView === 'donor' && <DonorView />}
            {currentView === 'sms-donor' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h1 className="font-serif text-3xl font-bold text-[#111111]">SMS Donor Channel</h1>
                  <p className="text-sm text-[#111111]/60">Type DONOR to begin. STOP to opt out.</p>
                </div>
                <SmsDonorSimulator />
              </div>
            )}
            {currentView === 'architecture' && <ArchitectureView />}
            {currentView === 'bench' && <BenchView />}
          </div>
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;