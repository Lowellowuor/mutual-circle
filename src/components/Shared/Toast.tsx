import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: string; kind: ToastKind; message: string; ttl?: number };
type Ctx = { push: (t: Omit<Toast, 'id'>) => void };

const ToastCtx = createContext<Ctx>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = (id: string) => setToasts(prev => prev.filter(x => x.id !== id));

  const push = (t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    const ttl = t.ttl ?? (t.kind === 'error' ? 5000 : 3500);
    setTimeout(() => dismiss(id), ttl);
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[200] space-y-2 pointer-events-none px-4 w-full max-w-sm">
        {toasts.map(t => {
          const Icon = t.kind === 'success' ? CheckCircle : AlertCircle;
          const bg = t.kind === 'success' ? 'bg-emerald-600' : t.kind === 'error' ? 'bg-rose-600' : 'bg-[#111111]';
          return (
            <div
              key={t.id}
              className={`${bg} text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-200`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
};