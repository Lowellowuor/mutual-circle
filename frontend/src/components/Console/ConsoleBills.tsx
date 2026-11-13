import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { getInstitutionalQueue, confirmInstitutionalPayment } from '../../lib/apiClient';
import { useToast } from '../Shared/Toast';

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
          push({ kind: 'success', message: 'Payment confirmed. SMS sent to requester.' });
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
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#1F6B4A]" /> KPLC Bill Payments
        </h2>
        <button onClick={fetchQueue} className="text-xs font-semibold text-[#1F6B4A] bg-[#1F6B4A]/10 px-3 py-1.5 rounded-lg">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-[#111111]/50">Loading queue...</div>
      ) : queue.pending.length === 0 ? (
        <div className="text-sm text-[#111111]/50 bg-white p-6 rounded-xl border border-[#111111]/5 text-center">
          No pending KPLC bills right now.
        </div>
      ) : (
        <div className="space-y-3">
          {queue.pending.map((req) => (
            <div key={req.request_id} className="bg-white p-4 rounded-xl border border-[#111111]/5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#111111]">Meter: {req.raw_object_id || 'Unknown'}</div>
                <div className="text-xs text-[#111111]/50 mt-1">
                  Amount: <span className="font-mono text-[#1F6B4A]">KES {req.amount_kes}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReq(req)}
                className="px-4 py-2 bg-[#1F6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#18553a]"
              >
                Confirm Payment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent Payments */}
      {queue.recent.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#111111]/40 mb-3">Recently Paid</h3>
          <div className="space-y-2">
            {queue.recent.map((req) => (
              <div key={req.payment_id} className="text-xs text-[#111111]/70 flex justify-between border-b border-[#111111]/5 pb-2">
                <span>{req.request_id.slice(0,8)} - Ref: {req.bank_transaction_ref}</span>
                <span className="text-green-600 font-medium">KES {req.amount_pence / 100}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FAF8F4] w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#111111]">Confirm KPLC Payment</h3>
              <button onClick={() => setSelectedReq(null)}><X className="w-4 h-4 text-[#111111]/50" /></button>
            </div>
            
            <div className="text-sm bg-white p-3 rounded-lg border border-[#111111]/10 space-y-1">
              <div className="flex justify-between"><span className="text-[#111111]/50">Meter:</span> <span className="font-mono">{selectedReq.raw_object_id}</span></div>
              <div className="flex justify-between"><span className="text-[#111111]/50">Amount:</span> <span className="font-mono text-[#1F6B4A]">KES {selectedReq.amount_kes}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#111111]/70 block mb-1">Bank Transaction Ref</label>
                <input
                  type="text"
                  value={bankRef}
                  onChange={e => setBankRef(e.target.value)}
                  placeholder="e.g. QWE123456"
                  className="w-full h-10 px-3 rounded-lg border border-[#111111]/15 bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#111111]/70 block mb-1">KPLC Token</label>
                <input
                  type="text"
                  value={kplcToken}
                  onChange={e => setKplcToken(e.target.value)}
                  placeholder="e.g. 1234-5678-9012"
                  className="w-full h-10 px-3 rounded-lg border border-[#111111]/15 bg-white text-sm font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!bankRef || !kplcToken || submitting}
              className="w-full py-2.5 bg-[#1F6B4A] text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Confirming...' : 'Confirm & Send SMS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
