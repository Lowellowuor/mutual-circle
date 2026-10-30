import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { generateHMAC } from '../../lib/hash';
import { consumeRate, peekRate, MAX_DAILY_REQUESTS } from '../../services/auth';
import { Send, Check, CheckCheck, ShieldAlert, Eye, EyeOff, Clock, Phone, AlertTriangle } from 'lucide-react';

type WaScreen = 'opt_in' | 'chat' | 'window_expired';
type WaMessageKind = 'text' | 'buttons' | 'list' | 'template' | 'receipt';

interface WaButton { id: string; title: string; }
interface WaListItem { id: string; title: string; description?: string; }
interface WaMessage {
  id: string;
  from: 'user' | 'business';
  kind: WaMessageKind;
  text?: string;
  templateName?: string;
  buttons?: WaButton[];
  listTitle?: string;
  listItems?: WaListItem[];
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface WaContext {
  bundle?: string;
  location?: string;
  category?: 'utility' | 'school_fee' | 'hospital_invoice';
  objectId?: string;
  amount?: number;
  pin?: string;
  poolRef?: string;
  poolStatus?: string;
}

const PHONE = '+254 700 123 456';
const BUSINESS_NAME = 'Mutual Circle';
const SESSION_WINDOW_SECONDS = 300;
const MAX_SESSION_BURST = MAX_DAILY_REQUESTS;

export const WhatsAppSimulator: React.FC = () => {
  const { executeSwap, executePool } = useApp();

  const [optedIn, setOptedIn] = useState(false);
  const [screen, setScreen] = useState<WaScreen>('opt_in');
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [context, setContext] = useState<WaContext>({});
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [windowRemaining, setWindowRemaining] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [showServerView, setShowServerView] = useState(false);
  const [metaAcknowledged, setMetaAcknowledged] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    if (screen !== 'chat' || windowRemaining <= 0) return;
    const t = setInterval(() => {
      setWindowRemaining(prev => {
        if (prev <= 1) { setScreen('window_expired'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [screen, windowRemaining]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const pushMessage = (m: Omit<WaMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...m, id: 'msg-' + Date.now() + '-' + Math.random(), timestamp: now() }]);
  };

  const businessSay = async (m: Omit<WaMessage, 'id' | 'timestamp' | 'from'>) => {
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 700 + Math.random() * 400));
    setIsTyping(false);
    pushMessage({ ...m, from: 'business' });
  };

  const markUserMessagesRead = () => {
    setMessages(prev => prev.map(m => m.from === 'user' ? { ...m, status: 'read' } : m));
  };

  const handleOptIn = async () => {
    if (!metaAcknowledged) return;
    const hash = await generateHMAC(PHONE);
    setTokenHash(hash);
    setOptedIn(true);
    setScreen('chat');
    setWindowRemaining(SESSION_WINDOW_SECONDS);

    pushMessage({
      from: 'business',
      kind: 'template',
      templateName: 'welcome_v1',
      text: 'Hello! Welcome to Mutual Circle on WhatsApp. Reply *STOP* to opt out at any time. Your session expires after 5 minutes of inactivity.',
    });
    await businessSay({
      kind: 'buttons',
      text: 'How can we help you today?',
      buttons: [
        { id: 'swap', title: 'Food bundles' },
        { id: 'pool', title: 'Pay a bill' },
        { id: 'support', title: 'Talk to someone' },
      ],
    });
  };

  const handleButtonReply = async (buttonId: string, label: string) => {
    pushMessage({ from: 'user', kind: 'text', text: label, status: 'delivered' });
    setTimeout(markUserMessagesRead, 800);
    setMsgCount(c => c + 1);
    setWindowRemaining(SESSION_WINDOW_SECONDS);
    await routeReply(buttonId);
  };

  const handleListReply = async (itemId: string, label: string) => {
    pushMessage({ from: 'user', kind: 'text', text: label, status: 'delivered' });
    setTimeout(markUserMessagesRead, 800);
    setMsgCount(c => c + 1);
    setWindowRemaining(SESSION_WINDOW_SECONDS);
    await routeReply(itemId);
  };

  const routeReply = async (reply: string) => {
    if (reply === 'swap') {
      await businessSay({
        kind: 'list',
        text: 'Select a bundle to reserve:',
        listTitle: 'View bundles',
        listItems: [
          { id: 'swap-pantry', title: 'Standard Pantry', description: 'Maize flour, rice, oil, lentils' },
          { id: 'swap-hygiene', title: 'Hygiene Kit', description: 'Soap, sanitary pads, toothpaste' },
        ],
      });
    } else if (reply === 'swap-pantry' || reply === 'swap-hygiene') {
      const bundle = reply === 'swap-pantry' ? 'Standard Pantry' : 'Hygiene Kit';
      setContext({ ...context, bundle });
      await businessSay({
        kind: 'list',
        text: 'Select a pickup location:',
        listTitle: 'View hubs',
        listItems: [
          { id: 'loc-kibera', title: 'Kibera Hub' },
          { id: 'loc-mathare', title: 'Mathare Central' },
          { id: 'loc-kawangware', title: 'Kawangware Station' },
        ],
      });
    } else if (reply.startsWith('loc-')) {
      const locations: Record<string, string> = { 'loc-kibera': 'Kibera Hub', 'loc-mathare': 'Mathare Central', 'loc-kawangware': 'Kawangware Station' };
      const location = locations[reply];
      const rateCheck = tokenHash ? consumeRate(tokenHash, 0) : { ok: true, state: { count: 0, value: 0, lastReset: '' } };
      if (!rateCheck.ok) { await businessSay({ kind: 'text', text: rateCheck.reason || 'Daily limit reached.' }); return; }
      const result = await executeSwap(context.bundle!, location, tokenHash || undefined);
      if (result) {
        setContext({ ...context, location, pin: result.pin });
        await businessSay({
          kind: 'template',
          templateName: 'locker_reservation_v1',
          text: 'Locker reserved. Bundle: ' + result.bundleCategory + '\nLocation: ' + location + '\nPIN: ' + result.pin + '\n\nShow this PIN at the locker terminal. Collect anytime.',
        });
      }
    } else if (reply === 'pool') {
      await businessSay({
        kind: 'buttons',
        text: 'Which bill would you like to pay?',
        buttons: [
          { id: 'pool-utility', title: 'Utility' },
          { id: 'pool-school', title: 'School fees' },
          { id: 'pool-hospital', title: 'Hospital' },
        ],
      });
    } else if (reply === 'pool-utility' || reply === 'pool-school' || reply === 'pool-hospital') {
      const category = reply === 'pool-utility' ? 'utility' : reply === 'pool-school' ? 'school_fee' : 'hospital_invoice';
      setContext({ ...context, category });
      const prompt = category === 'utility' ? 'Please type your KPLC / Water meter number:' : category === 'school_fee' ? 'Please type the admission number:' : 'Please type the hospital invoice number. Note: no clinical details are collected.';
      await businessSay({ kind: 'text', text: prompt });
    } else if (reply === 'support') {
      await businessSay({
        kind: 'text',
        text: 'For confidential peer support, reach out to Befrienders Kenya: 0722 178 177 (free).\n\nFor emergencies: 999.\nFor Kenya Red Cross: 1199.\n\nYou are not alone.',
      });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (text.toUpperCase() === 'STOP') {
      pushMessage({ from: 'user', kind: 'text', text, status: 'delivered' });
      setTimeout(markUserMessagesRead, 800);
      await businessSay({ kind: 'text', text: 'You have opted out. Reply START to resume. You will receive no further messages.' });
      setScreen('window_expired');
      return;
    }
    pushMessage({ from: 'user', kind: 'text', text, status: 'sent' });
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.from === 'user' ? { ...m, status: 'delivered' } : m));
    }, 500);
    setTimeout(markUserMessagesRead, 1500);
    setMsgCount(c => c + 1);
    setWindowRemaining(SESSION_WINDOW_SECONDS);

    if (context.category && !context.objectId) {
      if (text.length >= 4) {
        setContext({ ...context, objectId: text });
        await businessSay({ kind: 'text', text: 'Got it. Now type the amount in KES (e.g. 3500):' });
      } else {
        await businessSay({ kind: 'text', text: 'That looks too short. Please try again (min 4 digits).' });
      }
    } else if (context.category && context.objectId && !context.amount) {
      const amt = parseFloat(text);
      if (!isNaN(amt) && amt > 0) {
        setContext({ ...context, amount: amt });
        await businessSay({
          kind: 'buttons',
          text: 'Confirm payment:\nCategory: ' + context.category.replace('_', ' ') + '\nRef: ' + context.objectId + '\nAmount: KES ' + amt.toLocaleString(),
          buttons: [
            { id: 'confirm-yes', title: 'Confirm' },
            { id: 'confirm-no', title: 'Cancel' },
          ],
        });
      } else {
        await businessSay({ kind: 'text', text: 'Please send a valid amount in KES.' });
      }
    } else if (context.category && context.objectId && context.amount) {
      const rateCheck = tokenHash ? consumeRate(tokenHash, context.amount) : { ok: true, state: { count: 0, value: 0, lastReset: '' } };
      if (!rateCheck.ok) { await businessSay({ kind: 'text', text: rateCheck.reason || 'Daily limit reached.' }); return; }
      const result = await executePool(context.category, context.objectId, context.amount, tokenHash || undefined);
      if (result) {
        setContext({ ...context, poolRef: result.hashedObjectId, poolStatus: result.status });
        await businessSay({
          kind: 'template',
          templateName: 'payment_queued_v1',
          text: 'Payment queued.\nAmount: KES ' + context.amount.toLocaleString() + '\nRef: ' + result.hashedObjectId + '\nStatus: ' + result.status.replace('_', ' ') + '\n\nConfirmation SMS within 2 hours.',
        });
      }
    } else {
      await businessSay({ kind: 'text', text: 'I did not understand that. Reply *HELP* to see options, or *STOP* to opt out.' });
    }
  };

  const handleConfirmButton = async (confirmed: boolean) => {
    pushMessage({ from: 'user', kind: 'text', text: confirmed ? 'Confirm' : 'Cancel', status: 'delivered' });
    setTimeout(markUserMessagesRead, 800);
    setWindowRemaining(SESSION_WINDOW_SECONDS);
    if (confirmed && context.category && context.objectId && context.amount) {
      const rateCheck = tokenHash ? consumeRate(tokenHash, context.amount) : { ok: true, state: { count: 0, value: 0, lastReset: '' } };
      if (!rateCheck.ok) { await businessSay({ kind: 'text', text: rateCheck.reason || 'Daily limit reached.' }); return; }
      const result = await executePool(context.category, context.objectId, context.amount, tokenHash || undefined);
      if (result) {
        setContext({ ...context, poolRef: result.hashedObjectId, poolStatus: result.status });
        await businessSay({
          kind: 'template',
          templateName: 'payment_queued_v1',
          text: 'Payment queued.\nAmount: KES ' + context.amount.toLocaleString() + '\nRef: ' + result.hashedObjectId + '\nStatus: ' + result.status.replace('_', ' ') + '\n\nConfirmation SMS within 2 hours.',
        });
      }
    } else {
      await businessSay({ kind: 'text', text: 'Payment cancelled. Reply HELP to start over.' });
    }
  };

  const renderMessage = (m: WaMessage) => {
    if (m.from === 'business') {
      return (
        <div className="bg-white rounded-lg rounded-tl-none shadow-sm px-3 py-2 text-xs text-[#111111] max-w-[85%] whitespace-pre-wrap">
          {m.kind === 'template' && (
            <div className="text-[9px] uppercase font-bold text-[#25D366] mb-1 tracking-wider">
              Template: {m.templateName}
            </div>
          )}
          <div>{m.text}</div>
          {m.kind === 'buttons' && m.buttons && (
            <div className="mt-2 pt-2 border-t border-[#111111]/10 flex flex-col gap-1">
              {m.buttons.map(b => (
                <button key={b.id} onClick={() => handleButtonReply(b.id, b.title)} className="w-full text-center py-2 text-[#00A5F4] text-xs font-medium hover:bg-[#F0F0F0] rounded">
                  {b.title}
                </button>
              ))}
            </div>
          )}
          {m.kind === 'list' && m.listItems && (
            <div className="mt-2 pt-2 border-t border-[#111111]/10">
              <div className="text-[10px] text-[#111111]/50 mb-1">{m.listTitle}</div>
              <div className="flex flex-col gap-1">
                {m.listItems.map(item => (
                  <button key={item.id} onClick={() => handleListReply(item.id, item.title)} className="text-left px-2 py-1.5 hover:bg-[#F0F0F0] rounded">
                    <div className="text-xs font-semibold text-[#111111]">{item.title}</div>
                    {item.description && <div className="text-[10px] text-[#111111]/60">{item.description}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="text-[9px] text-[#111111]/40 mt-1 text-right">{m.timestamp}</div>
        </div>
      );
    }
    return (
      <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none shadow-sm px-3 py-2 text-xs text-[#111111] max-w-[85%] whitespace-pre-wrap">
        <div>{m.text}</div>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[9px] text-[#111111]/50">{m.timestamp}</span>
          {m.status === 'sent' && <Check className="w-3 h-3 text-[#111111]/40" />}
          {m.status === 'delivered' && <CheckCheck className="w-3 h-3 text-[#111111]/40" />}
          {m.status === 'read' && <CheckCheck className="w-3 h-3 text-[#53BDEB]" />}
        </div>
      </div>
    );
  };

  const remainingMinutes = Math.floor(windowRemaining / 60);
  const remainingSeconds = windowRemaining % 60;

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
      <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
        <div className="bg-[#ECE5DD] rounded-[2rem] overflow-hidden flex flex-col h-[600px]">

          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xs font-bold">MC</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{BUSINESS_NAME}</div>
              <div className="text-[10px] text-white/70">{screen === 'chat' ? 'online' : 'business account'}</div>
            </div>
            {screen === 'chat' && windowRemaining > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-white/80 font-mono">
                <Clock className="w-3 h-3" />
                {remainingMinutes}:{String(remainingSeconds).padStart(2, '0')}
              </div>
            )}
          </div>

          {screen === 'opt_in' && (
            <div className="flex-1 p-5 overflow-y-auto bg-[#ECE5DD] space-y-4">
              <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-[#25D366]">
                  <Phone className="w-5 h-5" />
                  <span className="font-bold text-sm">WhatsApp Business</span>
                </div>
                <div className="text-xs text-[#111111]/80 leading-relaxed">
                  You are about to chat with <strong>{BUSINESS_NAME}</strong> on WhatsApp Business. Before continuing, please review and confirm:
                </div>
                <label className="flex items-start gap-2 p-2 rounded border border-[#111111]/15 bg-[#FFF8E1] cursor-pointer">
                  <input type="checkbox" checked={metaAcknowledged} onChange={e => setMetaAcknowledged(e.target.checked)} className="mt-0.5 accent-[#FF6B00]" />
                  <div className="text-[10px] text-[#111111] leading-relaxed">
                    <AlertTriangle className="w-3 h-3 text-amber-700 inline mr-1" />
                    <strong>I understand that:</strong> WhatsApp is operated by Meta. My phone number and message content are visible to Meta's infrastructure. This channel is <strong>not</strong> suitable for the anonymity-critical Swap/Pool flows.
                  </div>
                </label>
                <button onClick={handleOptIn} disabled={!metaAcknowledged} className="w-full py-2.5 bg-[#25D366] text-white rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                  Start Chat
                </button>
                <div className="text-[9px] text-[#111111]/40 text-center">Reply STOP to opt out at any time</div>
              </div>

              <div className="bg-white/80 rounded-lg p-3 text-[10px] text-[#111111]/70 leading-relaxed border-l-4 border-amber-500">
                <strong>Spec note:</strong> The R.U.T.H spec (Section 4.1) specifies SMS, USSD, and web only. WhatsApp is an extension with an additional privacy cost — Meta is a 4th party in the aid chain.
              </div>
            </div>
          )}

          {screen === 'window_expired' && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <div className="text-4xl">?</div>
                <div className="text-sm font-bold text-[#111111]">Session window expired</div>
                <div className="text-xs text-[#111111]/60 max-w-[200px]">WhatsApp Business allows replies only within 24 hours of the last user message. You can only receive template messages now.</div>
                <button onClick={() => { setScreen('chat'); setWindowRemaining(SESSION_WINDOW_SECONDS); }} className="mt-2 px-4 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold">
                  Simulate New Message
                </button>
              </div>
            </div>
          )}

          {screen === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#ECE5DD]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Cpath d=%22M0 20h40M20 0v40%22 stroke=%22%23d4cdc4%22 stroke-width=%221%22 fill=%22none%22/%3E%3C/svg%3E")' }}>
                <div className="text-center text-[9px] text-[#111111]/50 bg-white/70 rounded-full px-3 py-1 mx-auto w-fit mb-2">TODAY</div>
                {messages.map(m => (
                  <div key={m.id} className={'flex ' + (m.from === 'user' ? 'justify-end' : 'justify-start')}>
                    {renderMessage(m)}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[#111111]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-[#111111]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-[#111111]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-2 bg-[#F0F0F0] flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 bg-white rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
                <button type="submit" disabled={!input.trim()} className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" /> Meta in the Aid Chain
          </div>
          <p className="text-[10px] text-amber-900/80 leading-relaxed">
            WhatsApp Business API is operated by Meta. Every message (content + phone number) passes through Meta's infrastructure. This <strong>breaks the "anonymity from people in the aid chain" principle</strong> for the actual flow, since Meta becomes a 4th party.
          </p>
          <p className="text-[10px] text-amber-900/80 leading-relaxed">
            <strong>Recommended use:</strong> Donor notifications, partner confirmations, and The Bench outreach — <em>not</em> Swap/Pool intake.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#1F6B4A]" /> Server-Side View
            </h3>
            <button onClick={() => setShowServerView(!showServerView)} className="text-[10px] text-[#1F6B4A] hover:underline flex items-center gap-1">
              {showServerView ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showServerView ? 'Hide' : 'Reveal'}
            </button>
          </div>
          <div className="space-y-2 pt-2 border-t border-[#111111]/10 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Phone (raw)</span>
              <span className="text-rose-600 font-bold">{showServerView ? <span className="text-[#111111]">{PHONE}</span> : '----- ----- -----'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Token (HMAC)</span>
              <span className="text-[#1F6B4A] font-bold">{tokenHash || 'not yet generated'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Opted in</span>
              <span className={optedIn ? 'text-emerald-700 font-bold' : 'text-[#111111]/50'}>{optedIn ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Window (demo)</span>
              <span className="text-[#111111]">{remainingMinutes}:{String(remainingSeconds).padStart(2, '0')} / 5:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Messages</span>
              <span className="text-[#111111]">{msgCount}</span>
            </div>
          </div>

          {showServerView && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-800 leading-relaxed mt-2">
              <strong>Extra disclosure (WhatsApp-specific):</strong> In production, Meta also stores:
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>Your phone number (plaintext, on their servers)</li>
                <li>Full message text (encrypted in transit, but Meta holds keys for Business API)</li>
                <li>Timestamps, delivery receipts, device info</li>
              </ul>
              Our HMAC token protects you from OUR staff, not from Meta.
            </div>
          )}

          {screen === 'chat' && (
            <button onClick={() => setWindowRemaining(0)} className="w-full mt-1 py-1 text-[9px] font-mono text-rose-600 border border-rose-200 rounded hover:bg-rose-50">
              Force expire window (demo)
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-1.5">
          <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">WhatsApp Feature Coverage</h4>
          {[
            'Meta disclosure + explicit opt-in',
            'Template messages (pre-approved)',
            'Interactive reply buttons (3 max)',
            'List messages (multi-item menus)',
            '24h customer service window (5 min demo)',
            'Read receipts (blue ticks)',
            'Typing indicator',
            'STOP opt-out compliance',
            'Swap/Pool flows',
            'The Bench referral',
            'Separate Meta disclosure in server view',
          ].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111111]/70">
              <div className="w-1 h-1 rounded-full bg-[#25D366]" />{f}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setScreen('opt_in'); setOptedIn(false); setMessages([]); setContext({});
            setInput(''); setMsgCount(0); setWindowRemaining(0); setTokenHash(null); setMetaAcknowledged(false);
          }}
          className="w-full py-2 text-xs text-[#111111]/60 hover:text-[#111111] border border-[#111111]/15 rounded-lg bg-white"
        >
          Reset Simulator
        </button>
      </div>
    </div>
  );
};

