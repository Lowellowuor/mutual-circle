import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { Toast } from '../../ui/Toast';
import { 
  ShieldCheck, 
  Lock, 
  Download, 
  FileEdit, 
  Trash2, 
  AlertCircle, 
  Info,
  CheckCircle2
} from 'lucide-react';

export const PrivacyTab: React.FC = () => {
  const { t } = useApp();
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [legalSheetOpen, setLegalSheetOpen] = useState<boolean>(false);

  const handleActionClick = (actionName: string) => {
    setActiveNotice(`Requested ${actionName}. Prototype verification logged.`);
    setTimeout(() => setActiveNotice(null), 3000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20 animate-in fade-in">
      
      {/* Top Header: 56px */}
      <div className="h-14 flex items-center justify-between border-b border-[#111111]/10">
        <h1 className="font-serif text-[28px] font-bold text-[#111111]">
          {t('privacy_title')}
        </h1>
        <button
          onClick={() => setLegalSheetOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
          aria-label="View legal review details"
        >
          <Info className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Mandatory Exact Review Banner */}
      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-sm text-amber-900 font-medium flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" strokeWidth={1.75} />
        <span>{t('privacy_banner')}</span>
      </div>

      {/* Toast Notice */}
      {activeNotice && (
        <Toast message={activeNotice} type="success" onDismiss={() => setActiveNotice(null)} />
      )}

      {/* Three Disclosed Data Groups */}
      <div className="space-y-3">
        
        {/* Tier 1: What IS Stored */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-[#111111]">
            <CheckCircle2 className="w-5 h-5 text-[#1F6B4A]" strokeWidth={1.75} />
            <span>{t('tier1_title')}</span>
          </div>
          <ul className="text-sm text-[#111111]/85 space-y-1.5 font-mono">
            <li>• {t('tier1_item1')}</li>
            <li>• {t('tier1_item2')}</li>
            <li>• {t('tier1_item3')}</li>
            <li>• {t('tier1_item4')} (obj #8f4c…)</li>
          </ul>
        </Card>

        {/* Tier 2: Never Stored */}
        <Card className="p-4 space-y-2 border-rose-200 bg-rose-50/20">
          <div className="flex items-center gap-2 font-bold text-base text-rose-900">
            <Lock className="w-5 h-5 text-rose-700" strokeWidth={1.75} />
            <span>{t('tier2_title')}</span>
          </div>
          <ul className="text-sm text-[#111111]/85 space-y-1.5 font-mono">
            <li>• {t('tier2_item1')}</li>
            <li>• {t('tier2_item2')}</li>
            <li>• {t('tier2_item3')}</li>
            <li>• {t('tier2_item4')}</li>
          </ul>
        </Card>

        {/* Tier 3: Stored Encrypted for Automated Processes */}
        <Card className="p-4 space-y-1 bg-[#FAF8F4]">
          <span className="font-bold text-base text-[#111111] block">
            {t('tier3_title')}
          </span>
          <p className="text-sm text-[#111111]/75 leading-relaxed font-mono">
            {t('tier3_body')}
          </p>
        </Card>

      </div>

      {/* Data Subject Rights (Verb + Object buttons) */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => handleActionClick('Access')}
            icon={<Download className="w-4 h-4" strokeWidth={1.75} />}
          >
            {t('btn_export_data')}
          </Button>

          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => handleActionClick('Correction')}
            icon={<FileEdit className="w-4 h-4" strokeWidth={1.75} />}
          >
            {t('btn_correct_data')}
          </Button>

          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => handleActionClick('Deletion')}
            icon={<Trash2 className="w-4 h-4 text-rose-600" strokeWidth={1.75} />}
          >
            {t('btn_delete_data')}
          </Button>
        </div>
      </div>

      {/* Legal Review Bottom Sheet */}
      <Sheet
        isOpen={legalSheetOpen}
        onClose={() => setLegalSheetOpen(false)}
        title={t('privacy_title')}
      >
        <div className="space-y-3 text-sm leading-relaxed text-[#111111]/80">
          <p>
            Anonymity is maintained from human participants in the resource distribution chain.
          </p>
          <div className="p-3.5 bg-[#FAF8F4] rounded-xl border border-[#111111]/10 font-mono text-sm space-y-1.5">
            <div>• Telecom note: SIM cards are registered with telecom operators.</div>
            <div>• Rotating keys: One-way derivation prevents profiling.</div>
            <div>• No clinical inquiries: Medical diagnoses are never requested.</div>
          </div>
          <Button fullWidth variant="outline" size="md" onClick={() => setLegalSheetOpen(false)}>
            {t('btn_close')}
          </Button>
        </div>
      </Sheet>

    </div>
  );
};
