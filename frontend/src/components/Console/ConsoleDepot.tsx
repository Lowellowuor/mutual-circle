import React from 'react';
import { Boxes, Package, Check, Layers, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

  const ConsoleDepot: React.FC = () => {
  const { depotCounts, lockerStocks } = useApp();
  return (
    <div className="p-4 md:p-6 max-w-[1120px] mx-auto content-in">
      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl"><div className="font-semibold text-[#1F6B4A] flex items-center gap-1 text-[12px]"><Boxes className="w-4 h-4" /> Depot Pipeline</div><p className="text-[11px] text-[#111111]/60 mt-1">Bulk ? inspected ? packed ? loaded.</p></div>
      <div className="grid grid-cols-2 gap-2">
        {[{ Icon: Package, l: 'Received', v: depotCounts.receivedUnits, c: 'text-[#111111]' }, { Icon: Check, l: 'Checked', v: depotCounts.qualityCheckedUnits, c: 'text-[#1F6B4A]' }, { Icon: Layers, l: 'Packed', v: depotCounts.packedBundles, c: 'text-[#111111]' }, { Icon: Truck, l: 'Loaded', v: depotCounts.loadedLockerUnits, c: 'text-emerald-700' }].map(row => {
          const I = row.Icon;
          return (<div key={row.l} className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl"><div className="flex items-center gap-1 text-[11px] uppercase font-mono text-[#111111]/50"><I className="w-3 h-3" />{row.l}</div><div className={'font-mono text-xl font-bold mt-1 ' + row.c}>{row.v}</div></div>);
        })}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center"><h3 className="text-[11px] font-mono uppercase font-bold text-[#111111]/60">Locker Stock</h3><span className="text-[11px] font-mono text-[#111111]/40">Low &lt; 5</span></div>
        {lockerStocks.map((s, i) => {
          const low = s.available <= s.lowStockThreshold;
          return (
            <div key={i} className={'p-3 rounded-lg border ' + (low ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#111111]/10')}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1"><div className="text-[12px] font-semibold text-[#111111] truncate">{s.location}</div><div className="text-[11px] font-mono text-[#111111]/50 truncate">{s.bundleType}</div></div>
                <div className="text-right shrink-0"><div className="font-mono text-xs font-bold text-[#111111]">{s.available}<span className="text-[#111111]/40">/{s.capacity}</span></div>{low && <div className="text-[10px] font-mono text-amber-700 uppercase font-bold">Low</div>}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    );
};

export default ConsoleDepot;
