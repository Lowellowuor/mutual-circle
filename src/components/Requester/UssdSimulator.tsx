import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Delete, CornerDownLeft, RefreshCw } from 'lucide-react';

interface UssdState {
  screenId: 'main' | 'bundles' | 'bundle_confirm' | 'pool_type' | 'pool_meter' | 'pool_confirm' | 'status' | 'privacy';
  title: string;
  body: string[];
  lastAction?: string;
}

export const UssdSimulator: React.FC = () => {
  const { addSwapRequest, bundles, requests } = useApp();
  const [inputVal, setInputVal] = useState<string>('');
  
  const [ussdSession, setUssdSession] = useState<UssdState>({
    screenId: 'main',
    title: 'The Mutual Circle (R.U.T.H)',
    body: [
      '1. Reserve a bundle (The Swap)',
      '2. Pay a bill or fee (The Pool)',
      '3. My requests & status',
      '4. Privacy note'
    ]
  });

  const handleKeypadPress = (val: string) => {
    if (inputVal.length < 16) {
      setInputVal(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setInputVal(prev => prev.slice(0, -1));
  };

  const handleSend = () => {
    const choice = inputVal.trim();
    setInputVal('');

    if (ussdSession.screenId === 'main') {
      if (choice === '1') {
        setUssdSession({
          screenId: 'bundles',
          title: 'The Swap: Select Bundle',
          body: [
            '1. Pantry Basics (Westlands)',
            '2. Hygiene Essentials (Kasarani)',
            '3. Family Staples (Embakasi)',
            '4. Student Study Kit (CBD)',
            '0. Back'
          ]
        });
      } else if (choice === '2') {
        setUssdSession({
          screenId: 'pool_type',
          title: 'The Pool: Select Type',
          body: [
            '1. KPLC Electricity Meter',
            '2. Nairobi Water Account',
            '3. Secondary School Term Fees',
            '4. Hospital Invoice',
            '0. Back'
          ]
        });
      } else if (choice === '3') {
        const topRequests = requests.slice(0, 3).map(r => `${r.categoryTitle}: ${r.status.toUpperCase()} (${r.objectIdMasked})`);
        setUssdSession({
          screenId: 'status',
          title: 'Recent Requests Status',
          body: [
            ...topRequests,
            '0. Main Menu'
          ]
        });
      } else if (choice === '4') {
        setUssdSession({
          screenId: 'privacy',
          title: 'Anonymous Privacy Notice',
          body: [
            'No names, phone numbers or clinical details are visible to staff or donors.',
            'Direct institution payment only.',
            '0. Main Menu'
          ]
        });
      }
    } else if (ussdSession.screenId === 'bundles') {
      if (choice === '0') {
        resetToMain();
      } else if (['1', '2', '3', '4'].includes(choice)) {
        const selected = bundles[parseInt(choice) - 1] || bundles[0];
        const newReq = addSwapRequest(selected);
        setUssdSession({
          screenId: 'bundle_confirm',
          title: 'Bundle Reserved!',
          body: [
            `Reserved: ${selected.name}`,
            `Location: ${selected.lockerLocation}`,
            `Single-Use PIN: ${newReq.pinCode || '8341'}`,
            'Collect at your convenience. No countdown timer.',
            'SMS confirmation sent.',
            '0. Main Menu'
          ]
        });
      }
    } else if (ussdSession.screenId === 'pool_type') {
      if (choice === '0') {
        resetToMain();
      } else if (choice === '1') {
        setUssdSession({
          screenId: 'pool_meter',
          title: 'KPLC Meter Payment',
          body: [
            'Enter 11-digit Meter Number:',
            '(e.g. 84210091823)',
            '0. Cancel'
          ]
        });
      } else {
        setUssdSession({
          screenId: 'pool_confirm',
          title: 'Direct Institution Payment',
          body: [
            'Institutional verification pass.',
            'Funds sent directly to institution.',
            'No cash sent to phone.',
            '0. Main Menu'
          ]
        });
      }
    } else if (ussdSession.screenId === 'pool_meter') {
      if (choice === '0') {
        resetToMain();
      } else {
        setUssdSession({
          screenId: 'pool_confirm',
          title: 'Verification Confirmed',
          body: [
            `Meter ${choice.slice(0, 4)}***${choice.slice(-2)} verified!`,
            'Status: Unpaid balance KES 2,200',
            'Institutional B2B payment batched.',
            'Funds go directly to KPLC.',
            '0. Main Menu'
          ]
        });
      }
    } else {
      resetToMain();
    }
  };

  const resetToMain = () => {
    setUssdSession({
      screenId: 'main',
      title: 'The Mutual Circle (R.U.T.H)',
      body: [
        '1. Reserve a bundle (The Swap)',
        '2. Pay a bill or fee (The Pool)',
        '3. My requests & status',
        '4. Privacy note'
      ]
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].includes(e.key)) {
      handleKeypadPress(e.key);
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Enter') {
      handleSend();
    } else if (e.key === 'Escape') {
      resetToMain();
    }
  };

  return (
    <div 
      className="bg-[#1A1A1A] text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-white/10 max-w-sm mx-auto focus:outline-none focus:ring-2 focus:ring-[#1F6B4A]"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="USSD Feature Phone Simulator. Press physical numbers or Tab to use buttons."
    >
      
      {/* Phone Screen Notch & Signal Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-white/60 pb-3 border-b border-white/10">
        <span>Safaricom 4G</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">USSD: [Placeholder USSD code]</span>
          <span>94%</span>
        </div>
      </div>

      {/* Retro USSD Dialog Box */}
      <div 
        className="my-4 bg-[#F2EDE4] text-[#111111] p-4 rounded-xl border border-black/20 font-mono text-xs leading-relaxed shadow-inner min-h-[160px] flex flex-col justify-between"
        aria-live="polite"
      >
        <div>
          <div className="font-bold border-b border-black/15 pb-1 mb-2 text-center text-[13px] text-[#1F6B4A]">
            {ussdSession.title}
          </div>
          <div className="space-y-1.5">
            {ussdSession.body.map((line, idx) => (
              <p key={idx} className="text-xs text-[#222222]">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Input line on USSD */}
        <div className="pt-3 border-t border-black/15 flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded border border-black/20 flex-1">
            <span className="text-black/40">&gt;</span>
            <span className="font-bold text-sm tracking-widest text-[#111111] min-h-[20px]">
              {inputVal || <span className="text-black/30 text-xs font-normal">Type # option...</span>}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleSend}
              className="px-3 py-2 bg-[#1F6B4A] text-white text-[11px] font-bold rounded-lg hover:bg-[#18553a] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Send USSD input"
            >
              SEND
            </button>
            <button
              onClick={resetToMain}
              className="px-2.5 py-2 bg-black/10 text-black/80 text-[11px] rounded-lg hover:bg-black/20 cursor-pointer min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-black"
              aria-label="Cancel USSD session"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Tactile Phone Keypad */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
            <button
              key={key}
              onClick={() => handleKeypadPress(key)}
              className="h-11 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-base font-mono font-semibold text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
              aria-label={`Keypad ${key}`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={handleBackspace}
            className="flex-1 h-11 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-mono text-white/80 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Delete character"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>Del</span>
          </button>
          <button
            onClick={resetToMain}
            className="flex-1 h-11 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-mono text-white/80 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Restart session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
          <button
            onClick={handleSend}
            className="flex-1 h-11 bg-[#1F6B4A] hover:bg-[#18553a] rounded-xl text-xs font-mono font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Submit input"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>Enter</span>
          </button>
        </div>
      </div>

      <div className="text-[10px] text-center text-white/50 pt-3">
        Keyboard operable: Type 0-9 on keyboard or click keypad buttons
      </div>

    </div>
  );
};

