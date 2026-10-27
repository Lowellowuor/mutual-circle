import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PoolCategory, PoolRequestInput, NetworkRequest } from '../../types';
import { 
  ReceiptText, 
  Lightbulb, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ShieldCheck, 
  ArrowRight, 
  FileText,
  Clock,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const PoolFlow: React.FC = () => {
  const { addPoolRequest, setRequesterScreen, requesterScreen, t } = useApp();

  const [step, setStep] = useState<'category' | 'input' | 'verify' | 'review' | 'confirmed' | 'duplicate_error'>('category');

  useEffect(() => {
    if (requesterScreen === 'duplicate_demo') {
      setStep('duplicate_error');
    }
  }, [requesterScreen]);
  const [selectedCategory, setSelectedCategory] = useState<PoolCategory>('utility');
  const [subType, setSubType] = useState<string>('KPLC Prepaid Electricity');
  const [objectId, setObjectId] = useState<string>('84210091823');
  const [amount, setAmount] = useState<number>(2200);
  
  // Verification animation state
  const [check1, setCheck1] = useState<'pending' | 'running' | 'passed' | 'failed'>('pending');
  const [check2, setCheck2] = useState<'pending' | 'running' | 'passed' | 'failed'>('pending');
  const [check3, setCheck3] = useState<'pending' | 'running' | 'passed' | 'failed'>('pending');
  const [verificationError, setVerificationError] = useState<boolean>(false);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [photoScanStatus, setPhotoScanStatus] = useState<'idle' | 'scanning' | 'passed'>('idle');

  const [createdRequest, setCreatedRequest] = useState<NetworkRequest | null>(null);

  // Category configs
  const categoryConfigs: { 
    id: PoolCategory; 
    title: string; 
    icon: React.ReactNode; 
    defaultSubTypes: string[]; 
    idLabel: string;
    placeholder: string;
    helper: string;
  }[] = [
    {
      id: 'utility',
      title: 'Utility Bill (Power & Water)',
      icon: <Lightbulb className="w-5 h-5 text-[#1F6B4A]" />,
      defaultSubTypes: ['KPLC Prepaid Electricity', 'KPLC Postpaid Electricity', 'Nairobi Water (NCWSC)'],
      idLabel: '11-Digit Meter / Account Number',
      placeholder: 'e.g. 84210091823',
      helper: 'Token or receipt will be settled directly to the institutional utility ledger.'
    },
    {
      id: 'school',
      title: 'School Fees (Tuition)',
      icon: <GraduationCap className="w-5 h-5 text-[#1F6B4A]" />,
      defaultSubTypes: ['Secondary Term Fees', 'Primary School Tuition', 'Technical Vocational Fees'],
      idLabel: 'Student Admission Number & School Name',
      placeholder: 'e.g. ADM-9024 (Parklands Sec)',
      helper: 'Submitted to payment partner for direct settlement to the school institution bank account.'
    },
    {
      id: 'hospital',
      title: 'Hospital Invoice',
      icon: <Building2 className="w-5 h-5 text-[#1F6B4A]" />,
      defaultSubTypes: ['County Hospital Invoice', 'Sub-County Health Centre Bill'],
      idLabel: 'Hospital Invoice Number & Facility Only',
      placeholder: 'e.g. 48213 (Nairobi West)',
      helper: 'Notice: We require ONLY the invoice number and outstanding amount. No diagnosis, treatment, or clinical details are ever collected.'
    }
  ];

  const currentConfig = categoryConfigs.find(c => c.id === selectedCategory) || categoryConfigs[0];

  const handleCategorySelect = (cat: PoolCategory) => {
    setSelectedCategory(cat);
    const cfg = categoryConfigs.find(c => c.id === cat)!;
    setSubType(cfg.defaultSubTypes[0]);
    if (cat === 'utility') {
      setObjectId('84210091823');
      setAmount(2200);
    } else if (cat === 'school') {
      setObjectId('SCH-9024');
      setAmount(6500);
    } else {
      setObjectId('48213');
      setAmount(3800);
    }
    setStep('input');
  };

  const startVerification = (forceError = false) => {
    setStep('verify');
    setVerificationError(forceError);
    setCheck1('running');
    setCheck2('pending');
    setCheck3('pending');

    setTimeout(() => {
      setCheck1('passed');
      setCheck2('running');

      setTimeout(() => {
        if (forceError) {
          setCheck2('failed');
          setCheck3('pending');
        } else {
          setCheck2('passed');
          setCheck3('running');

          setTimeout(() => {
            setCheck3('passed');
          }, 600);
        }
      }, 700);
    }, 700);
  };

  const handleSimulatePhotoUpload = () => {
    setPhotoFileName('bill_invoice_scan_oct26.pdf');
    setPhotoScanStatus('scanning');
    setTimeout(() => {
      setPhotoScanStatus('passed');
      setCheck2('passed');
      setCheck3('passed');
      setVerificationError(false);
    }, 1200);
  };

  const handleConfirmRequest = () => {
    const input: PoolRequestInput = {
      category: selectedCategory,
      subType: subType,
      objectId: objectId,
      amount: Number(amount),
      uploadedBillName: photoFileName || undefined
    };
    const req = addPoolRequest(input);
    setCreatedRequest(req);
    setStep('confirmed');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={() => {
            if (step === 'category') setRequesterScreen('home');
            else if (step === 'input') setStep('category');
            else if (step === 'verify') setStep('input');
            else if (step === 'review') setStep('input');
            else if (step === 'duplicate_error') setStep('input');
            else setRequesterScreen('home');
          }}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A] rounded"
        >
          ← {step === 'category' ? 'Back to Network Home' : 'Back to Previous Step'}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#111111]">
              The Pool: Institutional Settlement
            </h2>
            <p className="text-xs sm:text-sm text-[#111111]/70 mt-0.5">
              Direct institutional payment for utility bills, school tuition, or medical invoices.
            </p>
          </div>
          <span className="text-xs font-mono bg-[#DCE8E0] text-[#1F6B4A] px-2 py-1 rounded hidden sm:inline-block">
            Direct-to-Institution
          </span>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3 text-xs font-medium">
        <div className={`flex items-center gap-1.5 ${step === 'category' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/50'}`}>
          <span className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-mono">1</span>
          <span>Category</span>
        </div>
        <span className="text-[#111111]/20">―</span>
        <div className={`flex items-center gap-1.5 ${step === 'input' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/50'}`}>
          <span className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-mono">2</span>
          <span>Details</span>
        </div>
        <span className="text-[#111111]/20">―</span>
        <div className={`flex items-center gap-1.5 ${step === 'verify' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/50'}`}>
          <span className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-mono">3</span>
          <span>Verification</span>
        </div>
        <span className="text-[#111111]/20">―</span>
        <div className={`flex items-center gap-1.5 ${step === 'review' || step === 'confirmed' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/50'}`}>
          <span className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-mono">4</span>
          <span>Settlement</span>
        </div>
      </div>

      {/* Step 1: Choose Category */}
      {step === 'category' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {categoryConfigs.map(cat => (
              <div
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-[#111111]/15 hover:border-[#1F6B4A] hover:shadow-sm transition-all cursor-pointer flex items-start justify-between gap-3 group focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
                tabIndex={0}
                role="button"
                aria-label={`Select ${cat.title}`}
                onKeyDown={e => e.key === 'Enter' && handleCategorySelect(cat.id)}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-[#DCE8E0] group-hover:bg-[#1F6B4A] group-hover:text-white transition-colors shrink-0">
                    {cat.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-bold text-[#111111] group-hover:text-[#1F6B4A] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#111111]/70 leading-relaxed">
                      {cat.helper}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cat.defaultSubTypes.map(st => (
                        <span key={st} className="text-[10px] font-mono bg-[#FAF8F4] text-[#111111]/70 px-2 py-0.5 rounded border border-[#111111]/10">
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-[#111111]/30 group-hover:text-[#1F6B4A] group-hover:translate-x-0.5 transition-all mt-3 shrink-0" />
              </div>
            ))}
          </div>

          {/* Policy Box */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 space-y-1 text-xs text-[#111111]/80">
            <div className="font-semibold text-[#1F6B4A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('direct_payment_note')}</span>
            </div>
            <p className="text-[11px] text-[#111111]/65 leading-relaxed">
              Payments are executed via direct institutional settlement to verified provider accounts. LumiereCore&apos;s own accounts do not hold or move Pool funds.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Input Details */}
      {step === 'input' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-white border border-[#111111]/15 space-y-4">
            
            {/* Sub-type selector */}
            <div className="space-y-1.5">
              <label htmlFor="subTypeSelect" className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                Institution Sub-Type
              </label>
              <select
                id="subTypeSelect"
                value={subType}
                onChange={e => setSubType(e.target.value)}
                className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none cursor-pointer"
              >
                {currentConfig.defaultSubTypes.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Object ID Input */}
            <div className="space-y-1.5">
              <label htmlFor="objectIdInput" className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                {currentConfig.idLabel}
              </label>
              <input
                id="objectIdInput"
                type="text"
                value={objectId}
                onChange={e => setObjectId(e.target.value)}
                placeholder={currentConfig.placeholder}
                className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none"
              />
              <span className="text-[11px] text-[#111111]/60 block">
                {currentConfig.helper}
              </span>
            </div>

            {/* Amount (KES) */}
            <div className="space-y-1.5">
              <label htmlFor="amountInput" className="text-xs font-semibold text-[#111111] uppercase tracking-wider block">
                Outstanding Amount to Clear (KES)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-[#111111]/50">
                  KES
                </span>
                <input
                  id="amountInput"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-[#FAF8F4] border border-[#111111]/20 rounded-xl pl-14 pr-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                {[1500, 2200, 4500, 6500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="text-[11px] font-mono text-[#1F6B4A] bg-[#DCE8E0]/60 hover:bg-[#DCE8E0] px-2 py-0.5 rounded cursor-pointer"
                  >
                    KES {val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <button
              onClick={() => startVerification(false)}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            >
              <span>Run Automated Object Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Demo Controls Panel */}
            <div className="p-3.5 bg-[#FAF8F4] border border-[#111111]/15 rounded-xl space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111]/60 font-bold block">
                {t('demo_controls')}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => startVerification(true)}
                  className="py-2.5 px-3 rounded-lg bg-white hover:bg-black/5 text-amber-900 border border-amber-300 text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
                  title="Test institutional lookup error"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulate Lookup Error</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('duplicate_error')}
                  className="py-2.5 px-3 rounded-lg bg-white hover:bg-black/5 text-rose-900 border border-rose-300 text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
                  title="Test duplicate already-settled state"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Simulate Duplicate Settled</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Verification Step with 3 checks */}
      {step === 'verify' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#111111]/10">
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Institutional Object-Level Checks
              </h3>
              <span className="text-xs font-mono text-[#1F6B4A]">
                Tier 2 Automated Query
              </span>
            </div>

            {/* Check 1: Exists in database */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#111111]">
                  1. Institutional Record Query
                </span>
                <p className="text-[11px] text-[#111111]/60">
                  Checking if {objectId} exists in institutional database
                </p>
              </div>
              <div className="shrink-0">
                {check1 === 'running' && (
                  <span className="text-xs font-mono text-[#1F6B4A] flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#1F6B4A]" />
                    Querying...
                  </span>
                )}
                {check1 === 'passed' && (
                  <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" />
                    Verified Exists
                  </span>
                )}
              </div>
            </div>

            {/* Check 2: Unpaid Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#111111]">
                  2. Outstanding / Unpaid Balance
                </span>
                <p className="text-[11px] text-[#111111]/60">
                  Verifying pending unfulfilled balance status
                </p>
              </div>
              <div className="shrink-0">
                {check2 === 'pending' && <span className="text-xs font-mono text-black/40">Pending</span>}
                {check2 === 'running' && (
                  <span className="text-xs font-mono text-[#1F6B4A] flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#1F6B4A]" />
                    Verifying...
                  </span>
                )}
                {check2 === 'passed' && (
                  <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" />
                    Confirmed Unpaid
                  </span>
                )}
                {check2 === 'failed' && (
                  <span className="text-xs font-mono text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-700" />
                    Lookup Failed
                  </span>
                )}
              </div>
            </div>

            {/* Check 3: Amount matches */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4] border border-[#111111]/10">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#111111]">
                  3. Amount Match Tolerance
                </span>
                <p className="text-[11px] text-[#111111]/60">
                  KES {amount.toLocaleString()} matches institutional invoice
                </p>
              </div>
              <div className="shrink-0">
                {check3 === 'pending' && <span className="text-xs font-mono text-black/40">Pending</span>}
                {check3 === 'running' && (
                  <span className="text-xs font-mono text-[#1F6B4A] flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#1F6B4A]" />
                    Matching...
                  </span>
                )}
                {check3 === 'passed' && (
                  <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" />
                    Exact Match
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* If Verification Passed All 3 */}
          {check1 === 'passed' && check2 === 'passed' && check3 === 'passed' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 rounded-xl bg-[#DCE8E0]/40 border border-[#1F6B4A]/30 flex items-center gap-2.5 text-xs text-[#1F6B4A]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="font-semibold text-sm">
                  Automated verification passed. Ready for settlement review.
                </span>
              </div>

              <button
                onClick={() => setStep('review')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
              >
                <span>Proceed to Settlement Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Verification Failed: Show Dignified Fallback Path (Upload bill photo) */}
          {verificationError && check2 === 'failed' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                    We couldn&apos;t verify this account number automatically
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Institutional API gateways occasionally experience connectivity timeouts or pending index updates. You can upload a photo of your paper or digital bill for our automated document plausibility check.
                  </p>
                </div>
              </div>

              {/* Photo Upload Simulator */}
              <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111111]">
                    Fallback Verification: Upload Bill Photo / PDF
                  </span>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Tier 3 OCR Check
                  </span>
                </div>

                {!photoFileName ? (
                  <div
                    onClick={handleSimulatePhotoUpload}
                    className="border-2 border-dashed border-black/20 hover:border-[#1F6B4A] p-6 rounded-xl text-center space-y-2 cursor-pointer transition-colors bg-[#FAF8F4]"
                  >
                    <Upload className="w-6 h-6 text-[#1F6B4A] mx-auto" />
                    <div className="text-xs font-medium text-[#111111]">
                      Click to simulate bill upload
                    </div>
                    <div className="text-[11px] text-[#111111]/50">
                      JPEG, PNG, or PDF of institutional bill or fee notice
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#111111]/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1F6B4A]" />
                        <span className="font-mono text-[#111111]">{photoFileName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Plausibility: PASS
                      </span>
                    </div>

                    <div className="text-[11px] text-[#111111]/70 space-y-1 font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                        <span>Format integrity: Valid institutional template format</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                        <span>Amount range check: KES {amount.toLocaleString()} is plausible</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep('review')}
                      className="w-full py-3 px-4 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Continue to Settlement Review with Uploaded Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Error State: Duplicate Settled Error State */}
      {step === 'duplicate_error' && (
        <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-sm animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-[#111111]">
              Duplicate: this bill has already been settled
            </h3>
            <p className="text-xs sm:text-sm text-[#111111]/75 leading-relaxed">
              Our automated deduplication verification confirmed that this institutional account has an outstanding balance of zero or has already been fulfilled by another resource pool.
            </p>
          </div>

          {/* Privacy invariant: reveals nothing about who settled it */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs text-[#111111]/80 space-y-1">
            <div className="font-semibold text-[#1F6B4A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Privacy Invariant</span>
            </div>
            <p className="text-[11px] text-[#111111]/70 leading-relaxed">
              To preserve anonymity across all people in the circle, the network does not disclose who, when, or through which funder this record was settled.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep('input')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors"
            >
              Enter a Different Account
            </button>
            <button
              onClick={() => setRequesterScreen('home')}
              className="py-3 px-4 rounded-xl bg-white border border-[#111111]/20 hover:bg-black/5 text-[#111111] text-xs font-medium cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review Screen */}
      {step === 'review' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Prominent Mandatory Direct Institutional Settlement Statement */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#DCE8E0]/60 border border-[#1F6B4A]/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F6B4A] uppercase tracking-wider">
              <ShieldCheck className="w-5 h-5 text-[#1F6B4A]" />
              <span>Direct Institutional Settlement</span>
            </div>
            <p className="text-sm font-semibold text-[#111111]">
              Funds go directly to the institution. No cash is sent to you.
            </p>
            <p className="text-xs text-[#111111]/75 leading-relaxed">
              Once confirmed, this request is submitted to our payment partner for direct institutional settlement. LumiereCore&apos;s own accounts do not hold or move Pool funds.
            </p>
          </div>

          {/* Details Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-3">
            <h4 className="font-serif text-base font-bold text-[#111111] pb-2 border-b border-[#111111]/10">
              Payment Summary
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#111111]/5">
                <span className="text-[#111111]/60">Institutional Category</span>
                <span className="font-semibold text-[#111111]">{subType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#111111]/5">
                <span className="text-[#111111]/60">Object Reference</span>
                <span className="font-mono text-[#111111]">{objectId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#111111]/5">
                <span className="text-[#111111]/60">Institutional Settlement Amount</span>
                <span className="font-mono font-bold text-sm text-[#1F6B4A]">
                  KES {amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#111111]/60">Verification Route</span>
                <span className="font-mono text-[#111111]/80">
                  {photoFileName ? 'Tier 3 (Bill Photo Cross-Check)' : 'Tier 2 (Real-time Object Query)'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmRequest}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
          >
            <span>Confirm and Submit to Payment Partner</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 5: Confirmation Screen */}
      {step === 'confirmed' && createdRequest && (
        <div className="space-y-5 animate-in zoom-in-95 duration-200">
          <div className="p-4 rounded-xl bg-[#DCE8E0]/40 border border-[#1F6B4A]/30 flex items-center gap-2.5 text-xs text-[#1F6B4A]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Submitted to Payment Partner</span>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-4 shadow-sm text-center">
            <span className="text-xs font-mono uppercase text-[#111111]/60 tracking-wider">
              Network Request Reference
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-[#1F6B4A]">
              {createdRequest.id}
            </div>

            <p className="text-xs text-[#111111]/70 leading-relaxed max-w-sm mx-auto">
              Your request has passed institutional verification and has been submitted to the payment partner (Safaricom institution-payment product, unconfirmed).
            </p>

            {/* Status Timeline */}
            <div className="pt-4 border-t border-[#111111]/10 text-left space-y-3">
              <span className="text-xs font-semibold text-[#111111] block">
                Settlement Lifecycle Timeline
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="font-medium">1. Submitted &amp; Cryptographic Token Checked</span>
                </div>
                <div className="flex items-center gap-2.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="font-medium">2. Institutional Record &amp; Unpaid Balance Verified</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#111111]/60">
                  <Clock className="w-4 h-4 text-[#1F6B4A]" />
                  <span>3. Submitted to payment partner (pending institution receipt)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRequesterScreen('home')}
              className="w-full py-3 px-4 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
            >
              Return to Home Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
