import { ScreenHeader } from '../../ui';
import React from 'react';
import { Check, Wallet } from 'lucide-react';
import { EmptyState } from '../Shared/EmptyState';

interface GiveFlowProps {
  showSuccess: boolean;
  onCloseSuccess: () => void;
  onViewDonations: () => void;
  finalAmount: number;
  selected: number;
  setSelected: (v: number) => void;
  custom: string;
  setCustom: (v: string) => void;
  anon: boolean;
  setAnon: (v: boolean) => void;
  ledger: boolean;
  setLedger: (v: boolean) => void;
  processing: boolean;
  handleGive: () => void;
  payingDonation: { id: string; amount: number } | null;
  setPayingDonation: (d: { id: string; amount: number } | null) => void;
  donorContributions: any[];
}

const AMOUNTS_KES = [1000, 2500, 5000, 10000];

export const GiveFlow: React.FC<GiveFlowProps> = (props) => {
  if (props.showSuccess) {
    const stillUnpaid = props.payingDonation
      && props.donorContributions.find(d => d.id === props.payingDonation!.id)?.status !== 'paid';

    return (
      <div className="space-y-4 pb-20">
      <ScreenHeader number="02" eyebrow="Donate" title="Give Cash" subtitle="Contribute to the blind pool." />
        <div className="pt-6 text-center space-y-3">
          <div className="w-16 h-16 bg-lime text-pine rounded-full flex items-center justify-center mx-auto border border-tile">
            <Check className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Pooled</h2>
            <p className="text-sm text-muted mt-1">KES {props.finalAmount.toLocaleString()} added to the blind fund.</p>
          </div>
        </div>

        {stillUnpaid && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => props.setPayingDonation(props.payingDonation)}
            className="bg-green-600 hover:bg-green-700 font-bold shadow-soft mt-4"
          >
            Pay with M-PESA
          </button>
        )}
        {!props.payingDonation && (
          <div className="text-sm text-muted text-center mt-4">
             Donation recorded. (Awaiting M-PESA setup)
          </div>
        )}

        <div className="card-editorial p-5 md:p-6 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Fund</span>
              <span className="font-semibold text-ink">Mutual Circle Pool</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Name</span>
              <span className="font-semibold text-ink">{props.anon ? 'Anonymous' : 'Recorded'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ledger</span>
              <span className="font-semibold text-ink">{props.ledger ? 'Visible in ledger' : 'Not listed'}</span>
            </div>
            <div className="flex justify-between border-t border-tile pt-2 mt-2">
              <span className="text-muted">Recipient link</span>
              <span className="font-semibold text-pine">None</span>
            </div>
          </div>
        </div>

        {props.ledger && (
          <div className="card-editorial p-5 md:p-6 mb-4">
            <Check className="w-4 h-4 inline mr-1" />
            Your contribution now appears in the Impact tab's recognition ledger.
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button className="btn btn-primary w-full mb-3"> { props.onCloseSuccess(); props.setCustom(''); }}>
            Give again
          </button>
          <button className="btn btn-secondary w-full mb-3">
            View my donations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-bold text-ink">Give Cash</h2>
        <p className="text-sm text-muted mt-1">Into the blind pool. No recipient chosen.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {AMOUNTS_KES.map(v => {
          const active = props.selected === v && !props.custom;
          return (
            <button
              key={v}
              onClick={() => { props.setSelected(v); props.setCustom(''); }}
              className={`py-3 rounded-[16px] border text-center font-semibold text-sm transition-all ${
                active ? 'bg-pine text-white border-pine' : 'bg-canvas border-tile text-ink hover:border-pine'
              }`}
            >
              {v.toLocaleString()}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">KES</span>
        <input
          type="number"
          value={props.custom}
          onChange={e => props.setCustom(e.target.value)}
          placeholder="Custom amount"
          className="w-full bg-surface border border-tile rounded-[16px] pl-14 pr-4 py-3 text-sm font-semibold text-ink focus:ring-2 focus:ring-pine outline-none"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 bg-surface border border-tile rounded-[16px] cursor-pointer">
          <input
            type="checkbox"
            checked={props.anon}
            onChange={e => props.setAnon(e.target.checked)}
            className="accent-pine w-4 h-4"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink">Anonymous</div>
            <div className="text-xs text-muted">Recommended</div>
          </div>
        </label>
        <label className="flex items-center gap-3 p-4 bg-surface border border-tile rounded-[16px] cursor-pointer">
          <input
            type="checkbox"
            checked={props.ledger}
            onChange={e => props.setLedger(e.target.checked)}
            className="accent-pine w-4 h-4"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink">Show in recognition ledger</div>
            <div className="text-xs text-muted">Aggregate · no recipient link</div>
          </div>
        </label>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={props.handleGive}
        disabled={props.processing || props.finalAmount <= 0}
      >
        {props.processing ? 'Processing...' : `Contribute KES ${props.finalAmount.toLocaleString()}`}
      </button>

      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-muted">Your donations</h3>
          <span className="text-xs text-muted">{props.donorContributions.length}</span>
        </div>
        {props.donorContributions.length === 0 ? (
          <EmptyState Icon={Wallet} title="No donations yet" body="Give above to start your contribution history." />
        ) : props.donorContributions.slice(0, 5).map(d => (
          <div className="card-editorial p-5 md:p-6 mb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">KES {d.amount.toLocaleString()}</div>
                <div className="text-xs text-muted mt-0.5">{new Date(d.timestamp).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {d.isAnonymous && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-lime text-pine">Anon</span>
                )}
                {d.optInLedger && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Listed</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};