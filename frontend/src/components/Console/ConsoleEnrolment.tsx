import React from 'react';
import { ShieldAlert, Users } from 'lucide-react';

  const ConsoleEnrolment: React.FC = () => (
    <div className="p-4 space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl"><div className="font-bold text-blue-900 flex items-center gap-1 text-[12px]"><ShieldAlert className="w-4 h-4" /> No payment access</div><p className="text-[11px] text-blue-900/80 mt-1 leading-relaxed">Enrolment monitors intake velocity only. Zero request details visible.</p></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl"><div className="text-[10px] font-mono uppercase text-[#111111]/50">Tokens Today</div><div className="font-mono text-xl font-bold text-[#1F6B4A] mt-1">384</div></div>
        <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl"><div className="text-[10px] font-mono uppercase text-[#111111]/50">Rate-Limit Hits</div><div className="font-mono text-xl font-bold text-amber-700 mt-1">42</div></div>
      </div>
      <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-1"><div className="text-[10px] font-mono uppercase text-[#111111]/50">Active Salt</div><div className="font-mono text-sm font-bold text-[#111111]">SHA256-WK43</div><div className="text-[10px] text-[#111111]/40 font-mono">Rotates Mon 00:01 EAT</div></div>
      <div className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-2"><div className="text-[11px] font-semibold uppercase text-[#111111]">Channels Today</div>{[{ l: 'Web', p: 54, c: 'bg-[#1F6B4A]' }, { l: 'SMS', p: 31, c: 'bg-blue-600' }, { l: 'USSD', p: 15, c: 'bg-amber-600' }].map(r => (<div key={r.l} className="space-y-1"><div className="flex justify-between text-[11px] font-mono"><span>{r.l}</span><span className="font-bold">{r.p}%</span></div><div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className={'h-full ' + r.c} style={{ width: r.p + '%' }} /></div></div>))}</div>
      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl flex items-start gap-2"><Users className="w-4 h-4 text-[#111111]/40 shrink-0 mt-0.5" /><span className="text-[11px] text-[#111111]/60">Can refer to The Bench, but cannot see request content.</span></div>
    </div>
  );

export default ConsoleEnrolment;
