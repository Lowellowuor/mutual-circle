import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Switch } from '../ui/Switch';
import { Sheet } from '../ui/Sheet';
import { Toast } from '../ui/Toast';
import { 
  HeartHandshake, 
  Sparkles, 
  TrendingUp, 
  GraduationCap, 
  Package, 
  Zap, 
  Users, 
  CheckCircle2,
  Info 
} from 'lucide-react';

export const DonorShell: React.FC = () => {
  const { addDonorContribution, t } = useApp();

  const [activeTab, setActiveTab] = useState<'give' | 'campaigns' | 'impact'>('give');
  const [amount, setAmount] = useState<number>(5000);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [optInLedger, setOptInLedger] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [infoSheetOpen, setInfoSheetOpen] = useState<boolean>(false);

  const presets = [1000, 2500, 5000, 10000];

  const handleContribute = () => {
    addDonorContribution(amount, isAnonymous, optInLedger);
    setToastMsg(`Contributed KES ${amount.toLocaleString()}.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getTitle = () => {
    if (activeTab === 'give') return t('give_title');
    if (activeTab === 'campaigns') return t('campaigns_title');
    return t('impact_title');
  };

  return (
    <div className="flex flex-col min-h-[640px] w-full max-w-md mx-auto pb-24 relative select-none animate-in fade-in">
      
      {/* Top Header: 56px */}
      <div className="h-14 flex items-center justify-between border-b border-[#111111]/10 px-1">
        <h1 className="font-serif text-[28px] font-bold text-[#111111]">
          {getTitle()}
        </h1>
        <button
          onClick={() => setInfoSheetOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
          aria-label="Donor info"
        >
          <Info className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <Toast message={toastMsg} type="success" onDismiss={() => setToastMsg(null)} className="mt-2" />
      )}

      {/* Main Tab View (Cross-fades 150ms) */}
      <div className="pt-3 flex-1 transition-opacity duration-150">
        
        {/* TAB 1: GIVE */}
        {activeTab === 'give' && (
          <div className="space-y-4">
            
            {/* Hard rule fixed line in donor header */}
            <div className="text-sm font-semibold text-[#1F6B4A] text-center py-1">
              {t('donor_header_rule')}
            </div>

            {/* Large Amount Display */}
            <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 text-center space-y-1">
              <div className="text-sm font-medium text-[#111111]/60">KES</div>
              <div className="font-mono text-4xl font-bold text-[#111111] tracking-tight">
                {amount.toLocaleString()}
              </div>
            </div>

            {/* Preset Chips */}
            <div className="flex items-center justify-center gap-2">
              {presets.map(p => (
                <Chip
                  key={p}
                  selected={amount === p}
                  onClick={() => setAmount(p)}
                  size="md"
                >
                  {p.toLocaleString()}
                </Chip>
              ))}
            </div>

            {/* Two Switches */}
            <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 space-y-3">
              <div className="flex items-center justify-between">
                <Switch
                  checked={isAnonymous}
                  onChange={setIsAnonymous}
                  label={t('toggle_anonymous')}
                  id="donor-anon"
                />
              </div>

              <div className="border-t border-[#111111]/10" />

              <div className="flex items-center justify-between">
                <Switch
                  checked={optInLedger}
                  onChange={setOptInLedger}
                  label={t('toggle_ledger')}
                  id="donor-ledger"
                />
              </div>
            </div>

            {/* Sticky Give Button: 52px */}
            <div className="pt-2">
              <Button
                fullWidth
                size="sticky"
                onClick={handleContribute}
              >
                {t('btn_give')}
              </Button>
            </div>

          </div>
        )}

        {/* TAB 2: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-3 pt-1">
            
            {/* Campaign Card 1: School Tuition */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-base text-[#111111]">
                      {t('camp_tuition')}
                    </div>
                    <div className="text-sm font-mono text-[#111111]/60">
                      200 students
                    </div>
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-black/10"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#1F6B4A]"
                      strokeDasharray="82, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-bold text-[#111111]">82%</span>
                </div>
              </div>

              {/* Thick Progress Bar */}
              <div className="w-full h-3 rounded-full bg-black/10 overflow-hidden">
                <div className="h-full bg-[#1F6B4A] rounded-full w-[82%]" />
              </div>
            </Card>

            {/* Campaign Card 2: Locker Bundles */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-base text-[#111111]">
                      {t('camp_bundles')}
                    </div>
                    <div className="text-sm font-mono text-[#111111]/60">
                      500 bundles
                    </div>
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-black/10"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#1F6B4A]"
                      strokeDasharray="64, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-bold text-[#111111]">64%</span>
                </div>
              </div>

              {/* Thick Progress Bar */}
              <div className="w-full h-3 rounded-full bg-black/10 overflow-hidden">
                <div className="h-full bg-[#1F6B4A] rounded-full w-[64%]" />
              </div>
            </Card>

          </div>
        )}

        {/* TAB 3: IMPACT */}
        {activeTab === 'impact' && (
          <div className="space-y-4 pt-1">
            
            {/* 4 Stat Tiles with Icon + Number first, Label second */}
            <div className="grid grid-cols-2 gap-3">
              
              <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#111111]">420</div>
                </div>
                <div className="text-sm font-medium text-[#111111]/70">{t('impact_bundles')}</div>
              </div>

              <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#111111]">188</div>
                </div>
                <div className="text-sm font-medium text-[#111111]/70">{t('impact_meters')}</div>
              </div>

              <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#111111]">94</div>
                </div>
                <div className="text-sm font-medium text-[#111111]/70">{t('impact_students')}</div>
              </div>

              <div className="p-4 rounded-[18px] bg-white border border-[#111111]/10 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="font-mono text-xl font-bold text-[#1F6B4A]">1.2M</div>
                </div>
                <div className="text-sm font-medium text-[#111111]/70">{t('impact_settled')}</div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Consumer Mobile Bottom Tab Bar: 64px, 3 tabs, active indicator pill */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#111111]/10 max-w-md mx-auto h-16 flex items-center justify-around z-30 shadow-lg px-2"
        aria-label="Donor Bottom Navigation"
      >
        <button
          onClick={() => setActiveTab('give')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'give' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/60 hover:text-[#111111]'
          }`}
          aria-label={t('tab_give')}
        >
          {activeTab === 'give' && (
            <span className="absolute -top-1 w-8 h-1 bg-[#1F6B4A] rounded-full" />
          )}
          <HeartHandshake 
            className="w-6 h-6" 
            strokeWidth={1.75} 
            fill={activeTab === 'give' ? '#1F6B4A' : 'none'} 
          />
          <span className="text-sm mt-0.5">{t('tab_give')}</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'campaigns' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/60 hover:text-[#111111]'
          }`}
          aria-label={t('tab_campaigns')}
        >
          {activeTab === 'campaigns' && (
            <span className="absolute -top-1 w-8 h-1 bg-[#1F6B4A] rounded-full" />
          )}
          <Sparkles 
            className="w-6 h-6" 
            strokeWidth={1.75} 
            fill={activeTab === 'campaigns' ? '#1F6B4A' : 'none'} 
          />
          <span className="text-sm mt-0.5">{t('tab_campaigns')}</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'impact' ? 'text-[#1F6B4A] font-bold' : 'text-[#111111]/60 hover:text-[#111111]'
          }`}
          aria-label={t('tab_impact')}
        >
          {activeTab === 'impact' && (
            <span className="absolute -top-1 w-8 h-1 bg-[#1F6B4A] rounded-full" />
          )}
          <TrendingUp 
            className="w-6 h-6" 
            strokeWidth={1.75} 
            fill={activeTab === 'impact' ? '#1F6B4A' : 'none'} 
          />
          <span className="text-sm mt-0.5">{t('tab_impact')}</span>
        </button>
      </nav>

      {/* Info Sheet */}
      <Sheet
        isOpen={infoSheetOpen}
        onClose={() => setInfoSheetOpen(false)}
        title={getTitle()}
      >
        <div className="space-y-3 text-sm leading-relaxed text-[#111111]/80">
          <p>Contributions fund an undifferentiated pool for utilities, school tuition, and lockers.</p>
          <p>No donation is linked to any individual recipient.</p>
          <Button fullWidth variant="outline" size="md" onClick={() => setInfoSheetOpen(false)}>
            {t('btn_close')}
          </Button>
        </div>
      </Sheet>

    </div>
  );
};
