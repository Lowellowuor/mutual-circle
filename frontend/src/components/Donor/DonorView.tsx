import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SmsDonorSimulator } from './SmsDonorSimulator';
import { GiveFlow } from './GiveFlow';
import { DonorHome } from './DonorHome';
import { DonorImpact } from './DonorImpact';
import { DonorLeaders } from './DonorLeaders';
import { DonorSettings } from './DonorSettings';
import { PledgeFlow } from './PledgeFlow';
import { DonorActivityModal } from './DonorActivityModal';
import { getDonorLeaderboard, getDonorProfile, updateDonorProfile, getImpactStats, getDistribution, getPublicPartners, getPublicLedger, downloadPublicLedgerCsv } from '../../lib/apiClient';
import {
  HeartHandshake, ShieldCheck, Check, Home, Wallet, Package, TrendingUp,
  MapPin, Zap, ChevronRight, Clock, Eye, EyeOff, RotateCcw, Lock, Trophy, Edit2, Settings,
} from 'lucide-react';
import { SkeletonList } from '../Shared/Skeleton';
import { EmptyState } from '../Shared/EmptyState';
import { AppBottomNav } from '../layout/AppBottomNav';

type Tab = 'home' | 'give' | 'pledge' | 'impact' | 'leaders';
type Screen = 'tab' | 'give_success' | 'pledge_success' | 'ledger' | 'settings' | 'activity';



export const DonorView: React.FC = () => {
  const { campaigns, pledges, donorContributions, addDonorContribution, addPledge, donorHash } = useApp();

  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('tab');
  const [selected, setSelected] = useState(2500);
  const [custom, setCustom] = useState('');
  const [anon, setAnon] = useState(true);
  const [ledger, setLedger] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payingDonation, setPayingDonation] = useState<{ id: string; amount: number } | null>(null);
  const [payingPledge, setPayingPledge] = useState<{ id: string; amount: number } | null>(null);
  const [pType, setPType] = useState<'service_credit' | 'goods'>('service_credit');
  const [pDesc, setPDesc] = useState('');
  const [pValue, setPValue] = useState('');
  const [pLocality, setPLocality] = useState('Nairobi County');
  const [pProcessing, setPProcessing] = useState(false);
    const [showServer, setShowServer] = useState(false);
  const [channel, setChannel] = useState<'web' | 'sms'>('web');

  const channelBtnClass = (target: 'web' | 'sms') =>
    'px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold transition-colors ' +
    (channel === target ? 'bg-[#1F6B4A] text-white' : 'bg-[#FAF8F4] text-[#111111]/40 border border-[#111111]/15');
  const [impactStats, setImpactStats] = useState<{ total_pooled_pence: number; bundles_delivered: number; utility_meters_paid: number; student_terms_paid: number } | null>(null);
  const [distribution, setDistribution] = useState<{ category: string; label: string; count: number; total_pence: number; percentage: number }[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ display_name: string; total_pence: number; gift_count: number }[]>([]);
  const [myProfile, setMyProfile] = useState<{ display_name: string; opt_in_ledger: boolean; has_profile: boolean } | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileOptIn, setProfileOptIn] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [dismissedClosures, setDismissedClosures] = useState<Set<string>>(new Set());
  const [publicPartners, setPublicPartners] = useState<{ id: string; name: string; type: string; region: string }[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [ledgerData, setLedgerData] = useState<{ total_pooled_pence: number; entry_count: number; chain_ok: boolean; broken_at: { index: number; reason: string } | null; last_entries: any[] } | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [impactDelta, setImpactDelta] = useState<{ bundles: number; utilities: number; terms: number } | null | undefined>(undefined);

  const finalAmount = custom ? Number(custom) : selected;
  const totalGiven = donorContributions.reduce((a, c) => a + c.amount, 0);

  const liveLedgerTotal = donorContributions.filter(c => c.optInLedger).reduce((a, c) => a + c.amount, 0);

  const openLedgerModal = async () => {
    setScreen('ledger');
    if (ledgerData) return;
    setLedgerLoading(true);
    try { const r = await getPublicLedger(10); if (r) setLedgerData(r as any); } catch (e) { console.error('[donor] ledger fetch failed', e); setLedgerLoading(false); }
    setLedgerLoading(false);
  };

  const handleDownloadLedger = async () => {
    try { await downloadPublicLedgerCsv(); } catch (e) { console.error('[donor] ledger CSV download failed', e); }
  };

  const handleGive = async () => {
    if (finalAmount <= 0) return;
    setProcessing(true);
    const newDonation = await addDonorContribution(finalAmount, anon, ledger);
    setProcessing(false);
    
    // If the API returned an ID, set the payment state so the modal/button shows
    if (newDonation && newDonation.id) {
      setPayingDonation({ id: newDonation.id, amount: finalAmount * 100 });
    } else {
      console.warn('Donation created but no ID returned; cannot start Paystack checkout');
    }
    
    setScreen('give_success');
  };

  const handlePledge = async () => {
    if (!pDesc) return;
    setPProcessing(true);
    const newPledge = await addPledge(pType, pDesc, pLocality, pType === 'service_credit' ? Number(pValue) : undefined);
    setPProcessing(false);
    if (newPledge && newPledge.max_value_pence) {
      setPayingPledge({ id: newPledge.id, amount: newPledge.max_value_pence });
    }
    setScreen('pledge_success');
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
      const [impact, dist, partners] = await Promise.all([getImpactStats(), getDistribution(), getPublicPartners()]);
      if (partners) setPublicPartners(partners.partners || []);
      if (impact) setImpactStats(impact);
      if (dist) setDistribution(dist.by_category);
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

  const formatRelativeTime = (iso: string): string => {
    try {
      const then = new Date(iso).getTime();
      if (isNaN(then)) return 'recently';
      const diff = Date.now() - then;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return mins + 'm ago';
      const hours = Math.floor(mins / 60);
      if (hours < 24) return hours + 'h ago';
      const days = Math.floor(hours / 24);
      if (days < 30) return days + 'd ago';
      return Math.floor(days / 30) + 'mo ago';
    } catch {
      return 'recently';
    }
  };

  type ActivityItem = {
    id: string;
    kind: 'donation' | 'pledge';
    title: string;
    subtitle: string;
    amountKes?: number;
    timestamp: string;
  };

  const activityFeed: ActivityItem[] = [
    ...donorContributions.map(d => ({
      id: 'd-' + d.id,
      kind: 'donation' as const,
      title: 'Gift to blind pool',
      subtitle: d.optInLedger ? 'Listed in recognition ledger' : (d.isAnonymous ? 'Anonymous' : 'Recorded'),
      amountKes: d.amount,
      timestamp: d.timestamp,
    })),
    ...pledges.map(p => ({
      id: 'p-' + p.id,
      kind: 'pledge' as const,
      title: 'Pledge: ' + p.description,
      subtitle: (() => {
        const ref = (p as any).linkedRequestId || (p as any).linked_request_id;
        const refSuffix = ref ? ' — REF-' + String(ref).slice(0,8).toUpperCase() : '';
        const statusText = p.status === 'awaiting_match' ? 'Awaiting match' : p.status === 'matched' ? 'Matched' : 'Delivered';
        return p.locality + ' · ' + statusText + refSuffix;
      })(),
      timestamp: p.timestamp,
    })),
  ].sort((a, b) => {
    const at = new Date(a.timestamp).getTime() || 0;
    const bt = new Date(b.timestamp).getTime() || 0;
    return bt - at;
  });

  const closedCampaigns = campaigns.filter(c => c.isClosed && c.pooledAmount >= c.targetAmount);
  const activeClosures = closedCampaigns.filter(c => !dismissedClosures.has(c.id));
  const totalGivenKes = donorContributions.reduce((sum, d) => sum + d.amount, 0);
  const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'give', label: 'Give', Icon: Wallet },
    { id: 'pledge', label: 'Pledge', Icon: Package },
    { id: 'impact', label: 'Impact', Icon: HeartHandshake },
    { id: 'leaders', label: 'Leaders', Icon: Trophy },
  ];

  useEffect(() => {
    if (!impactStats || !donorHash) return;
    const key = `mc-impact-` + donorHash;
    const sessionKey = `mc-impact-session-` + donorHash;
    try {
      const alreadyUpdated = sessionStorage.getItem(sessionKey);
      const stored = localStorage.getItem(key);
      if (stored) {
        const snap = JSON.parse(stored);
        setImpactDelta({
          bundles: Math.max(0, impactStats.bundles_delivered - (snap.bundles_delivered || 0)),
          utilities: Math.max(0, impactStats.utility_meters_paid - (snap.utility_meters_paid || 0)),
          terms: Math.max(0, impactStats.student_terms_paid - (snap.student_terms_paid || 0)),
        });
      } else {
        setImpactDelta(null);
      }
      if (!alreadyUpdated) {
        localStorage.setItem(key, JSON.stringify(impactStats));
        sessionStorage.setItem(sessionKey, '1');
      }
    } catch (e) { console.error('[donor] impact delta compute failed', e); setImpactDelta(null); }
  }, [impactStats, donorHash]);

  const handleDownloadDonations = () => {
    if (donorContributions.length === 0) return;
    const header = ['Date', 'Amount (KES)', 'Anonymous', 'Ledger listed'];
    const rows = donorContributions.map(c => [
      new Date(c.timestamp).toISOString().replace('T', ' ').slice(0, 16),
      c.amount.toFixed(2),
      c.isAnonymous ? 'Yes' : 'No',
      c.optInLedger ? 'Yes' : 'No',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mutual-circle-donations-' + donorHash.slice(0,8) + '-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  useEffect(() => {
    if (selectedActivity) {
      setScreen('activity');
    }
  }, [selectedActivity]);

  const renderContent = () => {
    if (screen === 'activity' && selectedActivity) {
      return (
        <DonorActivityModal
          item={selectedActivity}
          onClose={() => { setScreen('tab'); setSelectedActivity(null); }}
          inline={true}
        />
      );
    }
    if (screen === 'settings') {
      return (
        <DonorSettings
          donorHash={donorHash}
          myProfile={myProfile}
          donorContributions={donorContributions}
          pledges={pledges}
          totalGiven={totalGiven}
          showServer={showServer}
          setShowServer={setShowServer}
          setScreen={setScreen}
          setTab={setTab}
          resetFlow={resetFlow}
          handleDownloadDonations={handleDownloadDonations}
        />
      );
    }

    if (screen === 'give_success') {
      return (
        <GiveFlow
          showSuccess={true}
          onCloseSuccess={() => setScreen('tab')}
          onViewDonations={() => { resetFlow(); setTab('give'); }}
          finalAmount={finalAmount}
          selected={selected}
          setSelected={setSelected}
          custom={custom}
          setCustom={setCustom}
          anon={anon}
          setAnon={setAnon}
          ledger={ledger}
          setLedger={setLedger}
          processing={processing}
          handleGive={handleGive}
          payingDonation={payingDonation}
          donorContributions={donorContributions}
        />
      );
    }

    if (screen === 'pledge_success') {
      return (
        <PledgeFlow
          showSuccess={true}
          onCloseSuccess={() => setScreen('tab')}
          onViewPledges={() => { resetFlow(); setTab('pledge'); }}
          pType={pType}
          setPType={setPType}
          pDesc={pDesc}
          setPDesc={setPDesc}
          pValue={pValue}
          setPValue={setPValue}
          pLocality={pLocality}
          setPLocality={setPLocality}
          pProcessing={pProcessing}
          handlePledge={handlePledge}
          pledges={pledges}
          payingPledge={payingPledge}
        />
      );
    }

    if (screen === 'ledger') {
      return (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#111111]">Public ledger</h2>
              <p className="text-[11px] text-[#111111]/50 mt-0.5">Verify the chain has not been tampered with.</p>
            </div>
            <button onClick={() => setScreen('tab')} className="text-[10px] text-[#111111]/60 hover:text-[#111111]">Back</button>
          </div>
          {ledgerLoading && (
            <SkeletonList count={2} />
          )}
          {ledgerData && (
            <>
              {ledgerData.chain_ok ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-emerald-900">
                    <Check className="w-3 h-3" /> Chain verified
                  </div>
                  <div className="text-[11px] text-emerald-900/80 mt-1">{ledgerData.entry_count} entries · no tampering detected</div>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="text-[10px] font-mono uppercase font-bold text-rose-900">Chain broken</div>
                  <div className="text-[11px] text-rose-900/80 mt-1">
                    {ledgerData.broken_at ? 'At entry ' + ledgerData.broken_at.index + ': ' + ledgerData.broken_at.reason : 'Verification failed'}
                  </div>
                </div>
              )}
              <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl">
                <div className="text-[9px] font-mono uppercase text-[#111111]/50">Total pooled</div>
                <div className="text-lg font-mono font-bold text-[#1F6B4A]">KES {(ledgerData.total_pooled_pence / 100).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase text-[#111111]/50 mb-1.5">Recent entries</div>
                <div className="space-y-1.5">
                  {ledgerData.last_entries.slice(0, 8).map((e: any) => (
                    <div key={e.id} className="p-3 border border-[#111111]/10 rounded-lg flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#111111]/50">{new Date(e.created_at).toLocaleString()}</div>
                        <div className="text-[10px] font-semibold text-[#111111] mt-0.5 truncate">{(e.category || '').replace(/_/g, ' ')}</div>
                        <div className="text-[9px] font-mono text-[#111111]/40 mt-0.5">H: {e.entry_hash_prefix}</div>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-[#1F6B4A] shrink-0">KES {(e.amount_pence / 100).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-900 leading-relaxed">
                Each entry is chained to the previous by HMAC — one change breaks the chain.
              </div>
            </>
          )}
          <div className="space-y-2 pt-2">
            <button onClick={handleDownloadLedger} className="w-full py-3 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-sm font-medium">Download CSV</button>
            <button onClick={() => setScreen('tab')} className="w-full py-2.5 bg-white border border-[#111111]/15 text-[#111111]/70 rounded-xl text-sm font-medium">Back to home</button>
          </div>
        </div>
      );
    }

    if (tab === 'home') {
      return (
        <DonorHome
          activityFeed={activityFeed}
          totalGivenKes={totalGivenKes}
          impactStats={impactStats}
          campaigns={campaigns}
          openLedgerModal={openLedgerModal}
          goTab={goTab}
          setSelectedActivity={setSelectedActivity}
          formatRelativeTime={formatRelativeTime}
        />
      );
    }
    if (tab === 'give') {
      return (
        <GiveFlow
          showSuccess={false}
          onCloseSuccess={() => setScreen('tab')}
          onViewDonations={() => { resetFlow(); setTab('give'); }}
          finalAmount={finalAmount}
          selected={selected}
          setSelected={setSelected}
          custom={custom}
          setCustom={setCustom}
          anon={anon}
          setAnon={setAnon}
          ledger={ledger}
          setLedger={setLedger}
          processing={processing}
          handleGive={handleGive}
          payingDonation={payingDonation}
          donorContributions={donorContributions}
        />
      );
    }

    if (tab === 'pledge') {
      return (
        <PledgeFlow
          showSuccess={false}
          onCloseSuccess={() => setScreen('tab')}
          onViewPledges={() => { resetFlow(); setTab('pledge'); }}
          pType={pType}
          setPType={setPType}
          pDesc={pDesc}
          setPDesc={setPDesc}
          pValue={pValue}
          setPValue={setPValue}
          pLocality={pLocality}
          setPLocality={setPLocality}
          pProcessing={pProcessing}
          handlePledge={handlePledge}
          pledges={pledges}
          payingPledge={payingPledge}
        />
      );
    }

    if (tab === 'leaders') {
      return (
        <DonorLeaders
          leaderboard={leaderboard}
          myProfile={myProfile}
          cancelEdit={() => setEditingProfile(false)}
          editingProfile={editingProfile}
          setEditingProfile={setEditingProfile}
          profileName={profileName}
          setProfileName={setProfileName}
          profileOptIn={profileOptIn}
          setProfileOptIn={setProfileOptIn}
          profileSaving={profileSaving}
          saveProfile={saveProfile}
        />
      );
    }

    if (tab === 'impact') {
      return (
        <DonorImpact goTab={setTab}
          impactStats={impactStats}
          distribution={distribution}
          donorContributions={donorContributions}
          openLedgerModal={openLedgerModal}
        />
      );
    }

    return (
      <div className="p-5 space-y-4">
        <div><h2 className="font-serif text-xl font-bold text-[#111111]">Impact</h2><p className="text-[12px] text-[#111111]/50 mt-0.5">Aggregate. Never individual.</p></div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Pooled', value: impactStats ? 'KES ' + (impactStats.total_pooled_pence / 100).toLocaleString() : '—', sub: 'Committed' },
            { label: 'Bundles', value: impactStats ? impactStats.bundles_delivered.toLocaleString() : '—', sub: 'Food & hygiene' },
            { label: 'Utility Meters', value: impactStats ? impactStats.utility_meters_paid.toLocaleString() : '—', sub: 'Power & water' },
            { label: 'Students', value: impactStats ? impactStats.student_terms_paid.toLocaleString() : '—', sub: 'Term fees' },
          ].map(s => (
            <div key={s.label} className="p-3 bg-white border border-[#111111]/5 shadow-sm rounded-xl">
              <div className="text-[11px] font-mono uppercase text-[#111111]/50 tracking-wider">{s.label}</div>
              <div className="font-mono text-lg font-bold text-[#1F6B4A] mt-0.5">{s.value}</div>
              <div className="text-[11px] text-[#111111]/40 font-mono">{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border border-[#111111]/5 shadow-sm rounded-2xl space-y-2.5">
          <h3 className="text-[11px] font-mono uppercase font-bold text-[#111111]/60 tracking-wider">Distribution</h3>
          {distribution.length === 0 ? (
            <EmptyState Icon={TrendingUp} title="No settled disbursements yet" body="Distribution will appear as data accrues." compact />
          ) : distribution.filter(r => r.count > 0).map(r => {
            const colorMap: Record<string, string> = {
              swap_bundle: 'bg-[#1F6B4A]',
              utility: 'bg-blue-600',
              school_fee: 'bg-amber-600',
              hospital_invoice: 'bg-rose-600',
            };
            return (
              <div key={r.category} className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono"><span className="text-[#111111]/70">{r.label}</span><span className="font-bold text-[#111111]">{r.percentage}%</span></div>
                <div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className={'h-full ' + (colorMap[r.category] || 'bg-[#1F6B4A]')} style={{ width: r.percentage + '%' }} /></div>
              </div>
            );
          })}
        </div>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
          <div className="text-[12px] font-bold text-rose-900">What we cannot show you</div>
          <ul className="text-[12px] text-rose-900/80 leading-relaxed space-y-0.5">
            <li>? Which specific person received your money</li>
            <li>? Their name, age, or precise location</li>
            <li>? Their medical condition (if any)</li>
            <li>? Which of your contributions went to which bill</li>
          </ul>
          <p className="text-[11px] text-rose-900/60 pt-1 border-t border-rose-200 leading-relaxed">Not because we are hiding it. Because this data does not exist on our servers. That is the entire point.</p>
        </div>

        <div className="p-4 bg-white border border-[#111111]/5 shadow-sm rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-mono uppercase font-bold text-[#111111]/60 tracking-wider">Recognition Ledger</h3>
            <span className="text-[10px] font-mono bg-[#DCE8E0] text-[#1F6B4A] px-1.5 py-0.5 rounded">Opt-in</span>
          </div>
          {leaderboard.length === 0 ? (
            <EmptyState Icon={ShieldCheck} title="No opt-in donors yet" body="Join via the Leaders tab." compact />
          ) : leaderboard.slice(0, 8).map((r, i) => (
            <div key={`${r.display_name}-${i}`} className="flex justify-between text-[10px] py-1.5 border-b border-[#111111]/5 last:border-0">
              <div className="min-w-0">
                <div className="text-[#111111] truncate flex items-center gap-1">
                  {myProfile?.display_name === r.display_name && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  {r.display_name}
                </div>
                <div className="text-[10px] text-[#111111]/40 font-mono">{r.gift_count} gift{r.gift_count !== 1 ? 's' : ''}</div>
              </div>
              <span className="font-mono font-bold text-[#1F6B4A] shrink-0 ml-2">KES {(r.total_pence / 100).toLocaleString()}</span>
            </div>
          ))}
        </div> </div>
    );
  };

  if (channel === 'sms') {
    return (
      <div className="min-h-screen bg-[#F6F4EE] flex flex-col items-center py-6 px-4">
        <button
          onClick={() => setChannel('web')}
          className="self-start max-w-[340px] w-full mb-3 text-xs font-medium text-[#111111]/60 hover:text-[#111111]"
        >
          Back to Donor Portal
        </button>
        <SmsDonorSimulator />
      </div>
    );
  }
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Donor Portal</h1>
          <p className="text-sm text-muted mt-1">Blind-pooled giving</p>
        </div>
        <button onClick={() => setScreen('settings')} className="p-2 rounded-full hover:bg-tint transition-colors bg-surface border border-tile shadow-sm">
          <Settings className="w-5 h-5 text-ink" />
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full">
        {renderContent()}
      </main>
        </div>
      </div>
      <AppBottomNav tabs={TABS} active={tab} onChange={goTab} />
    </>
  );
};
