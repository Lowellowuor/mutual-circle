import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PoolCategory, ResourceRequest } from '../../types';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { 
  Zap, 
  Droplet, 
  GraduationCap, 
  Plus, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Delete,
  Info 
} from 'lucide-react';

export const PoolFlow: React.FC = () => {
  const { addPoolRequest, setRequesterScreen, t } = useApp();

  // Steps: 1 = Amount & Keypad, 2 = 3 Verification Checks, 3 = Done
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<PoolCategory>('utility');
  const [amountStr, setAmountStr] = useState<string>('1500');
  const [accountNumber, setAccountNumber] = useState<string>('3719024819');

  // Animated 3 checks
  const [check1, setCheck1] = useState<'pending' | 'running' | 'passed'>('pending');
  const [check2, setCheck2] = useState<'pending' | 'running' | 'passed'>('pending');
  const [check3, setCheck3] = useState<'pending' | 'running' | 'passed'>('pending');

  const [confirmedReq, setConfirmedReq] = useState<ResourceRequest | null>(null);
  const [infoSheetOpen, setInfoSheetOpen] = useState<boolean>(false);

  const categories = [
    { id: 'utility' as PoolCategory, label: t('cat_utility'), icon: Zap },
    { id: 'utility' as PoolCategory, label: t('cat_water'), icon: Droplet },
    { id: 'school' as PoolCategory, label: t('cat_school'), icon: GraduationCap },
    { id: 'hospital' as PoolCategory, label: t('cat_hospital'), icon: Plus }
  ];

  const handleKeyPress = (digit: string) => {
    if (digit === 'C') {
      setAmountStr('0');
      return;
    }
    if (digit === 'back') {
      setAmountStr(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    setAmountStr(prev => {
      if (prev === '0') return digit;
      if (prev.length >= 6) return prev;
      return prev + digit;
    });
  };

  const handleStartChecks = () => {
    setStep(2);
    setCheck1('running');
    setCheck2('pending');
    setCheck3('pending');

    setTimeout(() => {
      setCheck1('passed');
      setCheck2('running');
      setTimeout(() => {
        setCheck2('passed');
        setCheck3('running');
        setTimeout(() => {
          setCheck3('passed');
          const req = addPoolRequest({
            category,
            subType: category === 'school' ? 'Tuition' : 'Utility',
            objectId: accountNumber,
            amount: Number(amountStr) || 1500
          });
          setConfirmedReq(req);
        }, 500);
      }, 500);
    }, 500);
  };

  // STEP 3: DONE
  if (step === 3) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 pb-20 animate-in fade-in text-center">
        <div className="h-14 flex items-center justify-between border-b border-[#111111]/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRequesterScreen('home')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <h1 className="font-serif text-[28px] font-bold text-[#111111]">
              {t('pool_title')}
            </h1>
          </div>
        </div>

        <div className="p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#DCE8E0] text-[#1F6B4A] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-[#111111]">
            {t('status_submitted_msg')}
          </div>
        </div>

        <div className="pt-4">
          <Button
            fullWidth
            size="sticky"
            onClick={() => setRequesterScreen('home')}
          >
            {t('btn_done')}
          </Button>
        </div>
      </div>
    );
  }

  // STEP 2: THREE ANIMATED CHECKS & REVIEW
  if (step === 2) {
    const allPassed = check1 === 'passed' && check2 === 'passed' && check3 === 'passed';

    return (
      <div className="w-full max-w-md mx-auto space-y-5 pb-20 animate-in fade-in">
        
        {/* Top Header */}
        <div className="h-14 flex items-center justify-between border-b border-[#111111]/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <h1 className="font-serif text-[28px] font-bold text-[#111111]">
              {t('pool_title')}
            </h1>
          </div>
          <button
            onClick={() => setInfoSheetOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
            aria-label="Pool info"
          >
            <Info className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Hard rule fixed line */}
        <div className="text-sm font-semibold text-[#1F6B4A] text-center py-1">
          {t('pool_nocash')}
        </div>

        {/* 3 Checks as rows with spinning ring turning into a tick */}
        <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 space-y-4">
          
          {/* Check 1 */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-[#111111]">{t('check_record')}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              {check1 === 'running' && (
                <div className="w-5 h-5 border-2 border-[#1F6B4A] border-t-transparent rounded-full animate-spin" />
              )}
              {check1 === 'passed' && (
                <div className="w-6 h-6 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center transition-all duration-250 animate-in zoom-in">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#111111]/10" />

          {/* Check 2 */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-[#111111]">{t('check_balance')}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              {check2 === 'running' && (
                <div className="w-5 h-5 border-2 border-[#1F6B4A] border-t-transparent rounded-full animate-spin" />
              )}
              {check2 === 'passed' && (
                <div className="w-6 h-6 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center transition-all duration-250 animate-in zoom-in">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#111111]/10" />

          {/* Check 3 */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-[#111111]">{t('check_amount')}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              {check3 === 'running' && (
                <div className="w-5 h-5 border-2 border-[#1F6B4A] border-t-transparent rounded-full animate-spin" />
              )}
              {check3 === 'passed' && (
                <div className="w-6 h-6 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center transition-all duration-250 animate-in zoom-in">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Sticky Primary Action: 52px */}
        <div className="pt-3">
          <Button
            fullWidth
            size="sticky"
            disabled={!allPassed}
            onClick={() => setStep(3)}
          >
            {t('btn_submit')}
          </Button>
        </div>

        {/* Info Sheet */}
        <Sheet
          isOpen={infoSheetOpen}
          onClose={() => setInfoSheetOpen(false)}
          title={t('pool_title')}
        >
          <div className="space-y-3">
            <p>Direct institutional settlement for electricity, water, and tuition.</p>
            <p>All disbursements move through regulated payment partners.</p>
            <Button fullWidth variant="outline" size="md" onClick={() => setInfoSheetOpen(false)}>
              {t('btn_close')}
            </Button>
          </div>
        </Sheet>

      </div>
    );
  }

  // STEP 1: AMOUNT SCREEN WITH NUMERIC KEYPAD (M-PESA STYLE)
  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20 animate-in fade-in">
      
      {/* Top Header: 56px */}
      <div className="h-14 flex items-center justify-between border-b border-[#111111]/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRequesterScreen('home')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111] cursor-pointer"
            aria-label="Back home"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <h1 className="font-serif text-[28px] font-bold text-[#111111]">
            {t('pool_title')}
          </h1>
        </div>
        <button
          onClick={() => setInfoSheetOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
          aria-label="Pool info"
        >
          <Info className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Category Icons Row */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {categories.map((cat, idx) => {
          const isSelected = category === cat.id && (idx === 0 || idx === 2 || idx === 3);
          const IconComp = cat.icon;
          return (
            <button
              key={idx}
              onClick={() => setCategory(cat.id)}
              className={`min-h-[44px] p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-white border-2 border-[#1F6B4A]' 
                  : 'bg-white border border-[#111111]/10 hover:bg-black/5'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center">
                <IconComp className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-[#111111]">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Large Amount Display */}
      <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 text-center space-y-1">
        <div className="text-sm font-medium text-[#111111]/60">KES</div>
        <div className="font-mono text-4xl font-bold text-[#111111] tracking-tight">
          {Number(amountStr).toLocaleString()}
        </div>
      </div>

      {/* Account Number Input */}
      <div className="px-1">
        <input
          type="text"
          value={accountNumber}
          onChange={e => setAccountNumber(e.target.value)}
          placeholder="Account or Meter"
          className="w-full px-4 h-[44px] rounded-xl bg-white border border-[#111111]/15 text-sm font-mono text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1F6B4A]"
        />
      </div>

      {/* M-Pesa Style Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-[#FAF8F4] rounded-2xl border border-[#111111]/10">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'back'].map(k => (
          <button
            key={k}
            onClick={() => handleKeyPress(k)}
            className="min-h-[48px] h-12 rounded-xl bg-white border border-[#111111]/10 flex items-center justify-center text-lg font-bold font-mono text-[#111111] active:scale-95 transition-transform cursor-pointer"
          >
            {k === 'back' ? <Delete className="w-5 h-5 text-[#111111]/70" /> : k}
          </button>
        ))}
      </div>

      {/* Sticky Primary Action: 52px */}
      <div className="pt-2">
        <Button
          fullWidth
          size="sticky"
          onClick={handleStartChecks}
        >
          {t('btn_submit')}
        </Button>
      </div>

      {/* Info Sheet */}
      <Sheet
        isOpen={infoSheetOpen}
        onClose={() => setInfoSheetOpen(false)}
        title={t('pool_title')}
      >
        <div className="space-y-3">
          <p>Direct institutional settlement for electricity, water, and tuition.</p>
          <Button fullWidth variant="outline" size="md" onClick={() => setInfoSheetOpen(false)}>
            {t('btn_close')}
          </Button>
        </div>
      </Sheet>

    </div>
  );
};
