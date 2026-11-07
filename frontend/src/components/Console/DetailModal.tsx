import React from 'react';
import {
  X, ShieldCheck, ShieldAlert, Package, Zap, GraduationCap, Building2,
  Check, Clock, FileText, Copy, AlertTriangle, Users, Store,
} from 'lucide-react';

interface DetailModalProps {
  type: 'pool' | 'swap' | 'flag' | 'dedup' | 'pledge' | 'match' | 'voucher';
  item: any;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  utility: 'bg-amber-100 text-amber-900',
  school_fee: 'bg-blue-100 text-blue-900',
  hospital_invoice: 'bg-rose-100 text-rose-900',
  swap_bundle: 'bg-[#DCE8E0] text-[#1F6B4A]',
};

const CATEGORY_LABELS: Record<string, string> = {
  utility: 'Utility bill',
  school_fee: 'School fees',
  hospital_invoice: 'Hospital invoice',
  swap_bundle: 'Food & hygiene',
};

function fmtTime(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export const DetailModal: React.FC<DetailModalProps> = ({ type, item, onClose }) => {
  const headerTitles: Record<string, string> = {
    pool: 'Pool request',
    swap: 'Swap request',
    flag: 'Risk flag',
    dedup: 'Deduplication record',
    pledge: 'Pledge',
    match: 'Match interest',
    voucher: 'Voucher',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#111111]/10 px-5 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <div className="text-[10px] font-mono uppercase text-[#1F6B4A] tracking-wider">
              {headerTitles[type] || type}
            </div>
            <h2 className="font-serif text-lg font-bold text-[#111111]">
              {item.id ? String(item.id).slice(0, 12) + '…' : 'Detail'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#111111]/40 hover:text-[#111111] p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {(type === 'pool' || type === 'swap') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" value={type === 'swap' ? 'Swap' : 'Pool'} />
                <Field
                  label="Category"
                  value={
                    <span className={'inline-block px-2 py-0.5 rounded text-[11px] font-semibold ' + (CATEGORY_COLORS[item.category] || 'bg-black/5 text-[#111111]/70')}>
                      {CATEGORY_LABELS[item.category] || item.category || 'Bundle'}
                    </span>
                  }
                />
                <Field label="Amount" value={item.amount ? 'KES ' + item.amount.toLocaleString() : (type === 'swap' ? 'Free' : '—')} mono />
                <Field label="Tier" value={'T' + (item.tier || 1)} mono />
                <Field
                  label="Status"
                  value={
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-blue-50 text-blue-800 border border-blue-200">
                      {(item.status || '').replace(/_/g, ' ')}
                    </span>
                  }
                />
                <Field label="Timestamp" value={fmtTime(item.timestamp)} mono />
              </div>

              {item.hashedObjectId && (
                <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg">
                  <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-1">Hashed object reference</div>
                  <div className="font-mono text-sm text-[#1F6B4A] font-bold">{item.hashedObjectId}</div>
                  <div className="text-[10px] text-[#111111]/50 mt-1">
                    Original object ID is never stored — only this keyed hash. Staff cannot reverse it.
                  </div>
                </div>
              )}

              {type === 'swap' && item.pin && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-[10px] font-mono uppercase text-purple-900 mb-1">Collection PIN</div>
                  <div className="font-mono text-2xl font-bold text-purple-900 tracking-widest">{item.pin}</div>
                  {item.lockerLocation && (
                    <div className="text-[11px] text-purple-900/70 mt-1">{item.lockerLocation}</div>
                  )}
                </div>
              )}

              <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-1.5">Requester token</div>
                <div className="font-mono text-xs text-[#111111] break-all">{item.tokenHash || '—'}</div>
                <div className="text-[10px] text-[#111111]/50 mt-1">Only the HMAC token. No name, phone, or address.</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-emerald-900 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> What this record proves
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  A request of this category was made by this anonymous token. If dispatched, a matching ledger entry exists with a hash chain — independently verifiable on the Public Ledger page.
                </p>
              </div>
            </>
          )}

          {type === 'flag' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Severity" value={
                  <span className={'inline-block px-2 py-0.5 rounded text-[11px] uppercase font-bold ' + (item.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}>
                    {item.severity}
                  </span>
                } />
                <Field label="Status" value={
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-blue-50 text-blue-800 border border-blue-200">
                    {(item.status || '').replace(/_/g, ' ')}
                  </span>
                } />
                <Field label="Timestamp" value={fmtTime(item.timestamp)} mono />
                <Field label="Target hash" value={item.targetHash || '—'} mono />
              </div>

              <div className="p-3 bg-white border border-[#111111]/10 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-1">Title</div>
                <div className="text-sm font-semibold text-[#111111]">{item.title}</div>
              </div>

              <div className="p-3 bg-white border border-[#111111]/10 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-1">Description</div>
                <p className="text-xs text-[#111111]/80 leading-relaxed">{item.description}</p>
              </div>

              {item.investigationNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[10px] font-mono uppercase text-amber-900 mb-1">Investigation notes</div>
                  <p className="text-xs text-amber-900/80 leading-relaxed">{item.investigationNotes}</p>
                </div>
              )}
            </>
          )}

          {type === 'dedup' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hashed object ID" value={item.hashedObjectId} mono />
              <Field label="Object type" value={item.objectType} />
              <Field label="First funded by" value={item.firstFundedBy} />
              <Field label="First funded date" value={item.firstFundedDate} mono />
              <Field label="Duplicate attempt" value={item.duplicateAttemptDate} mono />
              <Field label="Status" value={
                <span className="inline-block px-2 py-0.5 rounded text-[11px] uppercase font-mono bg-rose-50 text-rose-800 border border-rose-200">
                  {(item.status || '').replace(/_/g, ' ')}
                </span>
              } />
            </div>
          )}

          {type === 'pledge' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" value={item.type === 'service_credit' ? 'Service credit' : 'Surplus goods'} />
                <Field label="Locality" value={item.locality} />
                <Field label="Status" value={
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] uppercase font-mono bg-amber-50 text-amber-800 border border-amber-200">
                    {(item.status || '').replace(/_/g, ' ')}
                  </span>
                } />
                <Field label="Timestamp" value={fmtTime(item.timestamp)} mono />
              </div>
              <div className="p-3 bg-white border border-[#111111]/10 rounded-lg">
                <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-1">Description</div>
                <p className="text-sm text-[#111111]">{item.description}</p>
              </div>
              {item.maxValue !== undefined && (
                <Field label="Max value" value={'KES ' + Number(item.maxValue).toLocaleString()} mono />
              )}
            </div>
          )}

          {type === 'match' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opportunity" value={item.title} />
              <Field label="Status" value={
                <span className="inline-block px-2 py-0.5 rounded text-[11px] uppercase font-mono bg-blue-50 text-blue-800 border border-blue-200">
                  {item.status}
                </span>
              } />
              <Field label="Requester token" value={item.tokenHash || '—'} mono />
              <Field label="Timestamp" value={fmtTime(item.timestamp)} mono />
            </div>
          )}

          {type === 'voucher' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Partner" value={item.partnerName} />
              <Field label="Type" value={item.partnerType} />
              <Field label="Max value" value={item.maxValue ? 'KES ' + item.maxValue.toLocaleString() : '—'} mono />
              <Field label="PIN (last 4)" value={item.pin || '****'} mono />
              <Field label="Status" value={
                <span className="inline-block px-2 py-0.5 rounded text-[11px] uppercase font-mono bg-purple-50 text-purple-800 border border-purple-200">
                  {item.status}
                </span>
              } />
              <Field label="Expires" value={item.expiresAt} mono />
            </div>
          )}

          <div className="pt-3 border-t border-[#111111]/10">
            <div className="text-[10px] text-[#111111]/50 leading-relaxed">
              This modal shows the complete data the system holds for this record. No fields are hidden from authorized staff. Recipient identity is not available because it does not exist in the schema.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div className="text-[10px] font-mono uppercase text-[#111111]/50 mb-0.5">{label}</div>
    <div className={'text-sm text-[#111111] ' + (mono ? 'font-mono' : '')}>{value}</div>
  </div>
);