import React from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, HeartHandshake, GitFork, Users, BookOpen, CreditCard, ArrowRight, Sparkles, Banknote } from 'lucide-react';

export const Phase2Cards: React.FC = () => {
  const { setSurface } = useApp();

  return (
    <div className="space-y-3 pt-4 border-t border-[#111111]/10">
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#111111]">Phase 2 Features</h3>
          <p className="text-xs text-[#111111]/60">Explore interactive prototypes of next-generation circle capabilities</p>
        </div>
        <button
          onClick={() => setSurface('phase2')}
          className="text-xs font-semibold text-[#1F6B4A] hover:text-[#18553a] inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Open Full Interactive Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        
        {/* Module 1: General Cash Support */}
        <div 
          onClick={() => setSurface('phase2')}
          className="p-4 rounded-xl bg-white border border-[#111111]/10 hover:border-[#1F6B4A] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-[#DCE8E0] text-[#1F6B4A] group-hover:bg-[#1F6B4A] group-hover:text-white transition-colors">
              <Banknote className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Interactive Simulator</span>
            </span>
          </div>
          <h4 className="font-serif text-sm font-bold text-[#111111] mt-2 group-hover:text-[#1F6B4A] transition-colors">
            General Cash Support
          </h4>
          <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
            Micro-liquidity transfers via blind M-Pesa pools. Regulated under POCAMLA.
          </p>
        </div>

        {/* Module 2: The Match */}
        <div 
          onClick={() => setSurface('phase2')}
          className="p-4 rounded-xl bg-white border border-[#111111]/10 hover:border-[#1F6B4A] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-[#DCE8E0] text-[#1F6B4A] group-hover:bg-[#1F6B4A] group-hover:text-white transition-colors">
              <GitFork className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Interactive Simulator</span>
            </span>
          </div>
          <h4 className="font-serif text-sm font-bold text-[#111111] mt-2 group-hover:text-[#1F6B4A] transition-colors">
            The Match
          </h4>
          <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
            Direct algorithmic matching between commercial bulk suppliers and locker capacity.
          </p>
        </div>

        {/* Module 3: Retailer Digital Voucher */}
        <div 
          onClick={() => setSurface('phase2')}
          className="sm:col-span-2 p-4 rounded-xl bg-white border border-[#111111]/10 hover:border-[#1F6B4A] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#DCE8E0] text-[#1F6B4A]">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#111111]">Gift-Card Options (Minority Fallback)</h4>
                <span className="text-[10px] font-mono text-[#111111]/50">Retailer Digital POS Till Integration</span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
              Unconfirmed Provider
            </span>
          </div>
          <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
            Fallback for locations without lockers. Depends on gift-card providers carrying Kenyan merchants (unconfirmed).
          </p>
        </div>

        {/* Module 4: The Bench */}
        <div className="sm:col-span-2 p-4 rounded-xl bg-[#F6F4EE] border border-[#111111]/15 space-y-2 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#DCE8E0] text-[#1F6B4A]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#111111]">The Bench (Confidential Peer Support)</h4>
                <span className="text-[10px] font-mono text-[#111111]/50">Separate External System</span>
              </div>
            </div>
            <button
              onClick={() => setSurface('phase2')}
              className="text-[10px] font-mono uppercase bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold hover:bg-purple-200 cursor-pointer"
            >
              Open Sanctuary â†’
            </button>
          </div>

          <p className="text-xs text-[#111111]/75 leading-relaxed">
            Independent listening space with zero connection to the resource pool. Non-conditional access.
          </p>

          {/* Mandatory Helpline Placeholder Rule */}
          <div className="p-3 bg-white rounded-lg border border-[#111111]/10 text-xs text-[#111111]/80 space-y-1">
            <div className="font-semibold text-[#1F6B4A] flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Immediate Helpline Signposting</span>
            </div>
            <div className="font-mono text-xs text-[#111111]/70 font-bold">
              [Helpline numbers supplied by programme team]
            </div>
            <div className="text-[11px] text-[#111111]/50">
              Free, confidential 24/7 toll-free listening lines across Kenya.
            </div>
          </div>
        </div>

        {/* Module 5: Tamper-Evident Ledger */}
        <div 
          onClick={() => setSurface('phase2')}
          className="sm:col-span-2 p-4 rounded-xl bg-white border border-[#111111]/10 hover:border-[#1F6B4A] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-[#DCE8E0] text-[#1F6B4A]">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Block Explorer Simulator</span>
            </span>
          </div>
          <h4 className="font-serif text-sm font-bold text-[#111111] mt-2 group-hover:text-[#1F6B4A] transition-colors">
            Tamper-Evident Ledger (Phase 2)
          </h4>
          <p className="text-xs text-[#111111]/70 mt-1 leading-relaxed">
            Internal, tamper-evident record with deduplication and aggregate reporting. Public recognition list is aggregate and non-identifying.
          </p>
        </div>

      </div>

    </div>
  );
};

