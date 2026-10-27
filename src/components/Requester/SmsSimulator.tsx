import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Send, Smartphone, ShieldCheck } from 'lucide-react';

interface SmsMessage {
  id: string;
  sender: 'inbound' | 'outbound';
  text: string;
  time: string;
}

export const SmsSimulator: React.FC = () => {
  const { requests, addSwapRequest, bundles } = useApp();
  const [messages, setMessages] = useState<SmsMessage[]>([
    {
      id: 'sms-1',
      sender: 'inbound',
      text: 'The Mutual Circle: Resource-sharing network for Nairobi. You are anonymous from everyone in the chain. Text SWAP to reserve locker bundles, POOL for utility bills, or STATUS to view active requests.',
      time: '08:00 AM'
    },
    {
      id: 'sms-2',
      sender: 'outbound',
      text: 'SWAP',
      time: '08:14 AM'
    },
    {
      id: 'sms-3',
      sender: 'inbound',
      text: 'The Mutual Circle: Request REQ-SWAP-4102 confirmed. Pantry Basics ready at Westlands Locker Hub. Single-use PIN: 8341. Collect at your convenience. No countdown timer.',
      time: '08:15 AM'
    }
  ]);

  const [inputSms, setInputSms] = useState<string>('');

  const sendSms = (textToSend?: string) => {
    const text = (textToSend || inputSms).trim();
    if (!text) return;

    const outMsg: SmsMessage = {
      id: `msg-${Date.now()}`,
      sender: 'outbound',
      text: text,
      time: 'Just now'
    };

    setMessages(prev => [...prev, outMsg]);
    setInputSms('');

    // Simulate network automated reply
    setTimeout(() => {
      let replyText = '';
      const upper = text.toUpperCase();
      if (upper.includes('SWAP')) {
        const bundle = bundles[0];
        const req = addSwapRequest(bundle);
        replyText = `The Mutual Circle: Reserved ${bundle.name}. Box allocated at ${bundle.lockerLocation}. PIN: ${req.pinCode || '6192'}. Collect at your convenience.`;
      } else if (upper.includes('POOL') || upper.includes('BILL')) {
        replyText = 'The Mutual Circle: Reply with your institutional bill type and meter/invoice number (e.g. KPLC 84210091823 or ADM 9024). Direct institution payment only.';
      } else if (upper.includes('STATUS')) {
        const top = requests[0];
        replyText = `The Mutual Circle: Active request ${top?.id || 'REQ-SWAP-4102'} is ${top?.status.toUpperCase() || 'FULFILLED'}. Category: ${top?.categoryTitle || 'Pantry Basics'}.`;
      } else if (upper.includes('PRIVACY')) {
        replyText = 'The Mutual Circle Privacy: Zero names or clinical details stored. Cryptographic one-way token created. Staff and donors see no identity data.';
      } else {
        replyText = 'The Mutual Circle: Automated command received. Text SWAP for smart lockers, POOL for direct utility payments, or STATUS for active requests.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'inbound',
          text: replyText,
          time: 'Just now'
        }
      ]);
    }, 600);
  };

  return (
    <div className="bg-[#1A1A1A] text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-white/10 max-w-sm mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1F6B4A] flex items-center justify-center text-white text-[10px] font-bold">
            SMS
          </div>
          <div>
            <div className="font-semibold text-white">[Placeholder SMS shortcode]</div>
            <div className="text-[10px] text-white/60">The Mutual Circle Gateway</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#DCE8E0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1F6B4A]" />
          <span>One-Way Token</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="my-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'outbound' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                msg.sender === 'outbound'
                  ? 'bg-[#1F6B4A] text-white rounded-br-xs'
                  : 'bg-[#2E2E2E] text-white/90 rounded-bl-xs border border-white/5'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-white/40 mt-0.5 px-1 font-mono">
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Fast Command Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-white/10">
        {['SWAP', 'POOL', 'STATUS', 'PRIVACY'].map(cmd => (
          <button
            key={cmd}
            onClick={() => sendSms(cmd)}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white/80 shrink-0 cursor-pointer transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Send Input */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={inputSms}
          onChange={e => setInputSms(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendSms()}
          placeholder="Text SWAP, POOL, or STATUS..."
          className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#1F6B4A]"
        />
        <button
          onClick={() => sendSms()}
          className="p-2 rounded-lg bg-[#1F6B4A] hover:bg-[#18553a] text-white cursor-pointer transition-colors"
          aria-label="Send SMS"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-[10px] text-center text-white/40 pt-2 font-mono">
        SMS delivered via telecom blind shortcode routing
      </div>

    </div>
  );
};
