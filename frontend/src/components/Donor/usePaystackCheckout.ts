import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { startPaystackCheckout, type PaymentKind } from '../../lib/apiClient';

/**
 * Calls the pay endpoint and sends the browser to Paystack's hosted checkout.
 * Paystack then returns the donor to /donor/payment-return?reference=...
 */
export function usePaystackCheckout(kind: PaymentKind) {
  const { donorHash } = useApp();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (id: string) => {
    setError(null);
    setRedirecting(true);
    try {
      const { authorization_url } = await startPaystackCheckout(kind, donorHash, id);
      if (!authorization_url || !authorization_url.startsWith('https://')) {
        throw new Error('Paystack did not return a secure checkout link.');
      }
      // Leave `redirecting` on: the page is navigating away.
      window.location.assign(authorization_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the payment. Please try again.');
      setRedirecting(false);
    }
  };

  return { start, redirecting, error };
}
