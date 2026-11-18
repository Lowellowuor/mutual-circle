import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { ApiError, verifyPaystackPayment, type PaymentVerification } from '../lib/apiClient';
import { readDonorHash } from '../lib/donorHash';

// Paystack sends the donor back to /donor/payment-return?trxref=...&reference=...
// This page never trusts the query string: it asks the backend, which asks Paystack.

const MAX_AUTO_CHECKS = 6;
const RETRY_MS = 3000;
const DONOR_URL = `${import.meta.env.BASE_URL}donor`;

type View =
  | { kind: 'checking' }
  | { kind: 'paid'; payment: PaymentVerification }
  | { kind: 'failed'; payment: PaymentVerification }
  | { kind: 'pending'; payment: PaymentVerification; exhausted: boolean }
  | { kind: 'error'; message: string; retryable: boolean };

function readReference(): string | null {
  const q = new URLSearchParams(window.location.search);
  return q.get('reference') || q.get('trxref');
}

function formatAmount(p: PaymentVerification): string {
  return `${p.currency} ${(p.amount_pence / 100).toLocaleString()}`;
}

function initialView(reference: string | null, donorHash: string | null): View {
  if (!reference) {
    return { kind: 'error', retryable: false, message: 'This page needs a payment reference. Open it from the link Paystack sends you back to.' };
  }
  if (!donorHash) {
    return { kind: 'error', retryable: false, message: 'Open this page in the same browser you used to give, so we can match the payment to you.' };
  }
  return { kind: 'checking' };
}

export default function PaymentReturn() {
  const [reference] = useState(readReference);
  const [donorHash] = useState(readDonorHash);
  const [view, setView] = useState<View>(() => initialView(reference, donorHash));
  const attempts = useRef(0);
  const timer = useRef<number | null>(null);

  const check = useCallback(async () => {
    if (!reference || !donorHash) return;
    attempts.current += 1;
    try {
      const payment = await verifyPaystackPayment(donorHash, reference);
      if (payment.status === 'paid') {
        setView({ kind: 'paid', payment });
      } else if (payment.status === 'failed' || payment.status === 'abandoned') {
        setView({ kind: 'failed', payment });
      } else {
        const exhausted = attempts.current >= MAX_AUTO_CHECKS;
        setView({ kind: 'pending', payment, exhausted });
        if (!exhausted) timer.current = window.setTimeout(check, RETRY_MS);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setView({ kind: 'error', retryable: false, message: 'We could not find this payment. If money left your account, contact us with the reference below.' });
      } else {
        setView({ kind: 'error', retryable: true, message: e instanceof Error ? e.message : 'Something went wrong while checking your payment.' });
      }
    }
  }, [reference, donorHash]);

  useEffect(() => {
    void check();
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [check]);

  const checkAgain = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    attempts.current = 0;
    setView({ kind: 'checking' });
    void check();
  };

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm card-editorial rounded-3xl p-6 shadow-2xl content-in text-center"
        aria-live="polite"
        aria-busy={view.kind === 'checking'}
      >
        <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-lp-ink/40 mb-5">
          Paystack payment
        </div>

        {view.kind === 'checking' && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-lp-green mb-4" />
            <p className="display-serif text-xl text-lp-ink">Confirming your payment.</p>
            <p className="text-sm text-lp-ink/55 mt-2 leading-relaxed">Checking with Paystack. This takes a moment.</p>
          </div>
        )}

        {view.kind === 'paid' && (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-lp-sage flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-lp-green" strokeWidth={1.75} />
            </div>
            <p className="display-serif text-2xl text-lp-ink">Payment received.</p>
            <p className="stat-display text-3xl text-lp-ink tabular-nums mt-3">{formatAmount(view.payment)}</p>
            <p className="text-sm text-lp-ink/55 mt-2 leading-relaxed">
              {view.payment.kind === 'pledge'
                ? 'Your pledge is paid and ready to be matched. Thank you.'
                : 'Your gift is in the blind pool. Thank you.'}
            </p>
          </div>
        )}

        {view.kind === 'failed' && (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-rose-600" strokeWidth={1.75} />
            </div>
            <p className="display-serif text-2xl text-lp-ink">Payment not completed.</p>
            <p className="text-sm text-lp-ink/55 mt-2 leading-relaxed">
              {view.payment.status === 'abandoned'
                ? 'The payment was cancelled before it finished. No money was taken.'
                : 'Paystack could not complete this payment. No money was taken.'}{' '}
              You can try again from the Donor Portal.
            </p>
          </div>
        )}

        {view.kind === 'pending' && (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              {view.exhausted
                ? <Clock className="w-7 h-7 text-amber-600" strokeWidth={1.75} />
                : <Loader2 className="w-7 h-7 animate-spin text-amber-600" />}
            </div>
            <p className="display-serif text-2xl text-lp-ink">Still processing.</p>
            <p className="text-sm text-lp-ink/55 mt-2 leading-relaxed">
              {view.exhausted
                ? 'Paystack has not confirmed this payment yet. It will update on its own once it does. You can check again or come back later.'
                : 'Paystack is still confirming this payment. Checking again…'}
            </p>
            {view.exhausted && (
              <button
                onClick={checkAgain}
                className="mt-5 w-full h-11 rounded-xl bg-lp-ink/5 text-lp-ink font-semibold press-scale hover:bg-lp-ink/10 transition-colors"
              >
                Check again
              </button>
            )}
          </div>
        )}

        {view.kind === 'error' && (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-rose-600" strokeWidth={1.75} />
            </div>
            <p className="display-serif text-2xl text-lp-ink">We couldn't confirm this payment.</p>
            <p role="alert" className="text-sm text-rose-600 mt-2 leading-relaxed">{view.message}</p>
            {view.retryable && (
              <button
                onClick={checkAgain}
                className="mt-5 w-full h-11 rounded-xl bg-lp-ink/5 text-lp-ink font-semibold press-scale hover:bg-lp-ink/10 transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}

        <a
          href={DONOR_URL}
          className="mt-4 inline-flex w-full h-12 items-center justify-center rounded-xl bg-lp-green text-white font-semibold press-scale"
        >
          Back to Donor Portal
        </a>

        {reference && (
          <p className="mt-4 text-[11px] text-lp-ink/40 break-all">
            Reference <span className="font-mono">{reference}</span>
          </p>
        )}
      </div>
    </main>
  );
}
