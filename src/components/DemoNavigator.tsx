import React from 'react';
import { useApp } from '../context/AppContext';
import { Surface, RequesterScreen, ConsoleRole } from '../types';
import { 
  X, 
  RotateCcw, 
  Smartphone, 
  HeartHandshake, 
  ShieldCheck, 
  ScanLine, 
  Workflow, 
  CheckCircle,
  AlertTriangle,
  Lock,
  ExternalLink
} from 'lucide-react';

export const DemoNavigator: React.FC = () => {
  const { 
    demoDrawerOpen, 
    setDemoDrawerOpen, 
    surface, 
    setSurface, 
    requesterScreen, 
    setRequesterScreen, 
    setRequesterChannel,
    consoleRole, 
    setConsoleRole,
    resetToDefaults,
    setIsPhoneFramed,
    setActiveRequestId
  } = useApp();

  if (!demoDrawerOpen) return null;

  const navigateTo = (
    targetSurface: Surface, 
    targetRequesterScreen?: RequesterScreen, 
    targetRole?: ConsoleRole,
    reqChannel?: 'web' | 'ussd' | 'sms' | 'sms'
  ) => {
    setSurface(targetSurface);
    if (targetRequesterScreen) {
      setRequesterScreen(targetRequesterScreen);
    }
    if (targetRole) {
      setConsoleRole(targetRole);
    }
    if (reqChannel) {
      setRequesterChannel(reqChannel);
    }
    if (targetSurface === 'requester') {
      setIsPhoneFramed(true);
    }
    setDemoDrawerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#FAF8F4] h-full shadow-2xl flex flex-col border-l border-[#111111]/15 overflow-hidden"
        role="dialog"
        aria-label="Interactive Demo Navigator"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#111111]/10 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-[#111111]">Demo Screen Navigator</h2>
              <span className="text-[10px] font-mono bg-[#DCE8E0] text-[#1F6B4A] px-2 py-0.5 rounded">R.U.T.H</span>
            </div>
            <p className="text-xs text-[#111111]/60 mt-0.5">Jump directly to any surface, state, or operational role</p>
          </div>
          <button
            onClick={() => setDemoDrawerOpen(false)}
            className="p-2 text-[#111111]/60 hover:text-[#111111] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close navigator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Links */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-sm">
          
          {/* Surface A: Requester App */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#1F6B4A] uppercase mb-2">
              <Smartphone className="w-4 h-4" />
              <span>A. Requester App (Nairobi Network)</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pl-2 border-l-2 border-[#1F6B4A]/20">
              <button
                onClick={() => navigateTo('requester', 'welcome')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'welcome' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>1. Welcome & Privacy Note</span>
                <span className="text-[10px] opacity-70">Anonymous start</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'channel')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'channel' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>2. Channel Chooser</span>
                <span className="text-[10px] opacity-70">Web, SMS, USSD</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'channel', undefined, 'sms')}
                className="text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between hover:bg-white text-[#111111]/80"
              >
                <span className="font-mono text-[#075E54] font-semibold">â†³ SMS Bot Simulator</span>
                <span className="text-[10px] font-mono bg-[#075E54] text-white px-1.5 py-0.5 rounded">SMS Chat</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'channel', undefined, 'ussd')}
                className="text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between hover:bg-white text-[#111111]/80"
              >
                <span className="font-mono text-[#1F6B4A]">â†³ USSD Simulator ([Placeholder USSD code])</span>
                <span className="text-[10px] font-mono bg-[#DCE8E0] px-1.5 py-0.5 rounded">Feature Phone</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'channel', undefined, 'sms')}
                className="text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between hover:bg-white text-[#111111]/80"
              >
                <span className="font-mono text-[#1F6B4A]">â†³ SMS Simulator (Shortcode)</span>
                <span className="text-[10px] font-mono bg-[#DCE8E0] px-1.5 py-0.5 rounded">Offline Thread</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'verification')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'verification' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>3. Phone & Private Token Creation</span>
                <span className="text-[10px] opacity-70">One-way hash</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'home')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'home' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>4. Home: The Swap & The Pool Tiles</span>
                <span className="text-[10px] opacity-70">Dignified portal</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'swap')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'swap' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>5. The Swap: Smart Locker Bundles</span>
                <span className="text-[10px] opacity-70">Pantry / Hygiene</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'pool')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'pool' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>6. The Pool: Direct Bills & School Fees</span>
                <span className="text-[10px] opacity-70">3-check verification</span>
              </button>

              <button
                onClick={() => {
                  setActiveRequestId('REQ-POOL-9812');
                  navigateTo('requester', 'detail');
                }}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'detail' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>7. Request Detail & Status Timeline</span>
                <span className="text-[10px] opacity-70">Submitted/Verified/Done</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'data_rights')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'data_rights' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span className="font-semibold text-[#1F6B4A]">8. Your Data and Your Rights</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">KDPA Review</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'duplicate_demo')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'duplicate_demo' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-rose-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  Duplicate Bill Settled State
                </span>
                <span className="text-[10px] font-mono text-rose-700">Zero info reveal</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'messaging_unavailable_demo')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'messaging_unavailable_demo' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-amber-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Messaging Unavailable State
                </span>
                <span className="text-[10px] font-mono text-amber-700">SMS retry</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'rate_limit_demo')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'rate_limit_demo' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-amber-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-700" />
                  Rate-Limit Reached State
                </span>
                <span className="text-[10px] font-mono text-amber-700">Dignified quota</span>
              </button>

              <button
                onClick={() => navigateTo('requester', 'error_demo')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'requester' && requesterScreen === 'error_demo' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-rose-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  Institutional Verification Error State
                </span>
                <span className="text-[10px] font-mono text-rose-700">Fallback check</span>
              </button>
            </div>
          </div>

          {/* Surface B: Donor Pool */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#1F6B4A] uppercase mb-2">
              <HeartHandshake className="w-4 h-4" />
              <span>B. Donor Pool (Blind Aggregate Giving)</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pl-2 border-l-2 border-[#1F6B4A]/20">
              <button
                onClick={() => navigateTo('donor')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'donor' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>1. Give (Simulated M-Pesa & Anonymity)</span>
                <span className="text-[10px] opacity-70">100% pooled</span>
              </button>

              <button
                onClick={() => navigateTo('donor')}
                className="text-left px-3 py-2 rounded text-xs hover:bg-white text-[#111111]/80 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>2. Cohort Campaign (200 Students)</span>
                <span className="text-[10px] opacity-70">No individual names</span>
              </button>

              <button
                onClick={() => navigateTo('donor')}
                className="text-left px-3 py-2 rounded text-xs hover:bg-white text-[#111111]/80 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>3. Aggregate Impact (Sample Data)</span>
                <span className="text-[10px] opacity-70">No recipient links</span>
              </button>
            </div>
          </div>

          {/* Surface C: Operations Console */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#1F6B4A] uppercase mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>C. Operations Console (Role Segregation)</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pl-2 border-l-2 border-[#1F6B4A]/20">
              <button
                onClick={() => navigateTo('console', undefined, 'fulfilment')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'console' && consoleRole === 'fulfilment' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>1. Fulfilment Queue (Hashed obj #...)</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Fulfilment</span>
              </button>

              <button
                onClick={() => navigateTo('console', undefined, 'audit')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'console' && consoleRole === 'audit' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>2. Verification Tiers & Audit Log</span>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Audit Role</span>
              </button>

              <button
                onClick={() => navigateTo('console', undefined, 'enrolment')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'console' && consoleRole === 'enrolment' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>3. Enrolment Role (Intake Health Only)</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Enrolment</span>
              </button>

              <button
                onClick={() => navigateTo('console', undefined, 'fulfilment')}
                className="text-left px-3 py-2 rounded text-xs hover:bg-white text-[#111111]/80 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>4. Supply & Depot Pipeline</span>
                <span className="text-[10px] font-mono bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded">4 Stages</span>
              </button>
            </div>
          </div>

          {/* Surface D & E */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#1F6B4A] uppercase mb-2">
              <ScanLine className="w-4 h-4" />
              <span>D & E. Partner Till & Architecture</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pl-2 border-l-2 border-[#1F6B4A]/20">
              <button
                onClick={() => navigateTo('partner')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'partner' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>D. Partner Till: PIN & QR Scanner</span>
                <span className="text-[10px] opacity-70">Zero requester data</span>
              </button>

              <button
                onClick={() => navigateTo('partner')}
                className="text-left px-3 py-2 rounded text-xs hover:bg-white text-[#111111]/80 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>D2. Partner Monthly Statement</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Reconciliation</span>
              </button>

              <button
                onClick={() => navigateTo('architecture')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'architecture' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span>E. Architecture & 9 Assumptions</span>
                <span className="text-[10px] opacity-70">WFP Building Blocks</span>
              </button>

              <button
                onClick={() => navigateTo('phase2')}
                className={`text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  surface === 'phase2' ? 'bg-[#1F6B4A] text-white font-medium' : 'hover:bg-white text-[#111111]/80'
                }`}
              >
                <span className="font-semibold text-[#1F6B4A]">âœ¨ Phase 2 Features Hub</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">5 Modules</span>
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-white border-t border-[#111111]/10 flex items-center justify-between">
          <button
            onClick={() => {
              resetToDefaults();
              setDemoDrawerOpen(false);
            }}
            className="flex items-center gap-1.5 text-xs text-[#111111]/70 hover:text-[#111111] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
          <span className="text-[11px] text-[#111111]/50">LumiereCore CLG Â· Nairobi</span>
        </div>
      </div>
    </div>
  );
};


