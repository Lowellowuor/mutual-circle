import React from 'react';
import { useApp } from '../../context/AppContext';
import { RequesterChannel } from '../../types';
import { Globe, MessageSquare, PhoneCall, ArrowRight, Shield } from 'lucide-react';
import { UssdSimulator } from './UssdSimulator';
import { SmsSimulator } from './SmsSimulator';

export const ChannelChooser: React.FC = () => {
  const { requesterChannel, setRequesterChannel, setRequesterScreen } = useApp();

  const channels: { id: RequesterChannel; title: string; subtitle: string; tag: string; icon: React.ReactNode }[] = [
    {
      id: 'web',
      title: 'Web Application',
      subtitle: 'Fast browser interface with live institutional verification and direct locker reservation.',
      tag: 'Browser',
      icon: <Globe className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
    },
    {
      id: 'sms',
      title: 'SMS Gateway ([Placeholder SMS shortcode])',
      subtitle: 'Simple two-way texting for low-connectivity environments and single-use PIN delivery.',
      tag: 'SMS Shortcode',
      icon: <MessageSquare className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
    },
    {
      id: 'ussd',
      title: 'USSD Menu ([Placeholder USSD code])',
      subtitle: 'Zero data needed. Works on any basic feature phone via live session dialer.',
      tag: 'Offline Basic Phone',
      icon: <PhoneCall className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Step Header */}
      <div>
        <button
          onClick={() => setRequesterScreen('home')}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer"
        >
          â† Back to Home
        </button>
        <h2 className="font-serif text-2xl font-bold text-[#111111]">Choose your channel</h2>
        <p className="text-xs sm:text-sm text-[#111111]/70 mt-1">
          Access The Mutual Circle on SMS, high-speed web, SMS, or zero-data USSD basic phones.
        </p>
      </div>

      {/* Channel Cards */}
      <div className="space-y-3">
        {channels.map(channel => {
          const isSelected = requesterChannel === channel.id;
          return (
            <div
              key={channel.id}
              onClick={() => setRequesterChannel(channel.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#1F6B4A] shadow-sm ring-1 ring-[#1F6B4A]'
                  : 'bg-white/80 border-[#111111]/15 hover:border-[#111111]/30 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-[#DCE8E0]/70 shrink-0 mt-0.5">
                    {channel.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#111111]">{channel.title}</span>
                      <span className="text-[10px] font-mono bg-[#FAF8F4] text-[#111111]/70 px-2 py-0.5 rounded border border-[#111111]/10">
                        {channel.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#111111]/70 leading-relaxed">
                      {channel.subtitle}
                    </p>
                  </div>
                </div>

                <input
                  type="radio"
                  name="channel"
                  checked={isSelected}
                  onChange={() => setRequesterChannel(channel.id)}
                  className="w-4 h-4 text-[#1F6B4A] focus:ring-[#1F6B4A] mt-1 shrink-0 accent-[#1F6B4A] cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Simulator Embed for USSD or SMS */}
      {requesterChannel === 'ussd' && (
        <div className="pt-2">
          <div className="mb-2 text-xs font-semibold text-[#1F6B4A] flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Interactive USSD Session Simulator ([Placeholder USSD code])</span>
          </div>
          <UssdSimulator />
        </div>
      )}

      {requesterChannel === 'sms' && (
        <div className="pt-2">
          <div className="mb-2 text-xs font-semibold text-[#1F6B4A] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Interactive SMS Gateway Simulator ([Placeholder SMS shortcode])</span>
          </div>
          <SmsSimulator />
        </div>
      )}

      {/* Proceed with Web */}
      {requesterChannel === 'web' && (
        <div className="pt-2 space-y-3">
          <button
            onClick={() => setRequesterScreen('verification')}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <span>Continue with Web Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 text-xs text-[#111111]/60 justify-center">
            <Shield className="w-3.5 h-3.5 text-[#1F6B4A]" />
            <span>No account registration or password required</span>
          </div>
        </div>
      )}

    </div>
  );
};

