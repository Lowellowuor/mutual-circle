import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { PARTNER_STATEMENTS } from '../data/mock';
import { 
  ScanLine, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileSpreadsheet, 
  Delete 
} from 'lucide-react';

export const PartnerShell: React.FC = () => {
  const { t } = useApp();

  const [activeTab, setActiveTab] = useState<'scanner' | 'statement'>('scanner');
  const [voucherCode, setVoucherCode] = useState<string>('9941');
  const [validationResult, setValidationResult] = useState<'none' | 'valid' | 'used' | 'invalid'>('none');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setVoucherCode('');
      setValidationResult('none');
      return;
    }
    if (val === 'back') {
      setVoucherCode(prev => prev.slice(0, -1));
      setValidationResult('none');
      return;
    }
    if (voucherCode.length >= 8) return;
    setVoucherCode(prev => prev + val);
    setValidationResult('none');
  };

  const handleScanOrVerify = () => {
    if (voucherCode.includes('9941')) {
      setValidationResult('valid');
    } else if (voucherCode.includes('8341') || voucherCode.includes('4102')) {
      setValidationResult('used');
    } else {
      setValidationResult('invalid');
    }
  };

  const handleRedeem = () => {
    setValidationResult('none');
    setVoucherCode('');
    setToastMsg('Voucher settled to monthly statement.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20 select-none animate-in fade-in">
      
      {/* Top Header: 56px */}
      <div className="h-14 flex items-center justify-between border-b border-[#111111]/10 px-1">
        <h1 className="font-serif text-[28px] font-bold text-[#111111]">
          {t('partner_title')}
        </h1>
        <span className="text-sm font-mono text-[#111111]/60">
          TRM-782
        </span>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <Toast message={toastMsg} type="success" onDismiss={() => setToastMsg(null)} />
      )}

      {/* Tabs: Scanner & Statement */}
      <div className="flex items-center gap-2 bg-black/5 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 min-h-[44px] py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'scanner' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#111111]/60'
          }`}
        >
          {t('tab_scanner')}
        </button>
        <button
          onClick={() => setActiveTab('statement')}
          className={`flex-1 min-h-[44px] py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'statement' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#111111]/60'
          }`}
        >
          {t('tab_statement')}
        </button>
      </div>

      {/* TAB 1: SCANNER & KEYPAD */}
      {activeTab === 'scanner' && (
        <div className="space-y-4">
          
          {/* Result Card: Green (valid), Amber (used), Grey (invalid) with Big Icon */}
          {validationResult === 'valid' && (
            <div className="p-4 rounded-[18px] bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-emerald-700" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-bold text-base">Valid Voucher</div>
                  <div className="font-mono text-sm text-emerald-800">KES 1,450 &bull; Pantry Basics</div>
                </div>
              </div>
              <Button size="sm" variant="primary" onClick={handleRedeem}>
                Redeem
              </Button>
            </div>
          )}

          {validationResult === 'used' && (
            <div className="p-4 rounded-[18px] bg-amber-50 border border-amber-300 text-amber-950 flex items-center gap-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7 text-amber-700" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-bold text-base">Already Redeemed</div>
                <div className="font-mono text-sm text-amber-800">Voucher was collected earlier</div>
              </div>
            </div>
          )}

          {validationResult === 'invalid' && (
            <div className="p-4 rounded-[18px] bg-neutral-100 border border-neutral-300 text-neutral-800 flex items-center gap-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7 text-neutral-700" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-bold text-base">Invalid Code</div>
                <div className="font-mono text-sm text-neutral-600">No matching ticket in system</div>
              </div>
            </div>
          )}

          {/* Large Rounded Scan Button in Centre */}
          <div className="p-6 bg-white rounded-[18px] border border-[#111111]/10 text-center space-y-3">
            <button
              onClick={handleScanOrVerify}
              className="w-24 h-24 rounded-full bg-[#1F6B4A] hover:bg-[#18553A] text-white flex flex-col items-center justify-center mx-auto shadow-md active:scale-95 transition-all cursor-pointer"
              aria-label="Scan QR Code"
            >
              <ScanLine className="w-8 h-8" strokeWidth={1.75} />
              <span className="text-xs font-semibold mt-1">Scan</span>
            </button>

            {/* Voucher Code Display */}
            <div className="font-mono text-xl font-bold tracking-widest text-[#111111] pt-1">
              {voucherCode || '••••'}
            </div>
          </div>

          {/* On-screen Keypad Below */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-[#FAF8F4] rounded-2xl border border-[#111111]/10">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'back'].map(k => (
              <button
                key={k}
                onClick={() => handleKeypadPress(k)}
                className="min-h-[48px] h-12 rounded-xl bg-white border border-[#111111]/10 flex items-center justify-center text-lg font-bold font-mono text-[#111111] active:scale-95 transition-transform cursor-pointer"
              >
                {k === 'back' ? <Delete className="w-5 h-5 text-[#111111]/70" /> : k}
              </button>
            ))}
          </div>

          {/* Verify Action Button: 52px */}
          <Button
            fullWidth
            size="sticky"
            onClick={handleScanOrVerify}
          >
            {t('btn_verify')}
          </Button>

        </div>
      )}

      {/* TAB 2: STATEMENT */}
      {activeTab === 'statement' && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base text-[#111111]">
            <FileSpreadsheet className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
            <span>Monthly Statement</span>
          </div>

          <div className="divide-y divide-[#111111]/10">
            {PARTNER_STATEMENTS.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold text-[#111111]">{item.month}</div>
                  <div className="text-[#111111]/60 font-mono">{item.voucherCount} vouchers</div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono text-[#1F6B4A]">KES {item.totalValueKes.toLocaleString()}</div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {item.reimbursementStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
};
