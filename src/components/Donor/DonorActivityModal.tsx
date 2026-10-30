import React from 'react';
import { X, Check, Wallet, Package, ShieldCheck } from 'lucide-react';

interface DonorActivityModalProps {
  item: any;
  onClose: () => void;
}

export const DonorActivityModal: React.FC<DonorActivityModalProps> = ({ item, onClose }) => {
  const isDonation = item.kind === 'donation';
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-[#111111]/10 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (isDonation ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
              {isDonation ? <Wallet className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-[#111111]/50">
                {isDonation ? 'Gift to blind pool' : 'Pledge'}
              </div>
              <h2 className="font-serif text-sm font-bold text-[#111111]">
                {item.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#111111]/40 hover:text-[#111111] p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {isDonation && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-0.5">Amount</div>
                  <div className="font-mono text-xl font-bold text-[#1F6B4A]">KES {Number(item.amountKes || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-0.5">Timestamp</div>
                  <div className="text-xs text-[#111111]">{new Date(item.timestamp).toLocaleString()}</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-emerald-900 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Recipient link
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  This gift is NOT linked to any specific recipient. It went into the undifferentiated pool. No field in the database connects your donation to a disbursement.
                </p>
              </div>
            </>
          )}

          {!isDonation && (
            <>
              <div className="p-3 bg-white border border-[#111111]/10 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-1">Description</div>
                <div className="text-sm text-[#111111]">{item.title.replace('Pledge: ', '')}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-0.5">Locality</div>
                  <div className="text-xs text-[#111111]">{(item.subtitle || '').split(' · ')[0]}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-0.5">Status</div>
                  <div className="text-xs text-[#111111]">{(item.subtitle || '').split(' · ')[1] || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-0.5">Timestamp</div>
                  <div className="text-xs text-[#111111]">{new Date(item.timestamp).toLocaleString()}</div>
                </div>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-[#111111]/10">
            <div className="text-[10px] text-[#111111]/50 leading-relaxed">
              Activity is stored against your persistent donor hash. It survives logout, page refresh, and new sessions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};