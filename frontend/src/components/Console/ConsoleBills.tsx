import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { getInstitutionalQueue, confirmInstitutionalPayment } from '../../lib/apiClient';
import { useToast } from '../Shared/Toast';
import { ScreenHeader, StatDisplay } from '../../ui';

interface Props {
  sessionToken: string;
}

export const ConsoleBills: React.FC<Props> = ({ sessionToken }) => {
  const [queue, setQueue] = useState<{ pending: any[]; recent: any[] }>({ pending: [], recent: [] });
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [kplcToken, setKplcToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { push } = useToast();

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await getInstitutionalQueue(sessionToken);
      if (res) setQueue({ pending: res.pending, recent: res.recent });
    } catch (e) {
      console.error(e);
      push({ kind: 'error', message: 'Failed to load queue' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [sessionToken]);

  const handleConfirm = async () => {
    if (!selectedReq || !bankRef || !kplcToken) return;
    setSubmitting(true);
    try {
      const res = await confirmInstitutionalPayment(sessionToken, selectedReq.request_id, bankRef, kplcToken);
      if (res?.ok) {
        if (res.sms_delivered) {
          push({ kind: 'success', message: 'Payment confirmed. SMS sent.' });
        } else {
          push({ kind: 'error', message: `Paid, but SMS failed: ${res.sms_error}` });
        }
        setSelectedReq(null);
        setBankRef('');
        setKplcToken('');
        fetchQueue();
      }
    } catch (e: any) {
      push({ kind: 'error', message: e.message || 'Confirmation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative pb-20 content-in">
      {/* Ambient orb matching the rest of the app */}
      <div className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.65) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="04"
        eyebrow="Operations"
        title="KPLC Payments"
        subtitle="Confirm bank transfers and dispatch tokens to requesters instantly."
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="eyebrow text-[#111111]/60">Pending Queue</h2>
        <button onClick={fetchQueue} className="text-xs font-semibold text-[#1F6B4A] hover:text-[#18553a] transition-colors press-scale">
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-[#111111]/50 text-center py-8">Loading queue...</div>
      ) : queue.pending.length === 0 ? (
        <div className="card-editorial p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F4] flex items-center justify-center mx-auto mb-4 border border-[#E8E6DE]">
            <Receipt className="w-5 h-5 text-[#111111]/30" />
          </div>
          <h3 className="type-h2-m text-[#111111]">All caught up.</h3>
          <p className="type-body-m text-[#111111]/50 mt-2">No pending KPLC bills right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.pending.map((req) => (
            <div key={req.request_id} className="card-editorial p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="eyebrow text-[#1F6B4A] mb-1">Meter {req.raw_object_id || 'Unknown'}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-[#111111]/50 font-medium">KES</span>
                  <span className="stat-display text-3xl text-[#111111] tabular-nums">{req.amount_kes.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReq(req)}
                className="btn btn-primary w-full md:w-auto"
              >
                Confirm Payment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent Payments */}
      {queue.recent.length > 0 && (
        <div className="mt-12">
          <h3 className="eyebrow text-[#111111]/40 mb-4">Recently Paid</h3>
          <div className="surface-solid r-card overflow-hidden divide-y divide-[#E8E6DE]">
            {queue.recent.map((req) => (
              <div key={req.payment_id} className="p-4 flex justify-between items-center hover:bg-[#FAF8F4] transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#1F6B4A]" />
                  <span className="text-sm font-mono text-[#111111]/70">{req.request_id.slice(0,8)}</span>
                  <span className="text-xs text-[#111111]/40">Ref: {req.bank_transaction_ref}</span>
                </div>
                <span className="text-sm font-medium text-[#111111] tabular-nums">KES {(req.amount_pence / 100).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal - Editorial Style */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-0">
          <div className="bg-[#FAF8F4] w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] content-in">
            <div className="flex items-center justify-between p-6 border-b border-[#E8E6DE]">
              <div>
                <div className="eyebrow text-[#1F6B4A] mb-1">Confirm Transfer</div>
                <h2 className="text-lg font-semibold text-[#111111]">KPLC Token</h2>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors press-scale">
                <X className="w-4 h-4 text-[#111111]" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="surface-solid r-card p-5 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-[#111111]/50">Meter Number</span>
                  <span className="font-mono text-sm font-semibold text-[#111111]">{selectedReq.raw_object_id}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-[#111111]/50">Amount to Pay</span>
                  <span className="stat-display text-2xl text-[#1F6B4A]">KES {selectedReq.amount_kes.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block section-label mb-2">Bank Transaction Ref</label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={e => setBankRef(e.target.value)}
                    placeholder="e.g. QWE123456"
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#E8E6DE] text-sm text-[#111111] focus:outline-none focus:border-[#1F6B4A] focus:ring-2 focus:ring-[#1F6B4A]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block section-label mb-2">KPLC Token</label>
                  <input
                    type="text"
                    value={kplcToken}
                    onChange={e => setKplcToken(e.target.value)}
                    placeholder="e.g. 1234-5678-9012"
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#E8E6DE] text-sm font-mono text-[#111111] focus:outline-none focus:border-[#1F6B4A] focus:ring-2 focus:ring-[#1F6B4A]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#E8E6DE] bg-white rounded-b-3xl">
              <button
                onClick={handleConfirm}
                disabled={!bankRef || !kplcToken || submitting}
                className="btn btn-primary w-full"
              >
                {submitting ? 'Confirming...' : 'Confirm & Send SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
