import { ScreenHeader } from '../../ui';
import React from 'react';
import { ShieldCheck, Eye, EyeOff, RotateCcw, Lock, Download, ChevronRight } from 'lucide-react';

interface DonorSettingsProps {
  donorHash?: string | null;
  myProfile: any;
  donorContributions: any[];
  pledges: any[];
  totalGiven: number;
  showServer: boolean;
  setShowServer: (v: boolean) => void;
  setScreen: (s: any) => void;
  setTab: (t: any) => void;
  resetFlow: () => void;
  handleDownloadDonations: () => void;
}

export const DonorSettings: React.FC<DonorSettingsProps> = (props) => {
  return (
    <div className="space-y-6 pb-4">
      <ScreenHeader number="05" eyebrow="Account" title="Settings" subtitle="Privacy and transparency." />
      

      <div className="card-editorial p-5 md:p-6 mb-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-pine" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Privacy</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Ledger name</span>
            <span className="font-semibold text-ink">{props.myProfile?.display_name || 'Anonymous'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Public ledger</span>
            <span className={`font-semibold ${props.myProfile?.opt_in_ledger ? 'text-pine' : 'text-muted'}`}>
              {props.myProfile?.opt_in_ledger ? 'Listed' : 'Not listed'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Last gift</span>
            <span className={`font-semibold ${props.donorContributions[0]?.isAnonymous ? 'text-pine' : 'text-ink'}`}>
              {props.donorContributions[0]
                ? props.donorContributions[0].isAnonymous
                  ? 'Anonymous'
                  : 'Named'
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {props.donorContributions.length > 0 && (
        <button className="btn btn-secondary w-full mb-3">
          <Download className="w-4 h-4 mr-2" /> Download my donations ({props.donorContributions.length} gift
          {props.donorContributions.length !== 1 ? 's' : ''})
        </button>
      )}

      <button
        onClick={() => props.setScreen('ledger')}
        className="w-full p-4 bg-surface border border-tile rounded-[16px] flex items-center justify-between hover:border-pine hover:shadow-soft transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tint text-pine flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-ink">Verify public ledger</div>
            <div className="text-xs text-muted mt-0.5">Chain status, recent entries, CSV download</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted shrink-0" />
      </button>

      <div className="card-editorial p-5 md:p-6 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pine" /> Server View
          </h3>
          <button
            onClick={() => props.setShowServer(!props.showServer)}
            className="text-xs font-semibold text-pine hover:underline flex items-center gap-1"
          >
            {props.showServer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {props.showServer ? 'Hide' : 'Reveal'}
          </button>
        </div>
        <div className="space-y-2 pt-3 border-t border-tile text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Donor hash</span>
            <span className="text-pine font-semibold font-mono truncate ml-2">
              {props.showServer ? (props.donorHash ? props.donorHash.slice(0, 16) + '…' : 'demo-hash') : '••••••••'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Name</span>
            <span className="text-rose-600 font-semibold">{props.showServer ? 'NOT STORED' : '••••••'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Recipient link</span>
            <span className="text-rose-600 font-semibold">NONE</span>
          </div>
          <div className="flex justify-between border-t border-tile pt-2 mt-2">
            <span className="text-muted">Session total</span>
            <span className="text-ink font-semibold">KES {props.totalGiven.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Contributions</span>
            <span className="text-ink">{props.donorContributions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Pledges</span>
            <span className="text-ink">{props.pledges.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">In ledger</span>
            <span className="text-ink">
              {props.donorContributions.filter((c: any) => c.optInLedger).length} / {props.donorContributions.length}
            </span>
          </div>
        </div>
        {props.showServer && (
          <div className="card-editorial p-5 md:p-6 mb-4">
            <strong>Blind-pool guarantee:</strong> no column links a donor to any disbursement. The ledger is
            aggregate only.
          </div>
        )}
      </div>

      <div className="card-editorial p-5 md:p-6 mb-4">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Spec Coverage</h4>
        {[
          'Blind pooling (4.6)',
          'Cohort campaigns (4.6)',
          'Recognition ledger opt-in (4.6)',
          'The Match - goods & service credit (4.4)',
          'Coarse locality (4.4)',
          'Anonymous by default',
          'No recipient linkage',
        ].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-pine" />
            {f}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          props.resetFlow();
          props.setTab('home');
          props.setShowServer(false);
          props.setScreen('tab');
        }}
        className="w-full py-3 text-sm text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-[16px] bg-surface flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" /> Reset Simulator
      </button>
    </div>
  );
};