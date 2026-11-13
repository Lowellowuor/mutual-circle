import { ScreenHeader } from '../../ui';
import React from 'react';
import { Check, Package, MapPin, Handshake } from 'lucide-react';
import { EmptyState } from '../Shared/EmptyState';

interface PledgeFlowProps {
  showSuccess: boolean;
  onCloseSuccess: () => void;
  onViewPledges: () => void;
  pType: 'service_credit' | 'goods';
  setPType: (t: 'service_credit' | 'goods') => void;
  pDesc: string;
  setPDesc: (v: string) => void;
  pValue: string;
  setPValue: (v: string) => void;
  pLocality: string;
  setPLocality: (v: string) => void;
  pProcessing: boolean;
  handlePledge: () => void;
  pledges: any[];
  payingPledge: { id: string; amount: number } | null;
  setPayingPledge: (p: { id: string; amount: number } | null) => void;
}

const LOCALITIES = ['Nairobi County', 'Mombasa County', 'Kisumu County', 'Nakuru County'];

export const PledgeFlow: React.FC<PledgeFlowProps> = (props) => {
  if (props.showSuccess) {
    const stillUnpaid = props.payingPledge
      && props.pledges.find(p => p.id === props.payingPledge!.id)?.status !== 'settled';

    return (
      <div className="space-y-4 pb-20">
      <ScreenHeader number="02" eyebrow="Pledge" title="Pledge Resource" subtitle="Goods or credit. Matched by category." />
        <div className="pt-6 text-center space-y-3">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <Check className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Pledge received</h2>
            <p className="text-sm text-muted mt-1">Matching in {props.pLocality}.</p>
          </div>
        </div>

        <div className="card-editorial p-5 md:p-6 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Type</span>
              <span className="font-semibold text-ink">{props.pType === 'service_credit' ? 'Service credit' : 'Goods'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Locality</span>
              <span className="font-semibold text-ink">{props.pLocality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Status</span>
              <span className="font-semibold text-amber-700">Awaiting match</span>
            </div>
          </div>
        </div>

        <div className="card-editorial p-5 md:p-6 mb-4">
          Your pledge is now visible to the Operations team for matching.
        </div>

        <div className="space-y-3 pt-2">
          {stillUnpaid && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => props.setPayingPledge(props.payingPledge)}
              className="bg-green-600 hover:bg-green-700"
            >
              Pay with M-PESA
            </button>
          )}
          <button className="btn btn-primary w-full mb-3"> { props.onCloseSuccess(); props.setPDesc(''); props.setPValue(''); }}>
            Pledge again
          </button>
          <button className="btn btn-secondary w-full mb-3">
            View my pledges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-bold text-ink">Pledge Resource</h2>
        <p className="text-sm text-muted mt-1">Matched by category and locality. Never by name.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => props.setPType('service_credit')}
          className={`p-4 rounded-[16px] border text-left transition-all ${
            props.pType === 'service_credit' ? 'bg-pine border-pine text-white' : 'bg-canvas border-tile text-ink'
          }`}
        >
          <Handshake className={`w-5 h-5 mb-2 ${props.pType === 'service_credit' ? 'text-white' : 'text-amber-600'}`} />
          <div className="text-sm font-bold">Service Credit</div>
          <div className={`text-xs mt-1 ${props.pType === 'service_credit' ? 'text-white/70' : 'text-muted'}`}>Pay a bill</div>
        </button>
        <button
          onClick={() => props.setPType('goods')}
          className={`p-4 rounded-[16px] border text-left transition-all ${
            props.pType === 'goods' ? 'bg-pine border-pine text-white' : 'bg-canvas border-tile text-ink'
          }`}
        >
          <Package className={`w-5 h-5 mb-2 ${props.pType === 'goods' ? 'text-white' : 'text-blue-600'}`} />
          <div className="text-sm font-bold">Surplus Goods</div>
          <div className={`text-xs mt-1 ${props.pType === 'goods' ? 'text-white/70' : 'text-muted'}`}>Food, blankets</div>
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-muted">Description</label>
        <input
          value={props.pDesc}
          onChange={e => props.setPDesc(e.target.value)}
          placeholder={props.pType === 'service_credit' ? 'Bill up to KES 5,000' : 'e.g. 50kg maize'}
          className="w-full bg-surface border border-tile rounded-[16px] px-4 py-3 text-sm focus:ring-2 focus:ring-pine outline-none"
        />
      </div>

      {props.pType === 'service_credit' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted">Max value (KES)</label>
          <input
            type="number"
            value={props.pValue}
            onChange={e => props.setPValue(e.target.value)}
            placeholder="5000"
            className="w-full bg-surface border border-tile rounded-[16px] px-4 py-3 text-sm focus:ring-2 focus:ring-pine outline-none"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-muted flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Locality
        </label>
        <select
          value={props.pLocality}
          onChange={e => props.setPLocality(e.target.value)}
          className="w-full bg-surface border border-tile rounded-[16px] px-4 py-3 text-sm focus:ring-2 focus:ring-pine outline-none"
        >
          {LOCALITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={props.handlePledge}
        disabled={props.pProcessing || !props.pDesc}
      >
        {props.pProcessing ? 'Submitting...' : 'Submit Pledge'}
      </button>

      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-muted">Your Pledges</h3>
          <span className="text-xs text-muted">{props.pledges.length}</span>
        </div>
        {props.pledges.length === 0 ? (
          <EmptyState Icon={Package} title="No pledges yet" body="Submit a pledge above to match with requests." />
        ) : props.pledges.map(p => {
          const statusLabel = p.status === 'awaiting_match' ? 'Awaiting match' : p.status === 'matched' ? 'Matched' : 'Delivered';
          const statusClass = p.status === 'awaiting_match'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : p.status === 'matched'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200';
          const linkedReqId = (p as any).linked_request_id || (p as any).linkedRequestId;
          const ref = linkedReqId ? 'REF-' + String(linkedReqId).slice(0, 8).toUpperCase() : null;
          return (
            <div className="card-editorial p-5 md:p-6 mb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink truncate">{p.description}</div>
                  <div className="text-xs text-muted mt-1">{p.locality} · {p.type === 'goods' ? 'Goods' : 'Service credit'}</div>
                </div>
                <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full border shrink-0 ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
              {ref && p.status === 'settled' && (
                <div className="text-sm text-emerald-900 pt-2 border-t border-emerald-200 flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span>Delivered to <strong>{ref}</strong> — thank you.</span>
                </div>
              )}
              {ref && p.status !== 'settled' && (
                <div className="text-sm text-pine pt-2 border-t border-tile">Linked to {ref}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};