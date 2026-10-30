import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { generateHMAC } from '../../lib/hash';
import { consumeRate, peekRate, MAX_DAILY_REQUESTS } from '../../services/auth';
import { Clock, ShieldCheck, Eye, EyeOff, Zap } from 'lucide-react';

type UssdScreen = 'welcome' | 'main_menu' | 'swap_bundle' | 'swap_location' | 'swap_result'
  | 'pool_category' | 'pool_object' | 'pool_amount' | 'pool_confirm' | 'pool_result'
  | 'support' | 'session_ended' | 'rate_limited';

interface UssdContext {
  bundle?: string;
  location?: string;
  category?: 'utility' | 'school_fee' | 'hospital_invoice';
  objectId?: string;
  amount?: number;
  resultMessage?: string;
}

const PHONE = '+254 700 123 456';
const USSD_CODE = '*384*22384#';
const SESSION_TIMEOUT = 90;
const MAX_SESSIONS_PER_DAY = MAX_DAILY_REQUESTS;
const COST_PER_SESSION = 2;

export const UssdSimulator: React.FC = () => {
  const { executeSwap, executePool } = useApp();

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [screen, setScreen] = useState<UssdScreen>('welcome');
  const [context, setContext] = useState<UssdContext>({});
  const [input, setInput] = useState('');
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [showServerView, setShowServerView] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const log = (text: string) => setActivityLog(prev => [...prev.slice(-5), text]);

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    if (sessionActive && elapsed >= SESSION_TIMEOUT) endSession('Session expired.');
  }, [elapsed, sessionActive]);

  useEffect(() => { inputRef.current?.focus(); }, [screen]);

  const startSession = async () => {
    if (sessionsUsed >= MAX_SESSIONS_PER_DAY) {
      setScreen('rate_limited');
      setSessionActive(false);
      return;
    }
    if (!tokenHash) {
      const hash = await generateHMAC(PHONE);
      setTokenHash(hash);
    }
    setSessionsUsed(s => s + 1);
    setElapsed(0);
    setSessionActive(true);
    setScreen('welcome');
    setInput('');
    setContext({});
    log('Session started');
  };

  const endSession = (message?: string) => {
    setSessionActive(false);
    if (screen !== 'swap_result' && screen !== 'pool_result') {
      setScreen('session_ended');
    }
    if (message) log(message);
  };

  const navigateBack = () => {
    setInput('');
    switch (screen) {
      case 'main_menu': setScreen('welcome'); break;
      case 'swap_bundle': setScreen('main_menu'); break;
      case 'swap_location': setScreen('swap_bundle'); break;
      case 'pool_category': setScreen('main_menu'); break;
      case 'pool_object': setScreen('pool_category'); break;
      case 'pool_amount': setScreen('pool_object'); break;
      case 'pool_confirm': setScreen('pool_amount'); break;
      case 'support': setScreen('main_menu'); break;
      default: break;
    }
  };

  const handleInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = input.trim();
    setInput('');
    if (!val) return;
    if (val === '*') { endSession('Session cancelled.'); return; }
    if (val === '0') { navigateBack(); return; }

    switch (screen) {
      case 'welcome':
        if (val === '1') { setScreen('main_menu'); log('Entered main menu'); }
        break;
      case 'main_menu':
        if (val === '1') { setScreen('swap_bundle'); log('Chose Swap'); }
        else if (val === '2') { setScreen('pool_category'); log('Chose Pool'); }
        else if (val === '3') { setScreen('support'); log('Chose Support'); }
        break;
      case 'swap_bundle':
        if (val === '1' || val === '2') {
          setContext({ ...context, bundle: val === '1' ? 'Standard Pantry' : 'Hygiene Kit' });
          setScreen('swap_location'); log('Bundle selected');
        }
        break;
      case 'swap_location':
        if (['1','2','3'].includes(val)) {
          const locations = ['Kibera Hub', 'Mathare Central', 'Kawangware Station'];
          const location = locations[parseInt(val) - 1];
          const rateCheck = tokenHash ? consumeRate(tokenHash, 0) : { ok: true, state: { count: 0, value: 0, lastReset: '' } };
          if (!rateCheck.ok) { setContext({ ...context, resultMessage: rateCheck.reason || 'Daily limit reached.' }); setScreen('swap_result'); setSessionActive(false); return; }
          const result = await executeSwap(context.bundle!, location, tokenHash || undefined);
          if (result) {
            setContext({ ...context, location, resultMessage: result.pin });
            setScreen('swap_result');
            setSessionActive(false);
            log('Locker reserved: PIN ' + result.pin);
          } else {
            endSession('System error. Try again.');
          }
        }
        break;
      case 'pool_category':
        if (['1','2','3'].includes(val)) {
          const cats = { '1': 'utility', '2': 'school_fee', '3': 'hospital_invoice' } as const;
          setContext({ ...context, category: cats[val as '1'|'2'|'3'] });
          setScreen('pool_object'); log('Category selected');
        }
        break;
      case 'pool_object':
        if (val.length >= 4) {
          setContext({ ...context, objectId: val });
          setScreen('pool_amount'); log('Object ID entered');
        }
        break;
      case 'pool_amount':
        const amt = parseFloat(val);
        if (!isNaN(amt) && amt > 0) {
          setContext({ ...context, amount: amt });
          setScreen('pool_confirm'); log('Amount: KES ' + amt);
        }
        break;
      case 'pool_confirm':
        if (val.toUpperCase() === 'YES') {
          const rateCheck = tokenHash ? consumeRate(tokenHash, context.amount!) : { ok: true, state: { count: 0, value: 0, lastReset: '' } };
          if (!rateCheck.ok) { setContext({ ...context, resultMessage: rateCheck.reason || 'Daily limit reached.' }); setScreen('pool_result'); setSessionActive(false); return; }
          const result = await executePool(context.category!, context.objectId!, context.amount!, tokenHash || undefined);
          if (result) {
            setContext({ ...context, resultMessage: result.hashedObjectId + ' | ' + result.status.replace('_', ' ') });
            setScreen('pool_result');
            setSessionActive(false);
            log('Payment queued');
          } else {
            endSession('System error. Try again.');
          }
        } else if (val.toUpperCase() === 'NO') {
          endSession('Payment cancelled.');
        }
        break;
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <div className="space-y-3">
            <div className="text-[#00ff88] font-bold">MUTUAL CIRCLE</div>
            <div className="text-white/60 text-[10px]">--------------</div>
            <div className="text-white text-xs leading-relaxed">
              Resource-sharing network.
              <br />Blind-pooled. Anonymous.
            </div>
            <div className="mt-4 text-white/80 text-xs">
              Press <span className="text-[#00ff88] font-bold">1</span> to start
            </div>
          </div>
        );
      case 'main_menu':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">MAIN MENU</div>
            <div className="text-white text-xs space-y-1">
              <div>1. Food bundles</div><div>2. Pay a bill</div><div>3. Talk to someone</div>
            </div>
          </div>
        );
      case 'swap_bundle':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">FOOD BUNDLES</div>
            <div className="text-white text-xs space-y-1"><div>1. Standard Pantry</div><div>2. Hygiene Kit</div></div>
            <div className="mt-3 text-white/60 text-[10px]">Reply 1 or 2</div>
          </div>
        );
      case 'swap_location':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">PICKUP LOCATION</div>
            <div className="text-white text-xs space-y-1">
              <div>1. Kibera Hub</div><div>2. Mathare Central</div><div>3. Kawangware Station</div>
            </div>
          </div>
        );
      case 'swap_result':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">RESERVED!</div>
            <div className="text-white text-xs space-y-1">
              <div>Locker: {context.location}</div>
              <div>Bundle: {context.bundle}</div>
              <div className="mt-2 text-[#00ff88] font-bold text-lg">PIN: {context.resultMessage}</div>
              <div className="mt-3 text-white/60 text-[10px]">Enter PIN at any locker terminal.</div>
            </div>
          </div>
        );
      case 'pool_category':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">BILL PAYMENT</div>
            <div className="text-white text-xs space-y-1">
              <div>1. Utility (KPLC)</div><div>2. School fees</div><div>3. Hospital invoice</div>
            </div>
            <div className="mt-3 text-white/60 text-[10px]">Hospital flow excludes clinical data.</div>
          </div>
        );
      case 'pool_object':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">
              {context.category === 'utility' ? 'METER NUMBER' : context.category === 'school_fee' ? 'ADMISSION NUMBER' : 'INVOICE NUMBER'}
            </div>
            <div className="text-white text-xs">
              Enter the {context.category === 'utility' ? 'KPLC/Water meter' : context.category === 'school_fee' ? 'admission' : 'invoice'} number below.
            </div>
          </div>
        );
      case 'pool_amount':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">AMOUNT (KES)</div>
            <div className="text-white text-xs">Enter the amount to pay.</div>
            <div className="mt-3 text-white/60 text-[10px]">Amounts over 5,000 require Tier 3 verification.</div>
          </div>
        );
      case 'pool_confirm':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">CONFIRM</div>
            <div className="text-white text-xs space-y-1">
              <div>Category: {(context.category as string)?.replace('_', ' ')}</div>
              <div>Ref: {context.objectId}</div>
              <div>Amount: KES {context.amount?.toLocaleString()}</div>
            </div>
            <div className="mt-3 text-white/80 text-xs">
              Reply <span className="text-[#00ff88] font-bold">YES</span> or <span className="text-red-400 font-bold">NO</span>
            </div>
          </div>
        );
      case 'pool_result':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">PAYMENT QUEUED</div>
            <div className="text-white text-xs space-y-1">
              <div>Amount: KES {context.amount?.toLocaleString()}</div>
              <div className="text-white/70 text-[10px] mt-2">{context.resultMessage}</div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/20 text-[10px] text-white/50">
              Confirmation SMS within 2 hours.
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">PEER SUPPORT</div>
            <div className="text-white text-xs space-y-1">
              <div>Befrienders Kenya:</div>
              <div className="text-[#00ff88] font-bold">0722 178 177</div>
              <div className="mt-2">Emergency: 999</div>
              <div>Red Cross: 1199</div>
            </div>
            <div className="mt-3 text-white/60 text-[10px]">Press 0 to go back</div>
          </div>
        );
      case 'session_ended':
        return (
          <div className="space-y-2">
            <div className="text-[#00ff88] font-bold">SESSION ENDED</div>
            <div className="text-white text-xs leading-relaxed">
              Thank you for using Mutual Circle.
              <br />No names were collected.
              <br />No identity was stored.
            </div>
            <div className="mt-3 pt-2 border-t border-white/20 text-[10px] text-white/50">
              Dial {USSD_CODE} to start again.
            </div>
          </div>
        );
      case 'rate_limited':
        return (
          <div className="space-y-2">
            <div className="text-red-400 font-bold">RATE LIMIT REACHED</div>
            <div className="text-white text-xs leading-relaxed">
              You have used {MAX_SESSIONS_PER_DAY} sessions today.
              <br /><br />Try again tomorrow or visit a hub.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const remaining = Math.max(0, SESSION_TIMEOUT - elapsed);
  const remainingPct = (remaining / SESSION_TIMEOUT) * 100;
  const showInput = sessionActive && !['swap_result', 'pool_result', 'session_ended', 'rate_limited'].includes(screen);
  const showDialAgain = !sessionActive && (screen === 'session_ended' || screen === 'swap_result' || screen === 'pool_result' || screen === 'rate_limited');
  const showWelcomeDial = !sessionActive && screen === 'welcome';

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
      <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
        <div className="bg-[#0a0a0a] rounded-[2rem] overflow-hidden flex flex-col h-[600px] text-white">

          <div className="bg-[#000] text-white/80 px-4 pt-2 pb-1 flex items-center justify-between text-[10px] font-medium">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-[#00ff88]">USSD</span>
            <span>4G</span>
          </div>

          <div className="bg-[#000] border-b border-white/10 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-mono text-[#00ff88]">{USSD_CODE}</span>
            {sessionActive && (
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <Clock className="w-3 h-3 text-white/60" />
                <span className={remaining < 20 ? 'text-red-400 font-bold' : 'text-white/60'}>
                  {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono bg-[#0a0a0a]">
            {showWelcomeDial ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="text-4xl">??</div>
                <div className="text-[#00ff88] text-xs font-mono">{USSD_CODE}</div>
                <button
                  onClick={startSession}
                  className="px-6 py-3 bg-[#00ff88] text-black rounded-full text-sm font-bold hover:bg-[#00dd77] transition-colors"
                >
                  Dial USSD
                </button>
                <div className="text-white/40 text-[10px] text-center mt-4">
                  Simulated session · KES {COST_PER_SESSION} (mock)
                </div>
              </div>
            ) : (
              <div>{renderScreen()}</div>
            )}
          </div>

          {sessionActive && (
            <div className="h-1 bg-black">
              <div className={'h-full transition-all duration-1000 ' + (remaining < 20 ? 'bg-red-500' : 'bg-[#00ff88]')} style={{ width: remainingPct + '%' }} />
            </div>
          )}

          {showInput && (
            <form onSubmit={handleInput} className="p-3 bg-black border-t border-white/10 flex gap-2">
              <span className="text-[#00ff88] text-xs font-mono py-2">›</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Reply..."
                autoComplete="off"
                className="flex-1 bg-[#111] border border-white/20 rounded px-3 py-2 text-xs font-mono text-[#00ff88] focus:outline-none focus:border-[#00ff88]"
              />
              <button type="submit" className="px-3 py-2 bg-[#00ff88] text-black rounded text-xs font-bold hover:bg-[#00dd77]">Send</button>
            </form>
          )}

          {showDialAgain && (
            <div className="p-3 bg-black border-t border-white/10">
              <button onClick={startSession} className="w-full py-2 bg-[#00ff88] text-black rounded text-xs font-bold hover:bg-[#00dd77]">
                Dial Again
              </button>
            </div>
          )}

          <div className="bg-black px-3 py-1.5 flex items-center justify-between text-[9px] font-mono text-white/40">
            <span>0 Back</span>
            <span>? Cancel</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1F6B4A]" /> Server-Side View
            </h3>
            <button onClick={() => setShowServerView(!showServerView)} className="text-[10px] text-[#1F6B4A] hover:underline flex items-center gap-1">
              {showServerView ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showServerView ? 'Hide' : 'Reveal'}
            </button>
          </div>
          <div className="space-y-2 pt-2 border-t border-[#111111]/10 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-[#111111]/50">MSISDN (raw)</span>
              <span className="text-rose-600 font-bold">{showServerView ? <span className="text-[#111111]">{PHONE}</span> : '----- ----- -----'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Token (HMAC)</span>
              <span className="text-[#1F6B4A] font-bold">{tokenHash || 'not yet generated'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Daily (shared)</span>
              <span className="text-[#111111]">{tokenHash ? peekRate(tokenHash).count : 0} / {MAX_DAILY_REQUESTS}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Session time</span>
              <span className="text-[#111111]">{elapsed}s / {SESSION_TIMEOUT}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Screen</span>
              <span className="text-[#111111] font-bold uppercase">{screen.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#111111]/50">Cost (mock)</span>
              <span className="text-[#111111]">KES {COST_PER_SESSION}</span>
            </div>
          </div>
          {activityLog.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#111111]/10">
              <div className="text-[9px] font-mono uppercase text-[#111111]/40 mb-1">Event log</div>
              {activityLog.slice(-4).map((entry, i) => (
                <div key={i} className="text-[9px] font-mono text-[#111111]/60">› {entry}</div>
              ))}
            </div>
          )}
          {showServerView && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-800 leading-relaxed mt-2">
              <strong>Demo note:</strong> In production, the raw MSISDN is never returned from the tokenising gateway. The telco holds it; our platform only sees the HMAC token.
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-1.5">
          <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> USSD Spec Coverage
          </h4>
          {[
            'Dial *384*22384# shortcode',
            'Single-screen menu navigation',
            '90-second session timeout',
            'Back (0) / Cancel (?)',
            'Session rate limit (10/day)',
            'One-way HMAC tokenisation',
            'Swap flow with PIN',
            'Pool flow (utility / school / hospital)',
            'Bench referral (helplines)',
            'Cost notice (KES 2 mock)',
            'Requests appear in Operations console',
          ].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111111]/70">
              <div className="w-1 h-1 rounded-full bg-[#1F6B4A]" />{f}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setScreen('welcome'); setSessionActive(false); setContext({});
            setInput(''); setElapsed(0); setActivityLog([]); setTokenHash(null);
          }}
          className="w-full py-2 text-xs text-[#111111]/60 hover:text-[#111111] border border-[#111111]/15 rounded-lg bg-white"
        >
          Reset Simulator
        </button>
      </div>
    </div>
  );
};

