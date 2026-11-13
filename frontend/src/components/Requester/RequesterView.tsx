import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { peekRate, consumeRate, loadHistory, saveHistory, loadSeen, saveSeen } from '../../services/auth';
import { getSurveyStatus, getHelplines, getHouseholdSize as apiGetHousehold, getOpportunities, getUnreadNotificationCount, setHouseholdSize as apiSetHousehold, uploadPoolEvidence } from '../../lib/apiClient';
import {
  HeartHandshake, Shield, Package, CreditCard, Users, MessageCircle,
  Home, MapPin, Check, CheckCircle, Clock, Copy, ScanLine, ArrowRight,
  AlertTriangle, FileText, Zap, GraduationCap, Building2, Droplet, Briefcase,
  X, Phone, ShieldCheck, ShieldAlert, Eye, EyeOff, RotateCcw, LogOut, Bell, AlertCircle, Trash2,
  MessageSquare, ArrowLeft, Settings,
} from 'lucide-react';
import { StatusTimeline } from './StatusTimeline';
import { EmptyState } from '../Shared/EmptyState';
import { AppBottomNav } from '../layout/AppBottomNav';
import { useToast } from '../Shared/Toast';
import { SwapRequest, PoolRequest } from '../../types';
import { RequesterMessages } from './Messages';
import { RequesterHome } from './RequesterHome';
import { IntakeSurveyPrompt } from './IntakeSurveyPrompt';
import { IntakeSurveyModal } from './IntakeSurveyModal';
import { RequesterIntake } from './RequesterIntake';
import { SwapFlow } from './SwapFlow';
import { PoolFlow } from './PoolFlow';
import { MatchTab } from './MatchTab';
import { BenchTab } from './BenchTab';
import { HouseholdSetup } from './HouseholdSetup';
import { SettingsTab } from './SettingsTab';
import { MpesaModal } from './MpesaModal';

type Tab = 'home' | 'swap' | 'pool' | 'match' | 'bench' | 'messages' | 'settings';
type SwapStep = 'bundle' | 'location' | 'success';
type PoolStep = 'category' | 'details' | 'photo' | 'success';
type PoolCat = 'utility' | 'school_fee' | 'hospital_invoice';
type IntakeStep = 'phone' | 'otp';

const MAX_REQUESTS = 25;
const MAX_VALUE = 100000;
const MAX_OTP_ATTEMPTS = 3;
const OTP_RESEND_SECONDS = 30;

const BUNDLES = [
  { id: 'Standard Pantry', name: 'Standard Pantry', desc: 'Maize flour, rice, oil, lentils.', Icon: Package, accent: 'text-[#1F6B4A] bg-[#DCE8E0]' },
  { id: 'Hygiene Kit', name: 'Hygiene & Dignity', desc: 'Soap, sanitary pads, toothpaste.', Icon: Droplet, accent: 'text-blue-700 bg-blue-50' },
];

const LOCATIONS = [
  { id: 'Kibera Hub', sub: '24/7 * 12 available' },
  { id: 'Mathare Central', sub: '6am-10pm * 18 available' },
  { id: 'Kawangware Station', sub: '24/7 * 4 available' },
];

const POOL_CATS: { id: PoolCat; name: string; desc: string; Icon: any; accent: string; objLabel: string; placeholder: string }[] = [
  { id: 'utility', name: 'Utility Bill', desc: 'KPLC or Nairobi Water', Icon: Zap, accent: 'text-amber-700 bg-amber-50', objLabel: 'Meter number', placeholder: 'e.g. 541234567' },
  { id: 'school_fee', name: 'School Fees', desc: 'Secondary term fees', Icon: GraduationCap, accent: 'text-[#1F6B4A] bg-[#DCE8E0]', objLabel: 'Admission number', placeholder: 'e.g. 2024118' },
  { id: 'hospital_invoice', name: 'Hospital Invoice', desc: 'No clinical details', Icon: Building2, accent: 'text-blue-700 bg-blue-50', objLabel: 'Invoice number', placeholder: 'e.g. 78432' },
];

export const RequesterView: React.FC = () => {
  const { tokenHash, initializeSession, logout, swapRequests, poolRequests, executeSwap, executePool, withdrawRequest, expressInterest, vouchers, voucherRedemptions, collectRequest } = useApp();
  const [payingRequest, setPayingRequest] = useState<{ id: string; amount: number } | null>(null);
  const [showIntakePrompt, setShowIntakePrompt] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [surveyRequestId, setSurveyRequestId] = useState<string | null>(null);
  const [familySize, setFamilySize] = useState<number | null>(null);

  const [intakeStep, setIntakeStep] = useState<IntakeStep>('phone');
  const [isScrolled, setIsScrolled] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [householdStep, setHouseholdStep] = useState<boolean>(false);
  const [householdSize, setHouseholdSize] = useState<number>(1);
  const [householdMode, setHouseholdMode] = useState<'alone' | 'family' | null>(null);
  const [householdError, setHouseholdError] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpProcessing, setOtpProcessing] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [tab, setTab] = useState<Tab>('home');
  const [showServer, setShowServer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rate, setRate] = useState({ count: 0, value: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [seen, setSeen] = useState<string[]>([]);

  const { push } = useToast();

  const [swapStep, setSwapStep] = useState<SwapStep>('bundle');
  const [swapBundle, setSwapBundle] = useState<string | null>(null);
  const [swapLocation, setSwapLocation] = useState<string | null>(null);
  const [swapResult, setSwapResult] = useState<SwapRequest | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  const [poolStep, setPoolStep] = useState<PoolStep>('category');
  const [poolCat, setPoolCat] = useState<PoolCat | null>(null);
  const [poolObject, setPoolObject] = useState('');
  const [poolAmount, setPoolAmount] = useState('');
  const [poolResult, setPoolResult] = useState<PoolRequest | null>(null);
  const [pooling, setPooling] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [matchConfirmed, setMatchConfirmed] = useState(false);
  const [matchSent, setMatchSent] = useState<string | null>(null);
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [opportunities, setOpportunities] = useState<{ id: string; type: string; title: string; description: string; locality: string; commit: string; posted_at: string }[]>([]);
  const [helplines, setHelplines] = useState<{ id: string; name: string; number: string; sub: string; category: string }[]>([]);


  useEffect(() => {
    if (!tokenHash) return;
    // Check for the most recent approved request that doesn't have a survey yet
    const activeReq = poolRequests.find(r => ['verified', 'pending_check', 'pending_evidence'].includes(r.status));
    if (activeReq) {
      getSurveyStatus(tokenHash, activeReq.id)
        .then(res => {
          if (res && res.can_submit_intake && !res.has_intake) {
            setShowIntakePrompt(true);
            setSurveyRequestId(activeReq.id);
          }
        })
        .catch(() => {});
    }
  }, [tokenHash, poolRequests]);

  useEffect(() => {
    if (!tokenHash) return;
    const r = peekRate(tokenHash);
    setRate({ count: r.count, value: r.value });
    setHistory(loadHistory(tokenHash));
    setSeen(loadSeen(tokenHash));
  }, [tokenHash]);

  useEffect(() => {
    if (!tokenHash) return;
    const liveMap = new Map([...swapRequests, ...poolRequests].map(r => [r.id, r]));

    const patched = history.map(h => {
      const live = liveMap.get(h.id);
      return live ? { ...h, status: live.status, paymentStatus: (live as any).paymentStatus } : h;
    });

    const historyIds = new Set(history.map(h => h.id));
    const newEntries = [...swapRequests, ...poolRequests]
      .filter(r => !historyIds.has(r.id))
      .map(r => {
        const isSwap = 'bundleCategory' in r;
        return {
          id: r.id,
          type: isSwap ? 'swap' : 'pool',
          status: r.status,
          paymentStatus: (r as any).paymentStatus,
          bundleCategory: isSwap ? (r as any).bundleCategory : undefined,
          lockerLocation: isSwap ? (r as any).lockerLocation : undefined,
          pin: isSwap ? (r as any).pin : undefined,
          category: !isSwap ? (r as any).category : undefined,
          amount: !isSwap ? (r as any).amount : undefined,
          hashedObjectId: !isSwap ? (r as any).hashedObjectId : undefined,
          timestamp: (r as any).timestamp,
        };
      });

    const anyNew = newEntries.length > 0;
    const anyChanged = patched.some((m, i) => m.status !== history[i]?.status);

    if (anyNew || anyChanged) {
      const merged = [...newEntries, ...patched];
      saveHistory(tokenHash, merged);
      setHistory(merged);
      const nr = peekRate(tokenHash);
      setRate({ count: nr.count, value: nr.value });
    }
  }, [swapRequests, poolRequests, tokenHash, history]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOpp(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!tokenHash) { setUnreadCount(0); return; }
    let cancelled = false;
    const fetchCount = async () => {
      const r = await getUnreadNotificationCount(tokenHash);
      if (!cancelled) setUnreadCount(r?.unread_count || 0);
    };
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [tokenHash, tab]);

  useEffect(() => {
    (async () => {
      const [opps, helps] = await Promise.all([getOpportunities(), getHelplines()]);
      if (opps) setOpportunities(opps.opportunities);
      if (helps) setHelplines(helps.helplines);
    })();
  }, []);

  const OPP_ICONS: Record<string, any> = { job: Briefcase, housing: Home, training: GraduationCap, transport: Package };
  const OPP_COLORS: Record<string, string> = {
    job: 'text-blue-700 bg-blue-50',
    housing: 'text-[#1F6B4A] bg-[#DCE8E0]',
    training: 'text-amber-700 bg-amber-50',
    transport: 'text-purple-700 bg-purple-50',
  };
  const opportunitiesWithIcons = opportunities.map(o => ({
    ...o,
    Icon: OPP_ICONS[o.type] || Briefcase,
    accent: OPP_COLORS[o.type] || 'text-blue-700 bg-blue-50',
    desc: o.description,
  }));

  const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

  const maskPhone = (p: string): string => {
  const digits = p.replace(/\D/g, '');
  if (digits.length < 4) return p;
  const last3 = digits.slice(-3);
  const stars = '*'.repeat(Math.max(3, digits.length - 3));
  const prefix = p.trim().startsWith('+') ? '+' : '';
  return prefix + stars + last3;
};

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    if (digits.length > 15) {
      setPhoneError('Phone number too long (max 15 digits).');
      return;
    }
    setPhoneError(null);
    setGeneratedOtp(generateOtp());
    setOtpInput('');
    setOtpError(null);
    setOtpAttempts(0);
    setResendCooldown(OTP_RESEND_SECONDS);
    setIntakeStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length !== 4 || otpProcessing) return;
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      setOtpError('Too many attempts. Resend a new code or use a different number.');
      return;
    }
    if (otpInput !== generatedOtp) {
      const remaining = MAX_OTP_ATTEMPTS - otpAttempts - 1;
      setOtpError(remaining > 0 ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many attempts. Resend a new code.');
      setOtpAttempts(a => a + 1);
      setOtpInput('');
      return;
    }

    setOtpProcessing(true);
    try {
      const tok = await initializeSession(phone, 'web');
      const hh = await apiGetHousehold(tok);
      if (!hh?.declared) {
        setHouseholdStep(true);
        setHouseholdMode(null);
        setHouseholdError(null);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpProcessing(false);
    }
  };

  const handleResend = () => {
    setGeneratedOtp(generateOtp());
    setOtpInput('');
    setOtpError(null);
    setOtpAttempts(0);
    setResendCooldown(OTP_RESEND_SECONDS);
  };

  const handleBackToPhone = () => {
    setIntakeStep('phone');
    setOtpInput('');
    setGeneratedOtp('');
    setOtpError(null);
    setOtpAttempts(0);
    setResendCooldown(0);
  };

  const mergedHistory = history;
  const unseen = mergedHistory.filter(h => h.status === 'submitted_to_partner' && !seen.includes(h.id));
  const dismissUnseen = () => {
    if (!tokenHash) return;
    const next = [...seen, ...unseen.map(u => u.id)];
    setSeen(next);
    saveSeen(tokenHash, next);
  };

  const goTab = (t: Tab) => {
    setTab(t);
    if (t === 'swap') { setSwapStep('bundle'); setSwapBundle(null); setSwapLocation(null); setSwapResult(null); setSwapError(null); }
    if (t === 'pool') { setPoolStep('category'); setPoolCat(null); setPoolObject(''); setPoolAmount(''); setPoolResult(null); setPoolError(null); }
    if (t === 'match') { setSelectedOpp(null); setMatchSent(null); setMatchConfirmed(false); }
  };

  const handleReserve = async () => {
    if (!swapBundle || !swapLocation || rateLimited || swapping) return;
    setSwapping(true); setSwapError(null);
    try {
      const rateCheck = tokenHash ? consumeRate(tokenHash, 0) : { ok: true };
      if (!rateCheck.ok) { const msg = (rateCheck as any).reason || 'Daily limit reached.'; setSwapError(msg); push({ kind: 'error', message: msg }); setSwapping(false); return; }
      const res = await executeSwap(swapBundle, swapLocation);
      if (!res) { setSwapError('Could not reach the locker partner. Please retry.'); push({ kind: 'error', message: 'Locker partner unreachable — try again' }); setSwapping(false); return; }
      setSwapResult(res); setSwapStep('success'); push({ kind: 'success', message: 'Locker reserved' });
      const next = peekRate(tokenHash!);
      setRate({ count: next.count, value: next.value });
      if (tokenHash) setHistory(loadHistory(tokenHash));
    } catch { setSwapError('Unexpected error. Try again.'); push({ kind: 'error', message: 'Swap failed — try again' }); }
    setSwapping(false);
  };

  const handleSubmitPool = async () => {
    if (!poolCat || !poolObject || !numAmount || !objectValid || rateLimited || pooling) return;
    if (numAmount > valueRemaining) { setPoolError(`Remaining session allowance is KES ${valueRemaining.toLocaleString()}.`); return; }
    setPooling(true); setPoolError(null);
    try {
      const rateCheck = tokenHash ? consumeRate(tokenHash, numAmount) : { ok: true };
      if (!rateCheck.ok) { const msg = (rateCheck as any).reason || 'Daily limit reached.'; setPoolError(msg); push({ kind: 'error', message: msg }); setPooling(false); return; }
      const res = await executePool(poolCat, poolObject, numAmount);
      if (!res) { setPoolError('Could not submit. Check the number format and try again.'); push({ kind: 'error', message: 'Submit failed - check number format' }); setPooling(false); return; }
      setPoolResult(res);
      if (res.status === 'pending_evidence') {
        setPoolStep('photo');
      } else {
        setPoolStep('success');
      }
      const next = peekRate(tokenHash!);
      setRate({ count: next.count, value: next.value });
      if (tokenHash) setHistory(loadHistory(tokenHash));
    } catch { setPoolError('Unexpected error. Try again.'); push({ kind: 'error', message: 'Submit failed — try again' }); }
    setPooling(false);
  };

  const handleUploadEvidence = async (file: File) => {
    if (!poolResult?.id || !tokenHash) return;
    setEvidenceUploading(true);
    setEvidenceError(null);
    try {
      const result = await uploadPoolEvidence(tokenHash, poolResult.id, file);
      if (result?.ok) {
        setPoolStep('success');
        push({ kind: 'success', message: 'Photo submitted. Under review.' });
      } else {
        setEvidenceError('Upload failed. Try a different file or check your connection.');
      }
    } catch {
      setEvidenceError('Upload error. Try again.');
    }
    setEvidenceUploading(false);
  };

  const handleWithdraw = (id: string, type: 'swap' | 'pool') => {
    withdrawRequest(id, type);
    if (tokenHash) {
      const h = loadHistory(tokenHash);
      const updated = h.map((x: any) => x.id === id ? { ...x, status: 'withdrawn' } : x);
      saveHistory(tokenHash, updated);
      setHistory(updated);
    }
  };

  const copyPin = () => {
    if (!swapResult) return;
    navigator.clipboard?.writeText(swapResult.pin);
    setPinCopied(true); setTimeout(() => setPinCopied(false), 1800);
  };

  const QrPlaceholder = ({ seed }: { seed: string }) => {
    const cells = Array.from({ length: 121 }, (_, i) => {
      const code = seed.charCodeAt(i % seed.length) || 1;
      return (code * (i + 1)) % 3 === 0;
    });
    return (<div className="w-20 h-20 grid grid-cols-11 gap-[1px] p-1 bg-white border-2 border-[#111111] rounded">{cells.map((on, i) => <div key={i} className={on ? 'bg-[#111111]' : 'bg-white'} />)}</div>);
  };

  const numAmount = Number(poolAmount);
  const willEscalate = numAmount > 5000;
  const objectDigits = poolObject.replace(/\D/g, '').length;
  const objectValid = objectDigits >= 4;
  const rateLimited = rate.count >= MAX_REQUESTS || rate.value >= MAX_VALUE;
  const valueRemaining = Math.max(0, MAX_VALUE - rate.value);
  const objectError = poolObject.length > 0 && !objectValid ? 'Object number must contain at least 4 digits.' : null;

  const myVouchers = vouchers.filter(v => v.issuedToken === tokenHash);
  const myVoucherRedemptions = voucherRedemptions
    .map(r => ({ redemption: r, voucher: vouchers.find(v => v.id === r.voucherId) }))
    .filter(x => x.voucher && x.voucher.issuedToken === tokenHash);
  const unseenRedemptions = myVoucherRedemptions.filter(x => x.redemption.status === 'success' && !seen.includes('R-' + x.redemption.id));
  const dismissRedemptions = () => {
    if (!tokenHash) return;
    const next = [...seen, ...unseenRedemptions.map(x => 'R-' + x.redemption.id)];
    setSeen(next);
    saveSeen(tokenHash, next);
  };
  const sessionStats = (() => {
    const total = mergedHistory.length;
    const dispatched = mergedHistory.filter(h => h.status === 'submitted_to_partner').length;
    const pending = mergedHistory.filter(h => h.status === 'pending_check' || h.status === 'verified').length;
    const totalValue = mergedHistory.reduce((a, h) => a + (h.amount || 0), 0);
    return { total, dispatched, pending, totalValue };
  })();


  const renderHome = () => (
    <RequesterHome intakePrompt={showIntakePrompt ? <IntakeSurveyPrompt onOpen={() => setShowIntakeModal(true)} onDismiss={() => setShowIntakePrompt(false)} /> : null}
      tokenHash={tokenHash}
      unseenRedemptions={unseenRedemptions}
      dismissRedemptions={dismissRedemptions}
      unseen={unseen}
      dismissUnseen={dismissUnseen}
      rate={rate}
      MAX_REQUESTS={MAX_REQUESTS}
      rateLimited={rateLimited}
      goTab={goTab}
      myVouchers={myVouchers}
      mergedHistory={mergedHistory}
      swapRequests={swapRequests}
      handleWithdraw={handleWithdraw}
      collectError={collectError}
      setCollectError={setCollectError}
      collectRequest={collectRequest}
      setPayingRequest={setPayingRequest}
      sessionStats={sessionStats}
    />
  );

  const renderSwap = () => (
    <SwapFlow
      swapStep={swapStep}
      setSwapStep={setSwapStep}
      swapBundle={swapBundle}
      setSwapBundle={setSwapBundle}
      swapLocation={swapLocation}
      setSwapLocation={setSwapLocation}
      swapResult={swapResult}
      swapError={swapError}
      swapping={swapping}
      rateLimited={rateLimited}
      handleReserve={handleReserve}
      copyPin={copyPin}
      pinCopied={pinCopied}
      goTab={goTab}
    />
  );

  const renderPool = () => (
    <PoolFlow
      poolStep={poolStep}
      setPoolStep={setPoolStep}
      poolResult={poolResult}
      poolCat={poolCat}
      setPoolCat={setPoolCat}
      poolObject={poolObject}
      setPoolObject={setPoolObject}
      poolAmount={poolAmount}
      setPoolAmount={setPoolAmount}
      poolError={poolError}
      setPoolError={setPoolError}
      objectError={objectError}
      objectValid={objectValid}
      willEscalate={willEscalate}
      numAmount={numAmount}
      valueRemaining={valueRemaining}
      pooling={pooling}
      rateLimited={rateLimited}
      handleSubmitPool={handleSubmitPool}
      evidenceUploading={evidenceUploading}
      evidenceError={evidenceError}
      handleUploadEvidence={handleUploadEvidence}
      goTab={goTab}
    />
  );

  const renderMatch = () => (
    <MatchTab
      opportunitiesWithIcons={opportunitiesWithIcons}
      declined={declined}
      setDeclined={setDeclined}
      matchSent={matchSent}
      setMatchSent={setMatchSent}
      selectedOpp={selectedOpp}
      setSelectedOpp={setSelectedOpp}
      matchConfirmed={matchConfirmed}
      setMatchConfirmed={setMatchConfirmed}
      expressInterest={expressInterest}
    />
  );

  const renderBench = () => (
    <BenchTab helplines={helplines} />
  );

  const renderContent = () => {
    if (tab === 'home') return renderHome();
    if (tab === 'swap') return renderSwap();
    if (tab === 'pool') return renderPool();
    if (tab === 'match') return renderMatch();
    if (tab === 'messages') return <RequesterMessages />;
    if (tab === 'settings') return renderSettings();
    return renderBench();
  };

  const handleHouseholdComplete = async (size: number) => {
    if (!tokenHash) return;
    try {
      await apiSetHousehold(tokenHash, size);
      setHouseholdStep(false);
      setHouseholdMode(null);
      setHouseholdError(null);
    } catch {
      setHouseholdError('Could not save. Please try again.');
    }
  };

  const renderHouseholdStep = () => (
    <HouseholdSetup
      householdMode={householdMode}
      setHouseholdMode={setHouseholdMode}
      householdSize={householdSize}
      setHouseholdSize={setHouseholdSize}
      householdError={householdError}
      handleHouseholdComplete={handleHouseholdComplete}
    />
  );

  if (!tokenHash) {
    return (
      <RequesterIntake
        intakeStep={intakeStep}
        phone={phone}
        setPhone={setPhone}
        phoneError={phoneError}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        otpError={otpError}
        otpProcessing={otpProcessing}
        resendCooldown={resendCooldown}
        generatedOtp={generatedOtp}
        handleSendOtp={handleSendOtp}
        handleVerifyOtp={handleVerifyOtp}
        handleResend={handleResend}
        handleBackToPhone={handleBackToPhone}
      />
    );
  }


  if (householdStep) {
    return renderHouseholdStep();
  }
  const renderSettings = () => (
    <SettingsTab
      tokenHash={tokenHash}
      rate={rate}
      MAX_REQUESTS={MAX_REQUESTS}
      MAX_VALUE={MAX_VALUE}
      historyCount={mergedHistory.length}
      showServer={showServer}
      setShowServer={setShowServer}
      onBack={() => setTab('home')}
      onReset={() => {
        setTab('home');
        setShowServer(false);
        logout();
        setIntakeStep('phone');
        setPhone('');
        setOtpInput('');
        setGeneratedOtp('');
        setOtpAttempts(0);
        setResendCooldown(0);
      }}
      logout={logout}
    />
  );


  const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: 'Home', Icon: Home }, { id: 'swap', label: 'Swap', Icon: Package }, { id: 'pool', label: 'Pool', Icon: CreditCard }, { id: 'match', label: 'Match', Icon: Users }, { id: 'bench', label: 'Bench', Icon: MessageCircle },
  ];


  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mutual Circle</h1>
          <p className="text-sm text-muted font-mono mt-1">
            {tokenHash ? `Token: ${tokenHash.slice(0, 12)}...` : 'Anonymous'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('messages')} className="relative p-2 rounded-full hover:bg-tint transition-colors bg-surface border border-tile shadow-sm">
            <Bell className="w-5 h-5 text-ink" />
            {unreadCount > 0 && <span className="absolute top-0 right-0 min-w-[16px] h-[16px] bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <button onClick={() => setTab('settings')} className="p-2 rounded-full hover:bg-tint transition-colors bg-surface border border-tile shadow-sm">
            <Settings className="w-5 h-5 text-ink" />
          </button>
          <button onClick={logout} className="p-2 rounded-full hover:bg-rose-50 transition-colors bg-surface border border-tile shadow-sm">
            <LogOut className="w-5 h-5 text-ink" />
          </button>
        </div>
      </div>

      {/* Main Content (from renderContent) */}
      <main className="w-full">
        {renderContent()}
      </main>
        </div>
      </div>
      <AppBottomNav tabs={TABS} active={tab} onChange={goTab} />
      {payingRequest && (
        <MpesaModal mode="request" targetId={payingRequest.id} amount={payingRequest.amount} onClose={() => setPayingRequest(null)} />
      )}
    </>
  );
};
