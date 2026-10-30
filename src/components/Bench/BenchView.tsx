import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getHelplines } from '../../lib/apiClient';
import {
  MessageCircle, Phone, Info, Send, Lock, ShieldAlert, ShieldCheck,
  Check, X, RotateCcw, Eye, EyeOff,
} from 'lucide-react';

type Tab = 'chat' | 'helplines' | 'info';

interface Helpline {
  id: string;
  name: string;
  number: string;
  sub: string;
  category: string;
}

export const BenchView: React.FC = () => {
  const { swapRequests, poolRequests, donorContributions } = useApp();
  const [entered, setEntered] = useState(false);
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [tab, setTab] = useState<Tab>('chat');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ from: 'user'; text: string }[]>([]);
  const [showServer, setShowServer] = useState(false);
  const [sessionId] = useState(() => 'BS-' + Math.random().toString(36).substring(2, 10).toUpperCase());

  useEffect(() => {
    (async () => {
      const h = await getHelplines();
      if (h) setHelplines(h.helplines);
    })();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setChat(prev => [...prev, { from: 'user', text: message }]);
    setMessage('');
  };

  const reset = () => {
    setEntered(false);
    setTab('chat');
    setChat([]);
    setMessage('');
    setShowServer(false);
  };

  const mainSystemRecords = swapRequests.length + poolRequests.length + donorContributions.length;

  const renderLanding = () => (
    <div className="p-5 space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-5 text-white space-y-2">
        <MessageCircle className="w-6 h-6 text-white/80" />
        <h2 className="font-serif text-xl font-bold leading-tight">A quiet place<br />to be heard.</h2>
        <p className="text-[11px] text-white/70 leading-relaxed">Anonymous peer support. No records. No judgement.</p>
      </div>
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
        <div className="flex items-center gap-1 text-[10px] font-bold text-purple-900 uppercase tracking-wider">
          <ShieldAlert className="w-3 h-3" /> Separate system
        </div>
        <p className="text-[10px] text-purple-900/80 leading-relaxed">
          The Bench is <strong>completely isolated</strong> from your Swap / Pool account. Nothing is shared - not your token, not your request history, not your identity.
        </p>
      </div>
      <div className="space-y-1.5">
        {[
          'No names, tokens, or request history',
          'Messages are not stored',
          'Cannot be linked to your aid account',
          'Free and always available',
        ].map(f => (
          <div key={f} className="flex items-center gap-2 text-[11px] text-[#111111]/70">
            <Check className="w-3 h-3 text-purple-600 shrink-0" />
            {f}
          </div>
        ))}
      </div>
      <button
        onClick={() => setEntered(true)}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium mt-2"
      >
        Start session
      </button>
      <button
        onClick={() => setTab('helplines')}
        className="w-full py-2.5 bg-white border border-purple-200 text-purple-800 rounded-xl text-xs font-medium"
      >
        Just show me helplines
      </button>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="p-2.5 bg-purple-50 border-b border-purple-200 flex items-center justify-between shrink-0">
        <span className="text-[9px] font-mono text-purple-900 flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" /> Ephemeral · {sessionId}
        </span>
        <button onClick={reset} className="text-[9px] text-rose-600 hover:underline">End</button>
      </div>

      <div className="px-3 py-2 bg-purple-100 border-b border-purple-200">
        <p className="text-[9px] text-purple-900 leading-relaxed">
          <strong>Demo note:</strong> Peer responses are not live in this demo. In production, a trained supporter replies within 60 seconds. You can type freely - nothing is stored.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#FAF8F4]">
        <div className="text-center text-[9px] text-[#111111]/40 font-mono">Anonymous · no records kept</div>
        {chat.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <MessageCircle className="w-8 h-8 text-purple-300 mx-auto" />
            <p className="text-[11px] text-[#111111]/40">Say hello whenever you are ready.</p>
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} className="flex justify-end">
            <div className="max-w-[82%] px-3 py-2 text-[11px] leading-relaxed bg-purple-600 text-white rounded-xl rounded-tr-sm">
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="p-2 border-t border-[#111111]/10 bg-white flex gap-1.5 shrink-0">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#FAF8F4] border border-[#111111]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );

  const renderHelplines = () => (
    <div className="p-4 space-y-3">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#111111]">Helplines</h2>
        <p className="text-[11px] text-[#111111]/50 mt-0.5">Verified services. Free. Confidential.</p>
      </div>
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-900">
          <Phone className="w-3 h-3" /> Immediate help
        </div>
        <p className="text-[10px] text-purple-900/70 mt-1 leading-relaxed">
          If you or someone else is in danger, call <strong>999</strong> now.
        </p>
      </div>
      <div className="space-y-2">
        {helplines.length === 0 ? (
          <div className="p-4 bg-white border border-dashed border-[#111111]/20 rounded-xl text-center">
            <p className="text-[10px] text-[#111111]/50">Loading helplines...</p>
          </div>
        ) : helplines.map(h => (
          <div key={h.id} className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-1">
            <div className="text-[9px] uppercase tracking-wider text-[#111111]/50 font-mono">{h.name}</div>
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-[#111111] font-mono">{h.number}</div>
              <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                <Phone className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-[10px] text-[#111111]/50">{h.sub}</div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl text-[10px] text-[#111111]/60 leading-relaxed">
        Numbers verified at time of writing. If a number is unreachable, try <strong>999</strong> or your nearest hospital.
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="p-4 space-y-3">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#111111]">Isolation</h2>
        <p className="text-[11px] text-[#111111]/50 mt-0.5">How The Bench is different.</p>
      </div>
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
        <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Does NOT share</div>
        {['Tokens or request history', 'Swap or Pool records', 'Donor contributions', 'Phone or channel data', 'Session logs or timestamps'].map(f => (
          <div key={f} className="flex items-center gap-1.5 text-[10px] text-rose-900/80">
            <X className="w-2.5 h-2.5 shrink-0" /> {f}
          </div>
        ))}
      </div>
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
        <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Does provide</div>
        {['Confidential peer listening', 'Verified helpline signposting', 'Non-conditional access', 'No records retained'].map(f => (
          <div key={f} className="flex items-center gap-1.5 text-[10px] text-emerald-900/80">
            <Check className="w-2.5 h-2.5 shrink-0" /> {f}
          </div>
        ))}
      </div>
      <div className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-1.5">
        <div className="text-[9px] font-mono uppercase text-[#111111]/50">Live proof</div>
        <p className="text-[10px] text-[#111111]/70 leading-relaxed">
          Right now your Swap / Pool / Donor account has <strong>{mainSystemRecords}</strong> records in the main system. The Bench reads <strong>none</strong> of them.
        </p>
        <div className="text-[9px] font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
          Bench data store: empty
        </div>
      </div>
      <div className="p-2.5 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[9px] text-[#111111]/60 leading-relaxed space-y-1">
        <div className="flex items-center gap-1 text-[#111111]/70 font-bold">
          <Info className="w-2.5 h-2.5" /> Prototype disclosure
        </div>
        <p>
          <strong>R.U.T.H 4.9</strong> requires a separate system, separate data store, and no shared identifiers. In this prototype, isolation is simulated visually and by data-access discipline. Production deployment would run The Bench on physically separate infrastructure with no API path to Swap/Pool tables.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!entered && tab !== 'helplines') return renderLanding();
    if (tab === 'chat') return renderChat();
    if (tab === 'helplines') return renderHelplines();
    return renderInfo();
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
      <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
        <div className="bg-[#FAF8F4] rounded-[2rem] overflow-hidden flex flex-col h-[620px]">
          <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-medium text-[#111111]/60">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-[8px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded uppercase font-bold">
              {sessionId}
            </span>
          </div>
          <div className="px-5 pb-3 border-b border-[#111111]/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111111] leading-tight">The Bench</div>
                <div className="text-[9px] text-[#111111]/40 font-mono">Confidential support</div>
              </div>
            </div>
            <Lock className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">{renderContent()}</div>
          </div>
          <div className="border-t border-[#111111]/10 bg-white">
            <div className="grid grid-cols-3">
              {[
                { id: 'chat' as Tab, Icon: MessageCircle, l: 'Chat' },
                { id: 'helplines' as Tab, Icon: Phone, l: 'Helplines' },
                { id: 'info' as Tab, Icon: Info, l: 'Info' },
              ].map(t => {
                const I = t.Icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={'py-2.5 flex flex-col items-center gap-0.5 ' + (active ? 'text-purple-600' : 'text-[#111111]/40')}
                  >
                    <I className="w-4 h-4" />
                    <span className="text-[9px] font-medium">{t.l}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="p-4 bg-white border border-[#111111]/15 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Isolation View
            </h3>
            <button
              onClick={() => setShowServer(!showServer)}
              className="text-[10px] text-purple-600 hover:underline flex items-center gap-1"
            >
              {showServer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showServer ? 'Hide' : 'Reveal'}
            </button>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[#111111]/10 font-mono text-[10px]">
            <div className="flex justify-between"><span className="text-[#111111]/50">System</span><span className="font-bold text-purple-700">Bench (isolated)</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Shared identifiers</span><span className="font-bold text-rose-600">0</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Linked tokens</span><span className="font-bold text-rose-600">NONE</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Linked records</span><span className="font-bold text-rose-600">NONE</span></div>
            <div className="flex justify-between border-t border-[#111111]/10 pt-1.5 mt-1.5"><span className="text-[#111111]/50">Main-system records</span><span className="text-[#111111] font-bold">{mainSystemRecords}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Bench records</span><span className="text-[#111111] font-bold">0</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Helplines loaded</span><span className="text-[#111111] font-bold">{helplines.length}</span></div>
          </div>
          {showServer && (
            <div className="p-2 bg-purple-50 border border-purple-200 rounded text-[9px] text-purple-900 leading-relaxed mt-2">
              <strong>Architectural invariant:</strong> production runs The Bench on separate infrastructure with a separate database. No API path to Swap, Pool, or Donor tables.
            </div>
          )}
        </div>

        <div className="p-4 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl space-y-1.5">
          <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">Spec Coverage</h4>
          {[
            'Separate system & data store (4.9)',
            'No shared identifiers (4.9)',
            'Confidential peer support (4.9)',
            'Helpline signposting (4.9)',
            'Not on Discord / general chat (4.9)',
            'Non-conditional access (4.9)',
          ].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111111]/70">
              <div className="w-1 h-1 rounded-full bg-purple-600" /> {f}
            </div>
          ))}
        </div>

        <button
          onClick={reset}
          className="w-full py-2 text-xs text-[#111111]/60 hover:text-[#111111] border border-[#111111]/15 rounded-lg bg-white flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" /> Reset Simulator
        </button>
      </div>
    </div>
  );
};