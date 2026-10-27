import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Lock, 
  HeartHandshake, 
  GitFork, 
  Users, 
  BookOpen, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RefreshCw,
  MessageSquare,
  Heart,
  ExternalLink,
  Barcode,
  Search,
  Check
} from 'lucide-react';

export const Phase2Hub: React.FC = () => {
  const { setSurface, setRequesterScreen } = useApp();

  const [activeTab, setActiveTab] = useState<'cash' | 'match' | 'bench' | 'ledger' | 'voucher'>('cash');

  // Cash Support state
  const [cashAmount, setCashAmount] = useState<number>(1000);
  const [cashStep, setCashStep] = useState<'choose' | 'submitted'>('choose');
  const [cashTxn, setCashTxn] = useState<string>('');

  // The Match state
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [matched, setMatched] = useState<boolean>(false);

  // The Bench state
  const [benchNotes, setBenchNotes] = useState<string[]>([
    'Tuko pamoja. We walk this Nairobi path together.',
    'Breathe easy today. The circle is here to support you without questions.',
    'Strength to every parent striving for school fees this term.'
  ]);
  const [newNote, setNewNote] = useState<string>('');
  const [breathActive, setBreathActive] = useState<boolean>(false);

  // Ledger state
  const [ledgerVerified, setLedgerVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Voucher state
  const [voucherScanned, setVoucherScanned] = useState<boolean>(false);

  const handleCashSubmit = () => {
    setCashTxn(`MPESA-B2C-${Math.floor(10000 + Math.random() * 90000)}`);
    setCashStep('submitted');
  };

  const handleRunMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      setMatched(true);
    }, 700);
  };

  const handleAddBenchNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setBenchNotes([newNote.trim(), ...benchNotes]);
    setNewNote('');
  };

  const handleVerifyLedger = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setLedgerVerified(true);
    }, 800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-[#DCE8E0] to-[#FAF8F4] border border-[#1F6B4A]/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-[#1F6B4A] text-white px-2 py-0.5 rounded font-bold">
              Interactive Prototype
            </span>
            <span className="text-xs font-mono text-[#1F6B4A]">Phase 2 Architecture</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            Phase 2 Features
          </h1>
          <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
            Functional working prototypes of future modules: cash liquidity, supply-matching, peer sanctuary, ledger verifier &amp; vouchers.
          </p>
        </div>

        <button
          onClick={() => { setSurface('requester'); setRequesterScreen('home'); }}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-black/5 text-[#111111] text-xs font-medium rounded-xl border border-[#111111]/20 cursor-pointer transition-colors"
        >
          ← Return to Requester App
        </button>
      </div>

      {/* Feature Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 text-xs font-medium border-b border-[#111111]/10">
        <button
          onClick={() => setActiveTab('cash')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cash' 
              ? 'bg-[#1F6B4A] text-white font-semibold shadow-xs' 
              : 'bg-white text-[#111111]/70 hover:text-[#111111] border border-[#111111]/15'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>General Cash Support</span>
        </button>

        <button
          onClick={() => setActiveTab('match')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'match' 
              ? 'bg-[#1F6B4A] text-white font-semibold shadow-xs' 
              : 'bg-white text-[#111111]/70 hover:text-[#111111] border border-[#111111]/15'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>The Match (Supply Engine)</span>
        </button>

        <button
          onClick={() => setActiveTab('bench')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bench' 
              ? 'bg-[#1F6B4A] text-white font-semibold shadow-xs' 
              : 'bg-white text-[#111111]/70 hover:text-[#111111] border border-[#111111]/15'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>The Bench (Sanctuary)</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ledger' 
              ? 'bg-[#1F6B4A] text-white font-semibold shadow-xs' 
              : 'bg-white text-[#111111]/70 hover:text-[#111111] border border-[#111111]/15'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Tamper-Evident Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('voucher')}
          className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'voucher' 
              ? 'bg-[#1F6B4A] text-white font-semibold shadow-xs' 
              : 'bg-white text-[#111111]/70 hover:text-[#111111] border border-[#111111]/15'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Retailer Voucher Fallback</span>
        </button>
      </div>

      {/* 1. GENERAL CASH SUPPORT (MICRO-LIQUIDITY) */}
      {activeTab === 'cash' && (
        <div className="bg-white rounded-2xl border border-[#111111]/15 p-6 space-y-6 shadow-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#111111]/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#1F6B4A] uppercase font-bold">
                <Banknote className="w-4 h-4" />
                <span>Micro-Liquidity Transfer Module</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#111111] mt-1">
                General Cash Support
              </h2>
              <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
                Blind M-Pesa pooled disbursement for essential household flexibility. Disbursed via regulated payment partner.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-semibold shrink-0">
              POCAMLA Aligned
            </span>
          </div>

          {cashStep === 'choose' ? (
            <div className="space-y-5 max-w-lg">
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                  Select Micro-Support Allocation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setCashAmount(1000)}
                    className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                      cashAmount === 1000 
                        ? 'border-[#1F6B4A] bg-[#DCE8E0]/30 shadow-xs' 
                        : 'border-[#111111]/15 hover:border-[#111111]/30'
                    }`}
                  >
                    <div className="font-mono text-xl font-bold text-[#111111]">KES 1,000</div>
                    <div className="text-[11px] text-[#111111]/60 mt-1">Emergency Transport / Medicine</div>
                  </div>

                  <div
                    onClick={() => setCashAmount(2500)}
                    className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                      cashAmount === 2500 
                        ? 'border-[#1F6B4A] bg-[#DCE8E0]/30 shadow-xs' 
                        : 'border-[#111111]/15 hover:border-[#111111]/30'
                    }`}
                  >
                    <div className="font-mono text-xl font-bold text-[#111111]">KES 2,500</div>
                    <div className="text-[11px] text-[#111111]/60 mt-1">Household Liquidity Buffer</div>
                  </div>
                </div>
              </div>

              {/* Dignified Privacy Note */}
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/80 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#1F6B4A]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Privacy &amp; Payment Invariant</span>
                </div>
                <p className="leading-relaxed">
                  No name or clinical information is requested. Disbursements are submitted directly to the payment partner (Safaricom institution-payment product, unconfirmed) who moves funds directly to the registered SIM. LumiereCore accounts hold no funds.
                </p>
                <div className="text-[11px] text-[#111111]/60 font-mono">
                  Quota constraint: 1 allocation per rolling 14-day cycle to keep the circle fair.
                </div>
              </div>

              <button
                onClick={handleCashSubmit}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>Submit to Payment Partner for Cash Transfer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md p-6 rounded-2xl bg-[#DCE8E0]/30 border border-[#1F6B4A]/30 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 bg-[#1F6B4A] text-white rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Transfer Submitted to Payment Partner
              </h3>
              <p className="text-xs text-[#111111]/70 leading-relaxed">
                Your allocation of <strong className="text-[#111111]">KES {cashAmount.toLocaleString()}</strong> has been submitted to the shortcode holder.
              </p>
              <div className="p-3 bg-white rounded-xl border border-[#111111]/10 font-mono text-xs text-[#111111] space-y-1">
                <div>Partner Reference: {cashTxn}</div>
                <div className="text-emerald-800 font-semibold">Status: Submitted to Payment Partner</div>
              </div>
              <button
                onClick={() => setCashStep('choose')}
                className="py-2.5 px-4 bg-white hover:bg-black/5 text-[#111111] text-xs font-semibold rounded-xl border border-[#111111]/20 cursor-pointer"
              >
                Test Another Allocation
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. THE MATCH (SUPPLY-TO-NEED MATCHING ENGINE) */}
      {activeTab === 'match' && (
        <div className="bg-white rounded-2xl border border-[#111111]/15 p-6 space-y-6 shadow-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#111111]/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#1F6B4A] uppercase font-bold">
                <GitFork className="w-4 h-4" />
                <span>Automated Allocation Algorithm</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#111111] mt-1">
                The Match: Supply-to-Need Optimization
              </h2>
              <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
                Directly matches commercial surplus and agricultural suppliers with depleted smart locker hubs across Nairobi.
              </p>
            </div>
            <button
              onClick={handleRunMatch}
              disabled={isMatching}
              className="py-2 px-4 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white text-xs font-medium flex items-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMatching ? 'animate-spin' : ''}`} />
              <span>{isMatching ? 'Optimizing Matches...' : 'Run Live Matching Engine'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Supplier Inventory Pool */}
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-3">
              <span className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                1. Available Supplier Wholesale Batches
              </span>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-lg border border-[#111111]/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#111111] block">Nairobi Grain Millers</span>
                    <span className="text-[#111111]/60 text-[11px]">240 bundles unga maize flour &amp; rice</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">Ready</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#111111]/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#111111] block">CleanCare Kenya (Athi River)</span>
                    <span className="text-[#111111]/60 text-[11px]">180 hygiene soap &amp; sanitizer packs</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">Ready</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#111111]/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#111111] block">Central Cooperative (Produce)</span>
                    <span className="text-[#111111]/60 text-[11px]">150 fresh dry pulse sacks (beans)</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">Ready</span>
                </div>
              </div>
            </div>

            {/* Right: Locker Hub Demand & Automated Match */}
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-3">
              <span className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                2. Live Hub Capacity &amp; Deficit Needs
              </span>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-lg border border-[#111111]/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#111111] block">Kasarani Station Locker</span>
                    <span className="text-[#111111]/60 text-[11px]">Stock: 6 available / 30 capacity</span>
                  </div>
                  <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Need: +24 Bundles
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#111111]/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#111111] block">CBD Locker Exchange</span>
                    <span className="text-[#111111]/60 text-[11px]">Stock: 4 available / 20 capacity</span>
                  </div>
                  <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Need: +16 Bundles
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#111111]/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#111111] block">Westlands Locker Hub</span>
                    <span className="text-[#111111]/60 text-[11px]">Stock: 14 available / 24 capacity</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Adequate
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Match Execution Card */}
          {matched && (
            <div className="p-4 rounded-xl bg-[#DCE8E0]/40 border border-[#1F6B4A]/30 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F6B4A]">
                <Truck className="w-4 h-4" />
                <span>Algorithmic Matching Solution Generated</span>
              </div>
              <div className="text-xs text-[#111111]/80 space-y-1 font-mono">
                <div>• Dispatch Route A: Nairobi Grain Millers → Kasarani Station Locker (+24 Pantry Bundles)</div>
                <div>• Dispatch Route B: CleanCare Kenya → CBD Locker Exchange (+16 Hygiene Bundles)</div>
                <div className="text-emerald-800 font-semibold">Status: Automated logistics order issued to neutral courier partner.</div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. THE BENCH (CONFIDENTIAL PEER SANCTUARY) */}
      {activeTab === 'bench' && (
        <div className="bg-white rounded-2xl border border-[#111111]/15 p-6 space-y-6 shadow-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#111111]/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#1F6B4A] uppercase font-bold">
                <Users className="w-4 h-4" />
                <span>Separate External Subsystem</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#111111] mt-1">
                The Bench: Confidential Peer Solidarity
              </h2>
              <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
                An independent listening space. Non-conditional access with zero connection to resource allocation.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2.5 py-1 rounded-full font-semibold shrink-0">
              Zero Payment Links
            </span>
          </div>

          {/* Mandatory Helpline Signpost Banner */}
          <div className="p-4 bg-[#FAF8F4] rounded-xl border border-[#111111]/15 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F6B4A]">
              <HeartHandshake className="w-4 h-4" />
              <span>Immediate Professional &amp; Toll-Free Signposting</span>
            </div>
            <div className="font-mono text-xs text-[#111111] font-bold">
              [Helpline numbers supplied by programme team]
            </div>
            <p className="text-xs text-[#111111]/70 leading-relaxed">
              Toll-free 24/7 confidential listening helplines across Kenya. Available in Swahili and English from any mobile phone.
            </p>
          </div>

          {/* Interactive Feature: Solidarity Wall */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[#111111]">
                Words of Community Solidarity
              </h3>
              <button
                onClick={() => setBreathActive(!breathActive)}
                className="text-xs text-[#1F6B4A] hover:underline font-medium cursor-pointer"
              >
                {breathActive ? 'Hide Breathing Guide' : 'Open 30s Grounding Breath'}
              </button>
            </div>

            {breathActive && (
              <div className="p-6 bg-[#DCE8E0]/40 rounded-xl text-center space-y-2 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center mx-auto animate-pulse">
                  <Heart className="w-7 h-7" />
                </div>
                <div className="font-serif font-bold text-sm text-[#111111]">
                  Inhale for 4s &bull; Hold for 4s &bull; Exhale for 4s
                </div>
                <div className="text-[11px] text-[#111111]/60">Take a moment to pause. You are safe here.</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {benchNotes.map((note, idx) => (
                <div key={idx} className="p-3.5 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl text-xs text-[#111111]/80 space-y-1">
                  <p className="italic leading-relaxed">&ldquo;{note}&rdquo;</p>
                  <span className="text-[10px] font-mono text-[#111111]/40 block text-right">— Neighbor in the Circle</span>
                </div>
              ))}
            </div>

            {/* Post anonymous note */}
            <form onSubmit={handleAddBenchNote} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Leave an anonymous word of encouragement for others in Nairobi..."
                className="flex-1 bg-[#FAF8F4] border border-[#111111]/20 rounded-xl px-4 py-2.5 text-xs text-[#111111] focus:ring-1 focus:ring-[#1F6B4A] focus:outline-none"
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white text-xs font-semibold cursor-pointer"
              >
                Post Note
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. TAMPER-EVIDENT LEDGER (BLOCK EXPLORER) */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-[#111111]/15 p-6 space-y-6 shadow-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#111111]/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#1F6B4A] uppercase font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Auditable Append-Only Ledger</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#111111] mt-1">
                Tamper-Evident Ledger Verifier
              </h2>
              <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
                Internal, tamper-evident record with deduplication and aggregate fund solvency. Zero requester identities are exposed.
              </p>
            </div>

            <button
              onClick={handleVerifyLedger}
              disabled={isVerifying}
              className="py-2 px-4 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white text-xs font-medium flex items-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Checking Proofs...' : 'Verify Merkle Proofs'}</span>
            </button>
          </div>

          {ledgerVerified && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Ledger Integrity Attested: All block Merkle hashes match the published aggregate fund solvency roots. Zero tampered entries detected.</span>
            </div>
          )}

          {/* Block Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 uppercase text-[10px] text-[#111111]/60">
                <tr>
                  <th className="py-2.5 px-3">Block #</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Aggregate Disbursed</th>
                  <th className="py-2.5 px-3">Merkle Root Fragment</th>
                  <th className="py-2.5 px-3 text-center">Proof Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/5">
                <tr className="hover:bg-[#FAF8F4]/60">
                  <td className="py-3 px-3 font-bold text-[#111111]">#1026</td>
                  <td className="py-3 px-3 text-[#111111]/60">Today, 11:42 EAT</td>
                  <td className="py-3 px-3">18 Requests (Locker + Pool)</td>
                  <td className="py-3 px-3 text-right font-bold text-[#1F6B4A]">KES 62,400</td>
                  <td className="py-3 px-3 text-[#111111]/70">0x7f8a...92a1</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F4]/60">
                  <td className="py-3 px-3 font-bold text-[#111111]">#1025</td>
                  <td className="py-3 px-3 text-[#111111]/60">Today, 08:00 EAT</td>
                  <td className="py-3 px-3">24 Requests (Locker + Pool)</td>
                  <td className="py-3 px-3 text-right font-bold text-[#1F6B4A]">KES 94,500</td>
                  <td className="py-3 px-3 text-[#111111]/70">0x3c11...d4f8</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-[#FAF8F4]/60">
                  <td className="py-3 px-3 font-bold text-[#111111]">#1024</td>
                  <td className="py-3 px-3 text-[#111111]/60">Yesterday, 23:59 EAT</td>
                  <td className="py-3 px-3">12 Requests (Locker + Pool)</td>
                  <td className="py-3 px-3 text-right font-bold text-[#1F6B4A]">KES 48,000</td>
                  <td className="py-3 px-3 text-[#111111]/70">0x89f2...e1b0</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl text-xs text-[#111111]/70">
            <strong>Open Decision Note:</strong> Technology selection remains open between an append-only database with cryptographic third-party audit signatures versus a permissioned consortium ledger.
          </div>
        </div>
      )}

      {/* 5. RETAILER GIFT-CARD / VOUCHER FALLBACK */}
      {activeTab === 'voucher' && (
        <div className="bg-white rounded-2xl border border-[#111111]/15 p-6 space-y-6 shadow-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#111111]/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#1F6B4A] uppercase font-bold">
                <CreditCard className="w-4 h-4" />
                <span>Minority Fallback Channel</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#111111] mt-1">
                Retailer Digital Voucher Fallback
              </h2>
              <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
                Alternative redemption for locations without smart lockers. Under consideration with gift-card providers carrying Kenyan merchants (unconfirmed).
              </p>
            </div>
            <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-semibold shrink-0">
              Merchant Integration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Voucher Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1F6B4A] to-[#154631] text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-base tracking-wide">The Mutual Circle</span>
                <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">Digital Voucher</span>
              </div>

              <div>
                <span className="text-xs opacity-75 block">Redemption Value</span>
                <div className="font-mono text-3xl font-bold">KES 1,500</div>
              </div>

              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="opacity-60 block text-[10px]">Merchant Category</span>
                  <span>Supermarket &amp; Chemist</span>
                </div>
                <div className="text-right">
                  <span className="opacity-60 block text-[10px]">Voucher Code</span>
                  <span>VCH-9941-8210</span>
                </div>
              </div>

              <div className="bg-white text-black p-3 rounded-lg text-center space-y-1">
                <div className="font-mono tracking-widest text-lg font-bold">||| | |||| | ||| || |||</div>
                <div className="text-[10px] text-black/60 font-mono">Show barcode to cashier at participating till</div>
              </div>
            </div>

            {/* Simulator Action */}
            <div className="p-5 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl space-y-4">
              <h3 className="font-serif text-sm font-bold text-[#111111]">
                Simulate Cashier Till Scan
              </h3>
              <p className="text-xs text-[#111111]/70 leading-relaxed">
                Cashiers scan the barcode at the terminal without requesting customer phone number, registration, or national ID.
              </p>

              {!voucherScanned ? (
                <button
                  onClick={() => setVoucherScanned(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <Barcode className="w-4 h-4" />
                  <span>Simulate Cashier POS Scan</span>
                </button>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
                  <div className="text-xs font-bold text-emerald-950">
                    KES 1,500 Approved by Merchant Terminal
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Voucher marked as redeemed. Zero customer information disclosed.
                  </div>
                  <button
                    onClick={() => setVoucherScanned(false)}
                    className="text-xs text-[#1F6B4A] hover:underline font-medium cursor-pointer pt-1"
                  >
                    Reset voucher simulation
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
