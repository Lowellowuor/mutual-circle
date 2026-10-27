import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { generateHMAC } from '../../lib/hash';
import { consumeRate, peekRate, MAX_DAILY_REQUESTS } from '../../services/auth';
import { Send, Signal, Wifi, Battery, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

type SmsState = 'idle' | 'menu' | 'swap_bundle' | 'swap_location' | 'swap_done' | 'pool_category' | 'pool_object' | 'pool_amount' | 'pool_confirm' | 'pool_done' | 'bench' | 'rate_limited' | 'opted_out';
interface SmsMessage { id: string; from: 'user' | 'system'; text: string; timestamp: string; }

const PHONE = '+254 700 123 456';
const SHORTCODE = '22384';
const MAX_SESSION_MSGS = MAX_DAILY_REQUESTS;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

export const SmsSimulator: React.FC = () => {
  const { executeSwap, executePool } = useApp();
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [state, setState] = useState<SmsState>('idle');
  const [messages, setMessages] = useState<SmsMessage[]>([{ id: 'sys-0', from: 'system', text: 'Welcome to Mutual Circle. Reply HELP to start, or STOP to opt out.', timestamp: 'now' }]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState<Record<string, string | number>>({});
  const [msgCount, setMsgCount] = useState(0);
  const [showServerView, setShowServerView] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const t = setInterval(() => {
      if (state !== 'idle' && state !== 'opted_out' && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        setMessages(prev => [...prev, { id: 'sys-timeout', from: 'system', text: 'Session expired (5 mins). Reply HELP to start again.', timestamp: new Date().toLocaleTimeString() }]);
        setState('idle');
        setContext({});
      }
    }, 15000);
    return () => clearInterval(t);
  }, [state, lastActivity]);

  const sysReply = (text: string) => setMessages(prev => [...prev, { id: 'sys-' + Date.now() + '-' + Math.random(), from: 'system', text, timestamp: new Date().toLocaleTimeString() }]);
  const userSay = (text: string) => setMessages(prev => [...prev, { id: 'usr-' + Date.now() + '-' + Math.random(), from: 'user', text, timestamp: new Date().toLocaleTimeString() }]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    setLastActivity(Date.now());
    userSay(text);
    setMsgCount(c => c + 1);
    if (msgCount >= MAX_SESSION_MSGS) {
      if (state !== 'rate_limited') sysReply('Rate limit reached (25 messages/day). Try again tomorrow or visit a hub.');
      setState('rate_limited');
      return;
    }
    await processIncoming(text);
  };

  const processIncoming = async (raw: string) => {
    const t = raw.trim().toUpperCase();
    if (t === 'STOP') { sysReply('You have opted out. You will receive no further messages. Reply START to resume.'); setState('opted_out'); return; }
    if (t === 'START' && (state === 'opted_out' || state === 'idle')) { sysReply('Reply HELP for the menu.'); setState('idle'); return; }
    if (t === 'HELP' && state !== 'idle') { setState('menu'); sysReply('Main menu:\n1-Food bundles\n2-Bill payment\n3-Talk to someone\nReply 1, 2, or 3.'); return; }

    switch (state) {
      case 'idle': {
        if (['HELP', 'HI', 'START', 'HELLO'].includes(t)) {
          if (!tokenHash) { const hash = await generateHMAC(PHONE); setTokenHash(hash); }
          sysReply('Main menu:\n1-Food bundles\n2-Bill payment\n3-Talk to someone\nReply 1, 2, or 3.');
          setState('menu');
        } else sysReply('Reply HELP to start.');
        break;
      }
      case 'menu': {
        if (t === '1') { sysReply('Select bundle:\n1-Standard Pantry\n2-Hygiene Kit\nReply 1 or 2.'); setState('swap_bundle'); }
        else if (t === '2') { sysReply('Select bill:\n1-Utility (KPLC/Water)\n2-School fees\n3-Hospital invoice\nReply 1, 2, or 3.'); setState('pool_category'); }
        else if (t === '3') { sysReply('For confidential peer support, call Befrienders Kenya: 0722 178 177 (free).\nFor emergencies: 999.\nReply 0 to return to menu.'); setState('bench'); }
        else sysReply('Invalid. Reply 1, 2, or 3.');
        break;
      }
      case 'bench': {
        if (t === '0') { sysReply('Main menu:\n1-Food bundles\n2-Bill payment\n3-Talk to someone\nReply 1, 2, or 3.'); setState('menu'); }
        else sysReply('Reply 0 to return to menu, or call 0722 178 177 for support.');
        break;
      }
      case 'swap_bundle': {
        if (t === '1' || t === '2') {
          const bundle = t === '1' ? 'Standard Pantry' : 'Hygiene Kit';
          setContext({ ...context, bundle });
          sysReply('Select locker location:\n1-Kibera Hub\n2-Mathare Central\n3-Kawangware Station');
          setState('swap_location');
        } else sysReply('Reply 1 or 2.');
        break;
      }
      case 'swap_location': {
        if (['1', '2', '3'].includes(t)) {
          const locations = ['Kibera Hub', 'Mathare Central', 'Kawangware Station'];
          const location = locations[parseInt(t) - 1];
          const rateCheck = tokenHash ? consumeRate(tokenHash, 0) : { ok: true, state: { count: 0, value: 0, lastReset: '' } };
          if (!rateCheck.ok) { sysReply(rateCheck.reason || 'Daily limit reached.'); return; }
          const result = await executeSwap(context.bundle as string, location, tokenHash || undefined);
          if (result) { sysReply('Reserved!\nBundle: ' + result.bundleCategory + '\nLocker: ' + result.lockerLocation + '\nPIN: ' + result.pin + '\n\nEnter PIN at any locker terminal. Collect anytime.\n\nReply DONE to close.'); setState('swap_done'); }
          else sysReply('System busy. Please try again.');
        } else sysReply('Reply 1, 2, or 3.');
        break;
      }
      case 'swap_done': {
        if (t === 'DONE') { sysReply('Session closed. Thank you.\nReply HELP to start again.'); setState('idle'); setContext({}); }
        else sysReply('Reply DONE to close.');
        break;
      }
      case 'pool_category': {
        if (['1', '2', '3'].includes(t)) {
          const cats: Record<string, 'utility' | 'school_fee' | 'hospital_invoice'> = { '1': 'utility', '2': 'school_fee', '3': 'hospital_invoice' };
          const category = cats[t];
          setContext({ ...context, category });
          const prompt = category === 'utility' ? 'Enter your KPLC / Water meter number:' : category === 'school_fee' ? 'Enter admission number:' : 'Enter hospital invoice number (no clinical details):';
          sysReply(prompt); setState('pool_object');
        } else sysReply('Reply 1, 2, or 3.');
        break;
      }
      case 'pool_object': {
        if (raw.trim().length >= 4) { setContext({ ...context, objectId: raw.trim() }); sysReply('Enter amount in KES (e.g. 3500):'); setState('pool_amount'); }
        else sysReply('Invalid number. Try again (min 4 digits).');
        break;
      }
      case 'pool_amount': {
        const amt = parseFloat(raw.trim());
        if (!isNaN(amt) && amt > 0) { setContext({ ...context, amount: amt }); sysReply('Confirm payment:\nCategory: ' + (context.category as string).replace('_', ' ') + '\nRef: ' + context.objectId + '\nAmount: KES ' + amt.toLocaleString() + '\n\nReply YES or NO.'); setState('pool_confirm'); }
        else sysReply('Invalid amount. Enter a number.');
        break;
      }
      case 'pool_confirm': {
        if (t === 'YES') {
          const rateCheck = tokenHash ? consumeRate(tokenHash, context.amount as number) : { ok: true, state: { count: 0, value: 0, lastReset: '' } };
          if (!rateCheck.ok) { sysReply(rateCheck.reason || 'Daily limit reached.'); return; }
          const result = await executePool(
            context.category as 'utility' | 'school_fee' | 'hospital_invoice',
            context.objectId as string,
            context.amount as number,
            tokenHash || undefined
          );
          if (result) { sysReply('Payment queued.\nRef: ' + result.hashedObjectId + '\nStatus: ' + result.status.replace('_', ' ') + '\nYou will receive confirmation within 2 hours.\n\nReply DONE to close.'); setState('pool_done'); }
          else sysReply('System busy. Please try again.');
        } else if (t === 'NO') { sysReply('Cancelled. Reply HELP to start over.'); setState('idle'); setContext({}); }
        else sysReply('Reply YES or NO.');
        break;
      }
      case 'pool_done': {
        if (t === 'DONE') { sysReply('Session closed. Thank you.\nReply HELP to start again.'); setState('idle'); setContext({}); }
        else sysReply('Reply DONE to close.');
        break;
      }
      case 'rate_limited': sysReply('Rate limit still active. Try again tomorrow.'); break;
      case 'opted_out': {
        if (t === 'START') { sysReply('Welcome back. Reply HELP to start.'); setState('idle'); }
        else sysReply('You are opted out. Reply START to resume.');
        break;
      }
    }
  };

  const quickReplies: Record<SmsState, string[]> = {
    idle: ['HELP', 'STOP'], menu: ['1', '2', '3'], swap_bundle: ['1', '2'], swap_location: ['1', '2', '3'],
    swap_done: ['DONE'], pool_category: ['1', '2', '3'], pool_object: [], pool_amount: [],
    pool_confirm: ['YES', 'NO'], pool_done: ['DONE'], bench: ['0'], rate_limited: [], opted_out: ['START'],
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
      <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
        <div className="bg-white rounded-[2rem] overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#111111] text-white px-4 pt-2 pb-1 flex items-center justify-between text-[10px] font-medium">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-1"><Signal className="w-3 h-3" /><Wifi className="w-3 h-3" /><Battery className="w-3 h-3" /></div>
          </div>
          <div className="bg-[#F2F2F7] border-b border-[#111111]/10 px-4 py-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1F6B4A] flex items-center justify-center text-white text-xs font-bold">22384</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#111111]">Mutual Circle</div>
              <div className="text-[10px] text-[#111111]/50 font-mono">{SHORTCODE}</div>
            </div>
            <Lock className="w-3 h-3 text-[#111111]/40" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#F9F9F9]">
            {messages.map(m => (
              <div key={m.id} className={'flex ' + (m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[85%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap ' + (m.from === 'user' ? 'bg-[#1F6B4A] text-white rounded-br-sm' : 'bg-white text-[#111111] border border-[#111111]/10 rounded-bl-sm')}>{m.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {quickReplies[state].length > 0 && (
            <div className="px-2 py-1.5 bg-white border-t border-[#111111]/10 flex gap-1.5 overflow-x-auto">
              {quickReplies[state].map(q => (<button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }} className="px-2.5 py-1 text-[10px] font-mono border border-[#1F6B4A]/30 text-[#1F6B4A] rounded-full whitespace-nowrap hover:bg-[#1F6B4A]/10">{q}</button>))}
            </div>
          )}
          <form onSubmit={handleSend} className="p-2 bg-white border-t border-[#111111]/10 flex gap-1.5">
            <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Text message..." className="flex-1 bg-[#F2F2F7] rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F6B4A]" />
            <button type="submit" disabled={!input.trim()} className="w-8 h-8 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center disabled:opacity-40"><Send className="w-3.5 h-3.5" /></button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#1F6B4A]" /> Server-Side View</h3>
            <button onClick={() => setShowServerView(!showServerView)} className="text-[10px] text-[#1F6B4A] hover:underline flex items-center gap-1">{showServerView ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}{showServerView ? 'Hide' : 'Reveal'}</button>
          </div>
          <p className="text-[11px] text-[#111111]/60 leading-relaxed">What the platform database sees.</p>
          <div className="space-y-2 pt-2 border-t border-[#111111]/10 font-mono text-[10px]">
            <div className="flex justify-between"><span className="text-[#111111]/50">Phone (raw)</span><span className="text-rose-600 font-bold">{showServerView ? <span className="text-[#111111]">{PHONE}</span> : '----- ----- -----'}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Token (HMAC)</span><span className="text-[#1F6B4A] font-bold">{tokenHash || 'not yet generated'}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Channel</span><span className="text-[#111111]">SMS - {SHORTCODE}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Daily (shared)</span><span className="text-[#111111]">{tokenHash ? peekRate(tokenHash).count : 0} / {MAX_DAILY_REQUESTS}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">State</span><span className="text-[#111111] font-bold uppercase">{state.replace('_', ' ')}</span></div>
          </div>
          {showServerView && (<div className="p-2 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-800 leading-relaxed mt-2"><strong>Demo note:</strong> In production, the raw phone number is never returned from the tokenising gateway - it lives only in the isolated messaging store.</div>)}
        </div>
        <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-1.5">
          <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">SMS Spec Coverage</h4>
          {['Stateful menu navigation', 'One-way HMAC tokenisation', 'Rate limiting (25 msg cap)', 'STOP / START opt-out', 'Session timeout (5 min)', 'Swap flow with PIN delivery', 'Pool flow (utility / school / hospital)', 'Bench referral (helpline 0722 178 177)', 'Requests appear in Operations console'].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111111]/70"><div className="w-1 h-1 rounded-full bg-[#1F6B4A]" />{f}</div>
          ))}
        </div>
        <button onClick={() => { setMessages([{ id: 'sys-0', from: 'system', text: 'Welcome to Mutual Circle. Reply HELP to start, or STOP to opt out.', timestamp: 'now' }]); setState('idle'); setContext({}); setMsgCount(0); setTokenHash(null); }} className="w-full py-2 text-xs text-[#111111]/60 hover:text-[#111111] border border-[#111111]/15 rounded-lg bg-white">Reset Session</button>
      </div>
    </div>
  );
};

