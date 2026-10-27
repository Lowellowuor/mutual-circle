import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Send, 
  CheckCheck, 
  Phone, 
  MoreVertical, 
  ShieldCheck, 
  Package, 
  ReceiptText, 
  HelpCircle, 
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  quickActions?: { label: string; actionId: string }[];
}

export const WhatsAppSimulator: React.FC = () => {
  const { bundles, requests, addSwapRequest, addPoolRequest } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'wa-1',
      sender: 'bot',
      text: 'Habari! Welcome to *The Mutual Circle* (Nairobi) 🇰🇪.\n\nA private resource-sharing network. No names, no queues, no disclosure of need.\n\nHow can we support you today?',
      time: '09:00',
      quickActions: [
        { label: '📦 1. Reserve Locker Bundle', actionId: 'swap' },
        { label: '⚡ 2. Settle Utility / Tuition', actionId: 'pool' },
        { label: '🔍 3. Track Active Request', actionId: 'status' },
        { label: '🛡️ 4. Data Privacy', actionId: 'privacy' }
      ]
    }
  ]);

  const [inputVal, setInputVal] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const lower = text.toLowerCase();

      let replyMsg: ChatMessage;

      if (lower.includes('swap') || lower.includes('1') || lower.includes('reserve') || lower.includes('bundle') || lower.includes('pantry') || lower.includes('hygiene')) {
        const bundle = lower.includes('hygiene') ? bundles[1] : bundles[0];
        const newReq = addSwapRequest(bundle);

        replyMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `✅ *Reservation Confirmed!*\n\n• Package: *${bundle.name}*\n• Hub: *${bundle.lockerLocation}*\n• Compartment: *${newReq.objectIdMasked || 'Box 14'}*\n• Single-Use PIN: *${newReq.pinCode || '8341'}*\n\n🔒 *Privacy Note:* Collect at your convenience. No countdown timer. Staff cannot see who collects.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '🔍 View Request Details', actionId: 'status' },
            { label: '⚡ Settle a Bill', actionId: 'pool' },
            { label: '🏠 Main Menu', actionId: 'menu' }
          ]
        };
      } else if (lower.includes('pool') || lower.includes('2') || lower.includes('bill') || lower.includes('water') || lower.includes('kplc') || lower.includes('tuition')) {
        replyMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `⚡ *The Pool: Institutional Settlement*\n\nFunds are disbursed directly to institutional utility & school accounts. Zero cash is sent to your phone.\n\nChoose an account to clear:`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '💡 KPLC Power (KES 1,500)', actionId: 'pool_kplc' },
            { label: '💧 Nairobi Water (KES 2,200)', actionId: 'pool_water' },
            { label: '🎓 Secondary School Term Fees', actionId: 'pool_school' },
            { label: '🏠 Main Menu', actionId: 'menu' }
          ]
        };
      } else if (lower.includes('kplc') || lower.includes('water') || lower.includes('school')) {
        const isKplc = lower.includes('kplc');
        const req = addPoolRequest({
          category: isKplc ? 'utility' : 'school',
          subType: isKplc ? 'KPLC Prepaid Electricity' : 'Nairobi Water (NCWSC)',
          objectId: isKplc ? '3719024819' : '90218841',
          amount: isKplc ? 1500 : 2200
        });

        replyMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `✅ *Payment Submitted to Partner!*\n\n• Reference: *${req.id}*\n• Account: *${isKplc ? 'KPLC Meter #3719024819' : 'Water Acc #90218841'}*\n• Settlement Amount: *KES ${req.amount.toLocaleString()}*\n• Status: *Submitted to Payment Partner*\n\nFunds are settled directly to the institutional ledger. Your identity is completely protected.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '🔍 Check Status', actionId: 'status' },
            { label: '📦 Reserve Locker Bundle', actionId: 'swap' },
            { label: '🏠 Main Menu', actionId: 'menu' }
          ]
        };
      } else if (lower.includes('status') || lower.includes('3') || lower.includes('track')) {
        const topReq = requests[0];
        if (topReq) {
          replyMsg = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `📋 *Your Latest Request*\n\n• Ref: *${topReq.id}*\n• Item: *${topReq.categoryTitle}*\n• Status: *${topReq.status.toUpperCase()}*\n• Time: *${topReq.timestamp}*\n\n${topReq.pinCode ? `🔑 Locker PIN: *${topReq.pinCode}* (Westlands Hub)` : 'Institutional settlement processed with payment partner.'}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: [
              { label: '📦 Reserve Another Bundle', actionId: 'swap' },
              { label: '⚡ Pay Another Bill', actionId: 'pool' },
              { label: '🏠 Main Menu', actionId: 'menu' }
            ]
          };
        } else {
          replyMsg = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `You have no active requests currently.\n\nTap below to reserve a smart locker bundle or settle an institutional utility bill:`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: [
              { label: '📦 Reserve Locker Bundle', actionId: 'swap' },
              { label: '⚡ Settle Utility Bill', actionId: 'pool' }
            ]
          };
        }
      } else if (lower.includes('privacy') || lower.includes('4') || lower.includes('data')) {
        replyMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `🛡️ *The Mutual Circle Privacy Invariant*\n\n• Zero names, addresses or clinical details asked or stored.\n• A private, keyed one-way token keeps the circle fair.\n• Staff and donors see no identity data.\n• Phone numbers stored encrypted in a separate store for automated PIN delivery only.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '📦 Reserve Locker Bundle', actionId: 'swap' },
            { label: '⚡ Settle Bill or Tuition', actionId: 'pool' },
            { label: '🏠 Main Menu', actionId: 'menu' }
          ]
        };
      } else {
        replyMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Here is the main menu for *The Mutual Circle* (Nairobi):\n\nReply with a number or tap an option below:`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '📦 1. Reserve Locker Bundle', actionId: 'swap' },
            { label: '⚡ 2. Settle Utility / Tuition', actionId: 'pool' },
            { label: '🔍 3. Track Active Request', actionId: 'status' },
            { label: '🛡️ 4. Data Privacy', actionId: 'privacy' }
          ]
        };
      }

      setMessages(prev => [...prev, replyMsg]);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'wa-1',
        sender: 'bot',
        text: 'Habari! Welcome to *The Mutual Circle* (Nairobi) 🇰🇪.\n\nA private resource-sharing network. No names, no queues, no disclosure of need.\n\nHow can we support you today?',
        time: '09:00',
        quickActions: [
          { label: '📦 1. Reserve Locker Bundle', actionId: 'swap' },
          { label: '⚡ 2. Settle Utility / Tuition', actionId: 'pool' },
          { label: '🔍 3. Track Active Request', actionId: 'status' },
          { label: '🛡️ 4. Data Privacy', actionId: 'privacy' }
        ]
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[520px] bg-[#EFEAE2] rounded-2xl overflow-hidden border border-[#111111]/20 shadow-md">
      
      {/* WhatsApp Top Header Bar */}
      <div className="bg-[#075E54] text-white px-3.5 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-white border border-white/20">
            <span className="text-xs">MC</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm tracking-tight">The Mutual Circle Bot</span>
              <span className="bg-emerald-400 text-black text-[9px] font-bold px-1 rounded-full">✓</span>
            </div>
            <div className="text-[11px] text-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>online · Official WhatsApp Channel</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/90">
          <button
            onClick={handleResetChat}
            className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer transition-colors"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WhatsApp Chat Message Feed */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 font-sans text-xs">
        
        {/* Security / Encryption Banner */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#FFF4C7] text-[#54656F] text-[10px] px-3 py-1 rounded-lg shadow-2xs border border-amber-200/50 max-w-[90%]">
            <Lock className="w-3 h-3 text-amber-700 shrink-0" />
            <span>Messages are private. No names or personal data are stored in this network.</span>
          </div>
        </div>

        {messages.map(msg => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 shadow-2xs whitespace-pre-wrap leading-relaxed ${
                  isBot 
                    ? 'bg-white text-[#111111] rounded-tl-xs border border-black/5' 
                    : 'bg-[#DCF8C6] text-[#111111] rounded-tr-xs border border-emerald-200'
                }`}
              >
                <div>{msg.text}</div>
                <div className="text-[10px] text-[#111111]/45 mt-1 flex items-center justify-end gap-1">
                  <span>{msg.time}</span>
                  {!isBot && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                </div>
              </div>

              {/* Bot Quick Actions / Chips */}
              {isBot && msg.quickActions && msg.quickActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[92%]">
                  {msg.quickActions.map(action => (
                    <button
                      key={action.actionId}
                      onClick={() => handleSend(action.label)}
                      className="bg-white hover:bg-[#FAF8F4] active:bg-[#DCE8E0] text-[#075E54] border border-[#075E54]/30 font-medium text-[11px] px-2.5 py-1.5 rounded-full shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-3 h-3 text-[#075E54]/60" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1.5 bg-white text-[#111111]/60 px-3 py-2 rounded-lg w-20 shadow-2xs text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
      </div>

      {/* WhatsApp Input Box */}
      <form 
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="bg-[#F0F2F5] p-2 sm:p-2.5 flex items-center gap-2 border-t border-black/10 shrink-0"
      >
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Type a message (e.g. 'Swap', 'Pool', 'PIN')..."
          className="flex-1 bg-white border border-black/10 rounded-full px-4 py-2 text-xs text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#075E54] shadow-2xs"
        />

        <button
          type="submit"
          className="w-9 h-9 rounded-full bg-[#075E54] hover:bg-[#064e46] text-white flex items-center justify-center cursor-pointer shadow-xs transition-colors shrink-0"
          aria-label="Send WhatsApp message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>

    </div>
  );
};
