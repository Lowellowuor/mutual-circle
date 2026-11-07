import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Send, Signal, Wifi, Battery, Lock, Heart } from 'lucide-react';
import {
  createDonation, getDonorProfile, updateDonorProfile,
  getDonorLeaderboard, listMyDonations,
} from '../../lib/apiClient';

type DonorState =
  | 'idle' | 'menu' | 'give_amount' | 'give_confirm' | 'give_success'
  | 'leaderboard_optin' | 'leaderboard_name' | 'leaderboard_saved'
  | 'top_showing' | 'activity_showing' | 'stopped';

interface SmsMessage {
  id: string;
  from: 'user' | 'system';
  text: string;
  timestamp: string;
}

const SHORTCODE = '22384';

export const SmsDonorSimulator: React.FC = () => {
  const { donorHash } = useApp();
  const [state, setState] = useState<DonorState>('idle');
  const [messages, setMessages] = useState<SmsMessage[]>([
    { id: 'sys-0', from: 'system', text: 'Mutual Circle Giving. Reply DONOR to start, STOP to opt out.', timestamp: 'now' },
  ]);
  const [input, setInput] = useState('');
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sysReply = (text: string) => {
    setMessages(prev => [...prev, {
      id: 'sys-' + Date.now() + '-' + Math.random(),
      from: 'system', text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const userSay = (text: string) => {
    setMessages(prev => [...prev, {
      id: 'usr-' + Date.now() + '-' + Math.random(),
      from: 'user', text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const showMainMenu = () => {
    sysReply('Main menu:\n1 - Give cash\n2 - Join leaderboard\n3 - Top contributors\n4 - My activity\nReply a number, or STOP to opt out.');
    setState('menu');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    userSay(text);
    processIncoming(text);
  };

  const processIncoming = async (raw: string) => {
    const t = raw.trim().toUpperCase();

    if (t === 'STOP') { sysReply('You have opted out. Reply START to resume.'); setState('stopped'); return; }
    if (t === 'START' && state === 'stopped') { sysReply('Welcome back. Reply DONOR to begin.'); setState('idle'); return; }
    if (t === 'HELP' && state !== 'idle' && state !== 'stopped') { showMainMenu(); return; }

    switch (state) {
      case 'idle': {
        if (['DONOR', 'HI', 'HELLO', 'START'].includes(t)) {
          sysReply('Welcome to Mutual Circle Giving. You are an anonymous donor.\n\nYour gifts fund a blind pool - never a specific person.');
          showMainMenu();
        } else {
          sysReply('Reply DONOR to start.');
        }
        break;
      }
      case 'menu': {
        if (t === '1') {
          sysReply('How much would you like to give?\n1 - KES 1,000\n2 - KES 2,500\n3 - KES 5,000\nReply 1, 2, or 3.');
          setState('give_amount');
        } else if (t === '2') {
          const profile = await getDonorProfile(donorHash);
          if (profile?.opt_in_ledger) {
            sysReply('Already on the leaderboard as "' + (profile.display_name || 'Anonymous Contributor') + '".\nReply REMOVE to leave, or 0 to go back.');
          } else {
            sysReply('Join the public giving list?\nYour total given and gift count are shown. Never a recipient link.\nReply YES to join, or 0 to go back.');
          }
          setState('leaderboard_optin');
        } else if (t === '3') {
          sysReply('Fetching top contributors...');
          const lb = await getDonorLeaderboard(5);
          const entries = lb?.leaderboard || [];
          if (entries.length === 0) {
            sysReply('No opt-in donors yet.\nReply 0 to go back.');
          } else {
            sysReply('Top 5:\n' + entries.map((x, i) => (i + 1) + '. ' + x.display_name + ' - KES ' + (x.total_pence / 100).toLocaleString()).join('\n') + '\n\nReply 0 to go back.');
          }
          setState('top_showing');
        } else if (t === '4') {
          sysReply('Fetching activity...');
          const mine = await listMyDonations(donorHash);
          const donations = mine?.donations || [];
          if (donations.length === 0) {
            sysReply('No gifts yet.\nReply 1 to make your first gift.\n\nReply 0 to go back.');
          } else {
            const total = donations.reduce((s, d) => s + d.amount_pence, 0);
            sysReply('Your activity:\nTotal: KES ' + (total / 100).toLocaleString() + '\nGifts: ' + donations.length + '\n\nReply 0 to go back.');
          }
          setState('activity_showing');
        } else {
          sysReply('Reply 1, 2, 3, or 4.');
        }
        break;
      }
      case 'give_amount': {
        let amount = 0;
        if (t === '1') amount = 1000;
        else if (t === '2') amount = 2500;
        else if (t === '3') amount = 5000;
        else { sysReply('Reply 1, 2, or 3.'); return; }
        setPendingAmount(amount);
        sysReply('Confirm: KES ' + amount.toLocaleString() + ' to the blind pool?\nReply YES or NO.');
        setState('give_confirm');
        break;
      }
      case 'give_confirm': {
        if (t === 'YES') {
          sysReply('Processing...');
          const r = await createDonation(donorHash, Math.round(pendingAmount * 100), true, false);
          if (r) {
            sysReply('Thank you. KES ' + pendingAmount.toLocaleString() + ' added to the blind pool.\n\nYour gift funds a pooled resource - no recipient linkage.\n\nReply 1 to give again, or 0 to go back.');
            setState('give_success');
          } else {
            sysReply('Could not process. Try again.');
            setState('menu');
          }
        } else if (t === 'NO') {
          sysReply('Cancelled. Reply HELP for menu.');
          setState('idle');
        } else {
          sysReply('Reply YES or NO.');
        }
        break;
      }
      case 'give_success': {
        if (t === '1') {
          sysReply('How much?\n1 - KES 1,000\n2 - KES 2,500\n3 - KES 5,000');
          setState('give_amount');
        } else if (t === '0') {
          showMainMenu();
        } else {
          sysReply('Reply 1 or 0.');
        }
        break;
      }
      case 'leaderboard_optin': {
        if (t === 'YES') {
          sysReply('What name should appear? (max 60 chars)\nReply ANON to appear as Anonymous.');
          setState('leaderboard_name');
        } else if (t === 'REMOVE') {
          await updateDonorProfile(donorHash, '', false);
          sysReply('Removed. Your gifts continue to fund the pool.\n\nReply 0 to go back.');
          setState('leaderboard_saved');
        } else if (t === '0') {
          showMainMenu();
        } else {
          sysReply('Reply YES, REMOVE, or 0.');
        }
        break;
      }
      case 'leaderboard_name': {
        if (t === '0') { showMainMenu(); break; }
        const name = t === 'ANON' ? '' : raw.trim();
        await updateDonorProfile(donorHash, name, true);
        sysReply('Saved as "' + (name || 'Anonymous Contributor') + '".\n\nReply 0 to go back.');
        setState('leaderboard_saved');
        break;
      }
      case 'leaderboard_saved':
      case 'top_showing':
      case 'activity_showing': {
        if (t === '0') showMainMenu();
        else sysReply('Reply 0 to go back.');
        break;
      }
      case 'stopped': {
        sysReply('Reply START to resume.');
        break;
      }
    }
  };

  const quickReplies: Record<DonorState, string[]> = {
    idle: ['DONOR', 'STOP'],
    menu: ['1', '2', '3', '4'],
    give_amount: ['1', '2', '3'],
    give_confirm: ['YES', 'NO'],
    give_success: ['1', '0'],
    leaderboard_optin: ['YES', 'REMOVE', '0'],
    leaderboard_name: ['ANON', '0'],
    leaderboard_saved: ['0'],
    top_showing: ['0'],
    activity_showing: ['0'],
    stopped: ['START'],
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-[340px] max-w-full bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black">
        <div className="bg-white rounded-[2rem] overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#111111] text-white px-4 pt-2 pb-1 flex items-center justify-between text-[10px] font-medium">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-1">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-[#F2F2F7] border-b border-[#111111]/10 px-4 py-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1F6B4A] flex items-center justify-center text-white">
              <Heart className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#111111]">Mutual Circle Giving</div>
              <div className="text-[10px] text-[#111111]/50 font-mono">{SHORTCODE}</div>
            </div>
            <Lock className="w-3 h-3 text-[#111111]/40" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#F9F9F9]">
            {messages.map(m => (
              <div key={m.id} className={'flex ' + (m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[85%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap ' + (m.from === 'user' ? 'bg-[#1F6B4A] text-white rounded-br-sm' : 'bg-white text-[#111111] border border-[#111111]/10 rounded-bl-sm')}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {quickReplies[state].length > 0 && (
            <div className="px-2 py-1.5 bg-white border-t border-[#111111]/10 flex gap-1.5 overflow-x-auto shrink-0">
              {quickReplies[state].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-2.5 py-1 text-[10px] font-mono border border-[#1F6B4A]/30 text-[#1F6B4A] rounded-full whitespace-nowrap hover:bg-[#1F6B4A]/10"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="p-2 bg-white border-t border-[#111111]/10 flex gap-1.5 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Text message"
              className="flex-1 min-w-0 bg-[#F2F2F7] rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F6B4A]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-8 h-8 shrink-0 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};