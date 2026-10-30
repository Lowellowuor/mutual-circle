import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getDonorLeaderboard, getDonorProfile, updateDonorProfile } from '../../lib/apiClient';
import {
  HeartHandshake, ShieldCheck, Check, Home, Wallet, Package, TrendingUp,
  MapPin, Zap, ChevronRight, Clock, Eye, EyeOff, RotateCcw, Lock, Trophy, Edit2,
} from 'lucide-react';

type Tab = 'home' | 'give' | 'pledge' | 'campaigns' | 'impact' | 'leaders';
type Screen = 'tab' | 'give_success' | 'pledge_success';

const SAMPLE_LEDGER = [
  { id: 'S1', name: 'Nairobi Tech Workers', amount: 25000, when: '5h ago' },
  { id: 'S2', name: 'Anonymous Contributor', amount: 5000, when: '2h ago' },
  { id: 'S3', name: 'Anonymous Contributor', amount: 2500, when: '1d ago' },
  { id: 'S4', name: 'Mombasa Community Fund', amount: 100000, when: '2d ago' },
];

export const DonorView: React.FC = () => {
  const { campaigns, pledges, donorContributions, addDonorContribution, addPledge, donorHash } = useApp();

  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('tab');
  const [selected, setSelected] = useState(2500);
  const [custom, setCustom] = useState('');
  const [anon, setAnon] = useState(true);
  const [ledger, setLedger] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pType, setPType] = useState<'service_credit' | 'goods'>('service_credit');
  const [pDesc, setPDesc] = useState('');
  const [pValue, setPValue] = useState('');
  const [pLocality, setPLocality] = useState('Nairobi County');
  const [pProcessing, setPProcessing] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ display_name: string; total_pence: number; gift_count: number }[]>([]);
  const [myProfile, setMyProfile] = useState<{ display_name: string; opt_in_ledger: boolean; has_profile: boolean } | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileOptIn, setProfileOptIn] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const finalAmount = custom ? Number(custom) : selected;
  const totalGiven = donorContributions.reduce((a, c) => a + c.amount, 0);

  const liveLedger = [
    ...donorContributions.filter(c => c.optInLedger).map(c => ({
      id: c.id, name: 'Anonymous Contributor', amount: c.amount, when: 'just now', isLive: true,
    })),
    ...SAMPLE_LEDGER.map(s => ({ ...s, isLive: false })),
  ];
  const liveLedgerTotal = donorContributions.filter(c => c.optInLedger).reduce((a, c) => a + c.amount, 0);

  const handleGive = () => {
    if (finalAmount <= 0) return;
    setProcessing(true);
    setTimeout(() => { addDonorContribution(finalAmount, anon, ledger); setProcessing(false); setScreen('give_success'); }, 700);
  };

  const handlePledge = () => {
    if (!pDesc) return;
    setPProcessing(true);
    setTimeout(() => { addPledge(pType, pDesc, pLocality, pType === 'service_credit' ? Number(pValue) : undefined); setPProcessing(false); setScreen('pledge_success'); }, 700);
  };

  const resetFlow = () => {
    setCustom(''); setAnon(true); setLedger(false);
    setPDesc(''); setPValue(''); setPType('service_credit'); setPLocality('Nairobi County');
    setScreen('tab');
  };

  const goTab = (t: Tab) => { setTab(t); setScreen('tab'); };

  useEffect(() => {
    (async () => {
      const lb = await getDonorLeaderboard(20);
      if (lb) setLeaderboard(lb.leaderboard);
      const p = await getDonorProfile(donorHash);
      if (p) {
        setMyProfile(p);
        setProfileName(p.display_name || '');
        setProfileOptIn(p.opt_in_ledger);
      }
    })();
  }, [donorHash, donorContributions.length]);

  const saveProfile = async () => {
    setProfileSaving(true);
    const r = await updateDonorProfile(donorHash, profileName.trim(), profileOptIn);
    setProfileSaving(false);
    if (r) {
      setMyProfile({ display_name: r.display_name, opt_in_ledger: r.opt_in_ledger, has_profile: true });
      setEditingProfile(false);
      const lb = await getDonorLeaderboard(20);
      if (lb) setLeaderboard(lb.leaderboard);
    }
  };

  const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'give', label: 'Give', Icon: Wallet },
    { id: 'pledge', label: 'Pledge', Icon: Package },
    { id: 'campaigns', label: 'Campaigns', Icon: TrendingUp },
    { id: 'impact', label: 'Impact', Icon: HeartHandshake },
    { id: 'leaders', label: 'Leaders', Icon: Trophy },
  ];

  const renderContent = () => {
    if (screen === 'give_success') {
      return (
        <div className="p-6 space-y-5">
          <div className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200"><Check className="w-8 h-8" /></div>
            <div><h2 className="font-serif text-xl font-bold text-[#111111]">Pooled</h2><p className="text-xs text-[#111111]/50 mt-1">KES {finalAmount.toLocaleString()} added to the blind fund.</p></div>
          </div>
          <div className="p-3 bg-[#FAF8F4] rounded-xl border border-[#111111]/10 space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between"><span className="text-[#111111]/50">Fund</span><span className="font-semibold">Mutual Circle Pool</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Name</span><span className="font-semibold">{anon ? 'Anonymous' : 'Recorded'}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Ledger</span><span className="font-semibold">{ledger ? 'Visible in ledger' : 'Not listed'}</span></div>
            <div className="flex justify-between border-t border-[#111111]/10 pt-1.5 mt-1.5"><span className="text-[#111111]/50">Recipient link</span><span className="font-semibold text-[#1F6B4A]">None</span></div>
          </div>
          {ledger && <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-900 leading-relaxed"><Check className="w-3 h-3 inline mr-1" />Your contribution now appears in the Impact tab's recognition ledger.</div>}
          <div className="space-y-2 pt-2">
            <button onClick={() => { setScreen('tab'); setCustom(''); }} className="w-full py-3 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-sm font-medium">Give again</button>
            <button onClick={() => { resetFlow(); setTab('home'); }} className="w-full py-2.5 bg-white border border-[#111111]/15 text-[#111111]/70 rounded-xl text-sm font-medium">Done</button>
          </div>
        </div>
      );
    }

    if (screen === 'pledge_success') {
      return (
        <div className="p-6 space-y-5">
          <div className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border-2 border-amber-200"><Check className="w-8 h-8" /></div>
            <div><h2 className="font-serif text-xl font-bold text-[#111111]">Pledge received</h2><p className="text-xs text-[#111111]/50 mt-1">Matching in {pLocality}.</p></div>
          </div>
          <div className="p-3 bg-[#FAF8F4] rounded-xl border border-[#111111]/10 space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between"><span className="text-[#111111]/50">Type</span><span className="font-semibold">{pType === 'service_credit' ? 'Service credit' : 'Goods'}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Locality</span><span className="font-semibold">{pLocality}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Status</span><span className="font-semibold text-amber-700">Awaiting match</span></div>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 leading-relaxed">Your pledge is now visible to the Operations team for matching.</div>
          <div className="space-y-2 pt-2">
            <button onClick={() => { setScreen('tab'); setPDesc(''); setPValue(''); }} className="w-full py-3 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-sm font-medium">Pledge again</button>
            <button onClick={() => { resetFlow(); setTab('home'); }} className="w-full py-2.5 bg-white border border-[#111111]/15 text-[#111111]/70 rounded-xl text-sm font-medium">Done</button>
          </div>
        </div>
      );
    }

    if (tab === 'home') {
      return (
        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#1F6B4A] to-[#18553a] p-5 text-white space-y-2">
            <HeartHandshake className="w-6 h-6 text-white/80" />
            <h2 className="font-serif text-xl font-bold leading-tight">Fund a need.<br />Stay anonymous.</h2>
            <p className="text-[11px] text-white/70 leading-relaxed">Blind-pooled. No recipient profiles. No linkage.</p>
          </div>
          {campaigns.some(c => c.isClosed && c.pooledAmount >= c.targetAmount) && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-emerald-900 flex items-center gap-1"><Check className="w-3 h-3" /> Campaign you supported has closed</div>
              <p className="text-[10px] text-emerald-900/70 leading-relaxed">Kibera Pantry Bundles * 500/500 bundles covered. Thank you.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => goTab('give')} className="p-4 bg-white border border-[#111111]/15 rounded-2xl text-left hover:border-[#1F6B4A] transition-colors"><Wallet className="w-5 h-5 text-[#1F6B4A] mb-2" /><div className="text-xs font-bold text-[#111111]">Give Cash</div><div className="text-[10px] text-[#111111]/50 mt-0.5">Blind pool</div></button>
            <button onClick={() => goTab('pledge')} className="p-4 bg-white border border-[#111111]/15 rounded-2xl text-left hover:border-[#1F6B4A] transition-colors"><Package className="w-5 h-5 text-amber-600 mb-2" /><div className="text-xs font-bold text-[#111111]">Pledge</div><div className="text-[10px] text-[#111111]/50 mt-0.5">Goods or credit</div></button>
          </div>
          <button onClick={() => goTab('campaigns')} className="w-full p-4 bg-white border border-[#111111]/15 rounded-2xl flex items-center gap-3 hover:border-[#1F6B4A] transition-colors">
            <TrendingUp className="w-5 h-5 text-[#1F6B4A] shrink-0" />
            <div className="flex-1 text-left"><div className="text-xs font-bold text-[#111111]">{campaigns.length} active campaigns</div><div className="text-[10px] text-[#111111]/50 mt-0.5">Cohort-level giving</div></div>
            <ChevronRight className="w-4 h-4 text-[#111111]/40" />
          </button>
          {donorContributions.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center"><h3 className="text-[10px] font-mono uppercase tracking-wider text-[#111111]/50">Recent</h3><span className="text-[10px] font-mono text-[#111111]/50">{donorContributions.length}</span></div>
              {donorContributions.slice(0, 3).map(c => (
                <div key={c.id} className="p-2.5 bg-white border border-[#111111]/10 rounded-xl flex justify-between text-xs">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="font-mono font-bold text-[#111111]">KES {c.amount.toLocaleString()}</span></div>
                  <span className="text-[9px] text-[#111111]/50 font-mono">{c.isAnonymous ? 'Anon' : 'Named'}{c.optInLedger ? ' * Ledger' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === 'give') {
      return (
        <div className="p-5 space-y-4">
          <div><h2 className="font-serif text-lg font-bold text-[#111111]">Give Cash</h2><p className="text-[11px] text-[#111111]/50 mt-0.5">Into the blind pool. No recipient chosen.</p></div>
          <div className="grid grid-cols-2 gap-2">
            {[1000, 2500, 5000, 10000].map(v => (
              <button key={v} onClick={() => { setSelected(v); setCustom(''); }} className={'py-3 rounded-xl border text-center font-mono text-sm transition-all ' + (selected === v && !custom ? 'bg-[#1F6B4A] text-white border-[#1F6B4A] font-bold' : 'bg-white border-[#111111]/15 text-[#111111] font-semibold')}>{v.toLocaleString()}</button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-3 text-[10px] font-mono font-bold text-[#111111]/40">KES</span>
            <input type="number" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Custom amount" className="w-full bg-white border border-[#111111]/15 rounded-xl pl-12 pr-3 py-3 text-sm font-mono font-bold text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-white border border-[#111111]/10 rounded-xl cursor-pointer">
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} className="accent-[#1F6B4A] w-4 h-4" />
              <div className="flex-1"><div className="text-xs font-semibold text-[#111111]">Anonymous</div><div className="text-[10px] text-[#111111]/50">Recommended</div></div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white border border-[#111111]/10 rounded-xl cursor-pointer">
              <input type="checkbox" checked={ledger} onChange={e => setLedger(e.target.checked)} className="accent-[#1F6B4A] w-4 h-4" />
              <div className="flex-1"><div className="text-xs font-semibold text-[#111111]">Show in recognition ledger</div><div className="text-[10px] text-[#111111]/50">Aggregate * no recipient link</div></div>
            </label>
          </div>
          <button onClick={handleGive} disabled={processing || finalAmount <= 0} className="w-full py-3.5 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-sm font-medium disabled:opacity-50 mt-2">{processing ? 'Processing...' : `Contribute KES ${finalAmount.toLocaleString()}`}</button>
        </div>
      );
    }

    if (tab === 'pledge') {
      return (
        <div className="p-5 space-y-4">
          <div><h2 className="font-serif text-lg font-bold text-[#111111]">Pledge Resource</h2><p className="text-[11px] text-[#111111]/50 mt-0.5">Matched by category and locality. Never by name.</p></div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPType('service_credit')} className={'p-3 rounded-xl border text-left ' + (pType === 'service_credit' ? 'bg-[#1F6B4A] border-[#1F6B4A] text-white' : 'bg-white border-[#111111]/15 text-[#111111]')}><Zap className={'w-4 h-4 mb-1 ' + (pType === 'service_credit' ? 'text-white' : 'text-amber-600')} /><div className="text-xs font-bold">Service Credit</div><div className={'text-[9px] mt-0.5 ' + (pType === 'service_credit' ? 'text-white/70' : 'text-[#111111]/50')}>Pay a bill</div></button>
            <button onClick={() => setPType('goods')} className={'p-3 rounded-xl border text-left ' + (pType === 'goods' ? 'bg-[#1F6B4A] border-[#1F6B4A] text-white' : 'bg-white border-[#111111]/15 text-[#111111]')}><Package className={'w-4 h-4 mb-1 ' + (pType === 'goods' ? 'text-white' : 'text-blue-600')} /><div className="text-xs font-bold">Surplus Goods</div><div className={'text-[9px] mt-0.5 ' + (pType === 'goods' ? 'text-white/70' : 'text-[#111111]/50')}>Food, blankets</div></button>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-mono uppercase text-[#111111]/50">Description</label><input value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder={pType === 'service_credit' ? 'Bill up to KES 5,000' : 'e.g. 50kg maize'} className="w-full bg-white border border-[#111111]/15 rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-[#1F6B4A] outline-none" /></div>
          {pType === 'service_credit' && (<div className="space-y-1.5"><label className="text-[10px] font-mono uppercase text-[#111111]/50">Max value (KES)</label><input type="number" value={pValue} onChange={e => setPValue(e.target.value)} placeholder="5000" className="w-full bg-white border border-[#111111]/15 rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-[#1F6B4A] outline-none" /></div>)}
          <div className="space-y-1.5"><label className="text-[10px] font-mono uppercase text-[#111111]/50 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Locality</label><select value={pLocality} onChange={e => setPLocality(e.target.value)} className="w-full bg-white border border-[#111111]/15 rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-[#1F6B4A] outline-none">{['Nairobi County', 'Mombasa County', 'Kisumu County', 'Nakuru County'].map(c => <option key={c}>{c}</option>)}</select></div>
          <button onClick={handlePledge} disabled={pProcessing || !pDesc} className="w-full py-3.5 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-sm font-medium disabled:opacity-50 mt-2">{pProcessing ? 'Submitting...' : 'Submit Pledge'}</button>
        </div>
      );
    }

    if (tab === 'campaigns') {
      return (
        <div className="p-5 space-y-3">
          <div><h2 className="font-serif text-lg font-bold text-[#111111]">Campaigns</h2><p className="text-[11px] text-[#111111]/50 mt-0.5">Cohort-level targets. Never an individual.</p></div>
          {campaigns.map(c => {
            const pct = Math.round((c.pooledAmount / c.targetAmount) * 100);
            return (
              <div key={c.id} className="p-4 bg-white border border-[#111111]/15 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0"><div className="text-[9px] font-mono uppercase text-[#1F6B4A] tracking-wider">Cohort</div><h3 className="font-serif text-sm font-bold text-[#111111] leading-snug">{c.title}</h3></div>
                  <div className="flex items-center gap-0.5 text-[10px] font-mono text-[#111111]/50 shrink-0"><Clock className="w-3 h-3" /> {c.daysRemaining}d</div>
                </div>
                <p className="text-[10px] text-[#111111]/60 leading-relaxed">{c.cohortGoalText}</p>
                <div className="space-y-1">
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-[#1F6B4A]" style={{ width: Math.min(100, pct) + '%' }} /></div>
                  <div className="flex justify-between text-[9px] font-mono"><span className="font-bold text-[#1F6B4A]">{pct}%</span><span className="text-[#111111]/50">{c.coveredCount}/{c.targetCount}</span></div>
                </div>
                <button onClick={() => goTab('give')} className="w-full py-2 bg-[#111111] hover:bg-black text-white rounded-lg text-[11px] font-semibold">Contribute</button>
              </div>
            );
          })}
        </div>
      );
    }

    if (tab === 'leaders') {
      return (
        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#1F6B4A] to-[#18553a] p-5 text-white space-y-2">
            <Trophy className="w-6 h-6 text-white/80" />
            <h2 className="font-serif text-xl font-bold leading-tight">Community Leaders</h2>
            <p className="text-[11px] text-white/70 leading-relaxed">Opt-in recognition. Aggregate totals only. No recipient linkage.</p>
          </div>

          <div className="p-4 bg-white border border-[#111111]/15 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase font-bold text-[#111111]/60 tracking-wider">Your standing</div>
              {!editingProfile && (
                <button onClick={() => setEditingProfile(true)} className="text-[10px] text-[#1F6B4A] hover:underline flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {!editingProfile ? (
              myProfile?.opt_in_ledger ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#111111]/60">Display name</span>
                    <span className="font-semibold text-[#111111]">{myProfile.display_name || 'Anonymous Contributor'}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-[#111111]/10 pt-1.5">
                    <span className="text-[#111111]/60">Listed publicly</span>
                    <span className="font-semibold text-[#1F6B4A]">Yes</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#111111]/10">
                  <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                    You are not in the public leaderboard. Your contributions are still counted and pooled.
                  </p>
                  <button onClick={() => setEditingProfile(true)} className="mt-2 w-full py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[11px] font-semibold">
                    Join the leaderboard
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-[#111111]/50">Display name (optional)</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value.slice(0, 60))}
                    placeholder="e.g. Nairobi Tech Workers"
                    className="w-full bg-white border border-[#111111]/15 rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-[#1F6B4A] outline-none"
                  />
                  <p className="text-[9px] text-[#111111]/50">Leave blank to appear as "Anonymous Contributor".</p>
                </div>
                <label className="flex items-start gap-3 p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={profileOptIn} onChange={e => setProfileOptIn(e.target.checked)} className="mt-0.5 accent-[#1F6B4A]" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-[#111111]">Show me on the public leaderboard</div>
                    <div className="text-[10px] text-[#111111]/50 mt-0.5">Only your total given and gift count are shown. Never a recipient link.</div>
                  </div>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProfile(false); setProfileName(myProfile?.display_name || ''); setProfileOptIn(myProfile?.opt_in_ledger || false); }} className="flex-1 py-2 bg-white border border-[#111111]/20 text-[#111111] rounded-lg text-[11px] font-medium">Cancel</button>
                  <button onClick={saveProfile} disabled={profileSaving} className="flex-1 py-2 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-[11px] font-semibold disabled:opacity-50">{profileSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border border-[#111111]/15 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono uppercase font-bold text-[#111111]/60 tracking-wider">Top contributors</h3>
              <span className="text-[8px] font-mono bg-[#DCE8E0] text-[#1F6B4A] px-1.5 py-0.5 rounded">Opt-in</span>
            </div>
            {leaderboard.length === 0 ? (
              <div className="py-6 text-center">
                <Trophy className="w-6 h-6 text-[#111111]/20 mx-auto mb-2" />
                <p className="text-[10px] text-[#111111]/50">No opt-in donors yet. Be the first.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((entry, idx) => (
                  <div key={`${entry.display_name}-${idx}`} className="flex items-center gap-3 py-2 border-b border-[#111111]/5 last:border-0">
                    <div className="w-6 text-center font-mono text-[10px] font-bold text-[#111111]/40">#{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#111111] truncate">{entry.display_name}</div>
                      <div className="text-[9px] font-mono text-[#111111]/50">{entry.gift_count} gift{entry.gift_count !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-xs font-mono font-bold text-[#1F6B4A] shrink-0">KES {(entry.total_pence / 100).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
            <div className="text-[10px] font-bold text-rose-900 mb-1">What the leaderboard does NOT show</div>
            <ul className="text-[10px] text-rose-900/80 leading-relaxed space-y-0.5">
              <li>* Which specific bills or recipients your money funded</li>
              <li>* Per-contribution timestamps or categories</li>
              <li>* Any identification of who received the resources</li>
            </ul>
            <p className="text-[9px] text-rose-900/60 pt-1.5 border-t border-rose-200 mt-1.5">Aggregate totals only. Recipient dignity comes first.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-5 space-y-4">
        <div><h2 className="font-serif text-lg font-bold text-[#111111]">Impact</h2><p className="text-[11px] text-[#111111]/50 mt-0.5">Aggregate. Never individual.</p></div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Pooled', value: '4.12M', sub: 'KES' },
            { label: 'Bundles', value: '1,842', sub: 'Food & hygiene' },
            { label: 'Utility Meters', value: '620', sub: 'Power & water' },
            { label: 'Students', value: '415', sub: 'Term fees' },
          ].map(s => (
            <div key={s.label} className="p-3 bg-white border border-[#111111]/15 rounded-xl">
              <div className="text-[9px] font-mono uppercase text-[#111111]/50 tracking-wider">{s.label}</div>
              <div className="font-mono text-lg font-bold text-[#1F6B4A] mt-0.5">{s.value}</div>
              <div className="text-[9px] text-[#111111]/40 font-mono">{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border border-[#111111]/15 rounded-2xl space-y-2.5">
          <h3 className="text-[10px] font-mono uppercase font-bold text-[#111111]/60 tracking-wider">Distribution</h3>
          {[{ l: 'Food & hygiene', p: 42, c: 'bg-[#1F6B4A]' }, { l: 'Utility bills', p: 34, c: 'bg-blue-600' }, { l: 'School fees', p: 24, c: 'bg-amber-600' }].map(r => (
            <div key={r.l} className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono"><span className="text-[#111111]/70">{r.l}</span><span className="font-bold text-[#111111]">{r.p}%</span></div>
              <div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className={'h-full ' + r.c} style={{ width: r.p + '%' }} /></div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
          <div className="text-[10px] font-bold text-rose-900">What we cannot show you</div>
          <ul className="text-[10px] text-rose-900/80 leading-relaxed space-y-0.5">
            <li>? Which specific person received your money</li>
            <li>? Their name, age, or precise location</li>
            <li>? Their medical condition (if any)</li>
            <li>? Which of your contributions went to which bill</li>
          </ul>
          <p className="text-[9px] text-rose-900/60 pt-1 border-t border-rose-200 leading-relaxed">Not because we are hiding it. Because this data does not exist on our servers. That is the entire point.</p>
        </div>

        <div className="p-4 bg-white border border-[#111111]/15 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-mono uppercase font-bold text-[#111111]/60 tracking-wider">Recognition Ledger</h3>
            <span className="text-[8px] font-mono bg-[#DCE8E0] text-[#1F6B4A] px-1.5 py-0.5 rounded">Opt-in * Live</span>
          </div>
          {donorContributions.length > 0 && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[9px] text-emerald-900 font-mono">
              {donorContributions.filter(c => c.optInLedger).length} your contribution{donorContributions.filter(c => c.optInLedger).length !== 1 ? 's' : ''} visible * KES {liveLedgerTotal.toLocaleString()}
            </div>
          )}
          {liveLedger.slice(0, 8).map((r: any) => (
            <div key={r.id} className={'flex justify-between text-[10px] py-1.5 border-b border-[#111111]/5 last:border-0 ' + (r.isLive ? 'bg-emerald-50/50 -mx-1 px-1 rounded' : '')}>
              <div className="min-w-0">
                <div className="text-[#111111] truncate flex items-center gap-1">
                  {r.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  {r.name}
                </div>
                <div className="text-[8px] text-[#111111]/40 font-mono">{r.when}</div>
              </div>
              <span className="font-mono font-bold text-[#1F6B4A] shrink-0 ml-2">KES {r.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
      <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
        <div className="bg-[#FAF8F4] rounded-[2rem] overflow-hidden flex flex-col h-[620px]">
          <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-medium text-[#111111]/60">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-1 text-[#111111]/40"><span>?</span><span>?</span><span>?</span></div>
          </div>
          <div className="px-5 pb-3 flex items-center justify-between border-b border-[#111111]/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1F6B4A] rounded-xl flex items-center justify-center"><HeartHandshake className="w-4 h-4 text-white" /></div>
              <div><div className="text-xs font-bold text-[#111111] leading-tight">Donor Portal</div><div className="text-[9px] text-[#111111]/40 font-mono">Blind-pooled</div></div>
            </div>
            <Lock className="w-3.5 h-3.5 text-[#1F6B4A]" />
          </div>
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
          <div className="border-t border-[#111111]/10 bg-white">
            <div className="grid grid-cols-6">
              {TABS.map(t => {
                const Icon = t.Icon;
                const active = tab === t.id && screen === 'tab';
                return (
                  <button key={t.id} onClick={() => goTab(t.id)} className={'py-2.5 flex flex-col items-center gap-0.5 transition-colors ' + (active ? 'text-[#1F6B4A]' : 'text-[#111111]/40')}>
                    <Icon className="w-4 h-4" /><span className="text-[9px] font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#1F6B4A]" /> Server View</h3>
            <button onClick={() => setShowServer(!showServer)} className="text-[10px] text-[#1F6B4A] hover:underline flex items-center gap-1">{showServer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}{showServer ? 'Hide' : 'Reveal'}</button>
          </div>
          <div className="space-y-2 pt-2 border-t border-[#111111]/10 font-mono text-[10px]">
            <div className="flex justify-between"><span className="text-[#111111]/50">Donor hash</span><span className="text-[#1F6B4A] font-bold">{showServer ? 'donor_8f4c2e' : '******'}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Name</span><span className="text-rose-600 font-bold">{showServer ? 'NOT STORED' : '******'}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Recipient link</span><span className="text-rose-600 font-bold">NONE</span></div>
            <div className="flex justify-between border-t border-[#111111]/10 pt-2 mt-2"><span className="text-[#111111]/50">Session total</span><span className="text-[#111111] font-bold">KES {totalGiven.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Contributions</span><span className="text-[#111111]">{donorContributions.length}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">Pledges</span><span className="text-[#111111]">{pledges.length}</span></div>
            <div className="flex justify-between"><span className="text-[#111111]/50">In ledger</span><span className="text-[#111111]">{donorContributions.filter(c => c.optInLedger).length} / {donorContributions.length}</span></div>
          </div>
          {showServer && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-800 leading-relaxed mt-2"><strong>Blind-pool guarantee:</strong> no column links a donor to any disbursement. The ledger is aggregate only.</div>}
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-1.5">
          <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">Spec Coverage</h4>
          {['Blind pooling (4.6)', 'Cohort campaigns (4.6)', 'Recognition ledger opt-in (4.6)', 'The Match - goods & service credit (4.4)', 'Coarse locality (4.4)', 'Anonymous by default', 'No recipient linkage'].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111111]/70"><div className="w-1 h-1 rounded-full bg-[#1F6B4A]" />{f}</div>
          ))}
        </div>

        <button onClick={() => { resetFlow(); setTab('home'); setShowServer(false); }} className="w-full py-2 text-xs text-[#111111]/60 hover:text-[#111111] border border-[#111111]/15 rounded-lg bg-white flex items-center justify-center gap-1.5"><RotateCcw className="w-3 h-3" /> Reset Simulator</button>
      </div>
    </div>
  );
};

