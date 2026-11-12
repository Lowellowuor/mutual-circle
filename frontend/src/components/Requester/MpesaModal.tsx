import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { payPoolRequestStrict } from '../../lib/apiClient';

interface Props {
  mode: 'request' | 'donation' | 'pledge';
  targetId: string;
  amount: number;
  onClose: () => void;
}

export const MpesaModal: React.FC<Props> = ({ mode, targetId, amount, onClose }) => {
  const { payPoolRequest, payDonation, payPledge, tokenHash, donorHash } = useApp();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'pending' | 'success' | 'failed'>('phone');
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setStep('pending');
    setError(null);

    try {
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000';
      let endpoint = '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (mode === 'request') {
        endpoint = `${apiBase}/requests/${targetId}/pay`;
        headers['X-Token'] = tokenHash || '';
      } else if (mode === 'donation') {
        endpoint = `${apiBase}/donations/${targetId}/pay`;
        headers['X-Donor-Hash'] = donorHash || '';
      } else if (mode === 'pledge') {
        endpoint = `${apiBase}/pledges/${targetId}/pay`;
        headers['X-Donor-Hash'] = donorHash || '';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStep('failed');
        setError(data.reason || `Failed to initiate payment (HTTP ${res.status}).`);
        return;
      }

      const interval = setInterval(async () => {
        const url = mode === 'request' ? `${apiBase}/requests/mine` : `${apiBase}/donations/mine`;
        const pollHeaders: Record<string, string> = mode === 'request' ? { 'X-Token': tokenHash || '' } : { 'X-Donor-Hash': donorHash || '' };

        try {
          const pRes = await fetch(url, { headers: pollHeaders });
          if (pRes.ok) {
            const pData = await pRes.json();
            const list = mode === 'request' ? pData.requests : (pData.donations || []);
            const item = list.find((r: any) => r.id === targetId);
            const st = mode === 'request' ? item?.payment_status : item?.status;

            if (st === 'paid') {
              setStep('success');
              clearInterval(interval);
            } else if (st === 'payment_failed' || st === 'failed') {
              setStep('failed');
              setError('Payment was cancelled or failed on the M-PESA prompt.');
              clearInterval(interval);
            }
          }
        } catch { /* ignore transient polling errors */ }
      }, 3000);

      setTimeout(() => {
        clearInterval(interval);
        setStep((prev) => prev === 'pending' ? 'failed' : prev);
        setError('Payment timed out. Please try again.');
      }, 90000);

    } catch (err: any) {
      setStep('failed');
      setError(err.message || 'Network error. Is the backend running?');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-lp-ink/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm card-editorial rounded-3xl p-6 shadow-2xl content-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-1.5 rounded-full text-lp-ink/40 hover:text-lp-ink hover:bg-lp-ink/5 press-scale transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-lp-sage flex items-center justify-center mx-auto mb-4">
            <Phone className="w-5 h-5 text-lp-green" strokeWidth={1.75} />
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-lp-ink/40">
            M-PESA STK Push
          </div>
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className="text-sm text-lp-ink/50 font-medium">KES</span>
            <span className="stat-display text-5xl text-lp-ink tabular-nums">
              {(amount / 100).toLocaleString()}
            </span>
          </div>
        </div>

        {step === 'phone' && (
          <>
            <div className="card-editorial rounded-2xl p-4 mb-4">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-ink/40 mb-2">
                M-PESA number
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                className="w-full bg-transparent border-0 outline-none p-0 stat-display text-xl text-lp-ink placeholder:text-lp-ink/20 tabular-nums"
              />
            </div>
            <button
              onClick={handlePay}
              disabled={!phone}
              className="w-full h-12 rounded-xl bg-lp-green text-white font-semibold press-scale disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send prompt
            </button>
          </>
        )}

        {step === 'pending' && (
          <div className="flex flex-col items-center py-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-lp-green mb-4" />
            <p className="display-serif text-xl text-lp-ink">Waiting for PIN.</p>
            <p className="text-sm text-lp-ink/55 mt-2 leading-relaxed">Check your phone for the M-PESA prompt.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-lp-sage flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-lp-green" strokeWidth={1.75} />
            </div>
            <p className="display-serif text-2xl text-lp-ink">Payment successful.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full h-11 rounded-xl bg-lp-ink/5 text-lp-ink font-semibold press-scale hover:bg-lp-ink/10 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {step === 'failed' && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-rose-600" strokeWidth={1.75} />
            </div>
            <p className="display-serif text-2xl text-lp-ink">Payment failed.</p>
            <p className="text-sm text-rose-600 mt-2 leading-relaxed">{error}</p>
            <button
              onClick={() => setStep('phone')}
              className="mt-6 w-full h-11 rounded-xl bg-lp-ink/5 text-lp-ink font-semibold press-scale hover:bg-lp-ink/10 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
