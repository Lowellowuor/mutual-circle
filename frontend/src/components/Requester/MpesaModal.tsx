import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  requestId: string;
  amount: number;
  onClose: () => void;
}

export const MpesaModal: React.FC<Props> = ({ requestId, amount, onClose }) => {
  const { payPoolRequest } = useApp();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'pending' | 'success' | 'failed'>('phone');
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setStep('pending');
    setError(null);
    const ok = await payPoolRequest(requestId, phone);
    if (!ok) {
      setStep('failed');
      setError('Failed to initiate payment. Check your number and try again.');
    } else {
      // Start polling
      const interval = setInterval(async () => {
        // In a real app, we'd have a specific fetch request for this ID
        // Here we rely on the AppContext refetching the whole list
        // We'll simulate a check by fetching the status
        const res = await fetch(`http://127.0.0.1:8000/requests/mine`, {
          headers: { 'X-Token': localStorage.getItem('token') || '' }
        });
        if (res.ok) {
          const data = await res.json();
          const req = data.requests.find((r: any) => r.id === requestId);
          if (req?.payment_status === 'paid') {
            setStep('success');
            clearInterval(interval);
          } else if (req?.payment_status === 'payment_failed') {
            setStep('failed');
            setError('Payment was cancelled or failed.');
            clearInterval(interval);
          }
        }
      }, 3000);
      // Timeout after 90 seconds
      setTimeout(() => {
        clearInterval(interval);
        if (step === 'pending') {
          setStep('failed');
          setError('Payment timed out. Please try again.');
        }
      }, 90000);
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