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
        // Show the exact error from the backend (e.g. "Daily rate limit reached", "Request already paid")
        setStep('failed');
        setError(data.reason || `Failed to initiate payment (HTTP ${res.status}).`);
        return;
      }

      // Success - start polling
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="mb-6 flex flex-col items-center">
          <div className="mb-2 rounded-full bg-green-100 p-3 text-green-700">
            <Phone size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Pay KES {amount / 100}</h2>
          <p className="text-sm text-gray-500">M-PESA STK Push</p>
        </div>

        {step === 'phone' && (
          <>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +254712345678"
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-center focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            <button
              onClick={handlePay}
              disabled={!phone}
              className="w-full rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Send Prompt
            </button>
          </>
        )}

        {step === 'pending' && (
          <div className="flex flex-col items-center py-6 text-center">
            <Loader2 size={36} className="animate-spin text-green-600 mb-4" />
            <p className="font-semibold text-gray-900">Waiting for PIN...</p>
            <p className="text-sm text-gray-500 mt-2">Check your phone for the M-PESA prompt.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <p className="font-bold text-gray-900 text-lg">Payment Successful</p>
            <button onClick={onClose} className="mt-6 w-full rounded-lg bg-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-200">
              Close
            </button>
          </div>
        )}

        {step === 'failed' && (
          <div className="flex flex-col items-center py-6 text-center">
            <XCircle size={48} className="text-red-500 mb-4" />
            <p className="font-bold text-gray-900 text-lg">Payment Failed</p>
            <p className="text-sm text-red-500 mt-2">{error}</p>
            <button onClick={() => setStep('phone')} className="mt-6 w-full rounded-lg bg-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-200">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};