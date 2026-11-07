import React, { useEffect, useState } from 'react';
import { isBackendActive, subscribeBackendState, resetBackendProbe } from '../../lib/apiClient';

const HEALTH_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000';
const PROBE_INTERVAL_MS = 10_000;

export const BackendBanner: React.FC = () => {
  const [down, setDown] = useState(!isBackendActive());
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeBackendState((d) => setDown(d));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!down) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`${HEALTH_URL}/health`, { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
          resetBackendProbe();
          setDown(false);
        }
      } catch {   }
    }, PROBE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [down]);

  const retry = async () => {
    setRetrying(true);
    try {
      const r = await fetch(`${HEALTH_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        resetBackendProbe();
        setDown(false);
      }
    } catch {   }
    setRetrying(false);
  };

  if (!down) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2 text-xs font-mono flex items-center justify-between gap-2 shadow-lg">
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <strong>Backend unreachable</strong>
        <span className="opacity-75">— data cannot load</span>
      </span>
      <button
        onClick={retry}
        disabled={retrying}
        className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 disabled:opacity-50 font-bold shrink-0"
      >
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
};