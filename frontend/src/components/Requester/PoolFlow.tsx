import React, { useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, FileText, Check, Zap, GraduationCap, Building2, Camera } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ScreenHeader } from '../../ui';

const POOL_CATS = [
  { id: 'utility' as const, name: 'Utility Bill', desc: 'KPLC or Nairobi Water', Icon: Zap, objLabel: 'Meter number', placeholder: 'e.g. 541234567' },
  { id: 'school_fee' as const, name: 'School Fees', desc: 'Secondary term fees', Icon: GraduationCap, objLabel: 'Admission number', placeholder: 'e.g. 2024118' },
  { id: 'hospital_invoice' as const, name: 'Hospital Invoice', desc: 'No clinical details', Icon: Building2, objLabel: 'Invoice number', placeholder: 'e.g. 78432' },
] as const;

type PoolCat = typeof POOL_CATS[number]['id'];
type PoolStep = 'category' | 'details' | 'photo' | 'success';

interface PoolFlowProps {
  poolStep: PoolStep;
  setPoolStep: (step: PoolStep) => void;
  poolResult: any | null;
  poolCat: PoolCat | null;
  setPoolCat: (id: PoolCat) => void;
  poolObject: string;
  setPoolObject: (val: string) => void;
  poolAmount: string;
  setPoolAmount: (val: string) => void;
  poolError: string | null;
  setPoolError: (err: string | null) => void;
  objectError: string | null;
  objectValid: boolean;
  willEscalate: boolean;
  numAmount: number;
  valueRemaining: number;
  pooling: boolean;
  rateLimited: boolean;
  handleSubmitPool: () => void;
  evidenceUploading: boolean;
  evidenceError: string | null;
  handleUploadEvidence: (file: File) => void;
  goTab: (tab: 'home') => void;
}

export const PoolFlow: React.FC<PoolFlowProps> = (props) => {
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // ── Success bookend ──────────────────────────────────────────────────
  if (props.poolStep === 'success' && props.poolResult) {
    const cat = POOL_CATS.find(c => c.id === props.poolResult.category);
    const isPending = props.poolResult.status === 'pending_check';
    return (
      <div className="relative pb-20 content-in">
        <div
          className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
          style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
          aria-hidden="true"
        />

        <div className="relative text-center pt-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-lp-sage flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-lp-green" strokeWidth={1.75} />
          </div>
          <span className="eyebrow">{isPending ? '04 — Under review' : '04 — Submitted'}</span>
          <h2 className="display-serif mt-3 text-4xl text-lp-ink leading-tight">
            {isPending ? 'Under review.' : 'Request queued.'}
          </h2>
          <p className="mt-3 text-sm text-lp-ink/55 max-w-xs mx-auto">
            {isPending
              ? 'Photo verification needed before dispatch.'
              : 'Queued for the payment partner.'}
          </p>
        </div>

        <div className="relative card-editorial rounded-3xl p-6 text-center mb-8">
          <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-lp-ink/40">
            Amount
          </div>
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className="text-sm text-lp-ink/50 font-medium">KES</span>
            <span className="stat-display text-5xl md:text-6xl text-lp-ink tabular-nums">
              {props.poolResult.amount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="relative mb-8">
          <div className="eyebrow mb-3">Details</div>
          <div className="flex justify-between items-baseline py-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Category</span>
            <span className="text-sm font-semibold text-lp-ink">{cat?.name}</span>
          </div>
          <div className="flex justify-between items-baseline py-3 border-b border-lp-ink/8">
            <span className="text-sm text-lp-ink/55">Reference</span>
            <span className="text-xs font-mono text-lp-green">{props.poolResult.hashedObjectId}</span>
          </div>
          <div className="flex justify-between items-baseline py-3">
            <span className="text-sm text-lp-ink/55">Submitted</span>
            <span className="text-xs text-lp-ink/70">{(props.poolResult as any).timestamp || 'Just now'}</span>
          </div>
        </div>

        <div className="relative mb-8">
          <div className="eyebrow mb-3">What happens next</div>
          {[
            { key: 'submitted', label: 'Submitted', done: true },
            { key: 'review', label: isPending ? 'Photo verification' : 'Queued for partner', done: false, current: true },
            { key: 'paid', label: 'Paid to institution', done: false, current: false },
          ].map(step => (
            <div key={step.key} className="flex gap-4 py-3 border-b border-lp-ink/8 last:border-0">
              <span
                className={
                  'mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ' +
                  (step.done
                    ? 'bg-lp-green text-white'
                    : step.current
                    ? 'bg-lp-green/20 text-lp-green'
                    : 'bg-lp-ink/8 text-lp-ink/30')
                }
              >
                {step.done ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className="text-sm text-lp-ink/70 leading-relaxed">{step.label}</span>
            </div>
          ))}
        </div>

        <Button onClick={() => props.goTab('home')} fullWidth>
          Done
        </Button>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────
  const stepOrder: Record<string, number> = { category: 0, details: 1, photo: 2 };
  const current = stepOrder[props.poolStep] ?? 0;

  return (
    <div className="relative pb-20 content-in">
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="03"
        eyebrow="Pool"
        title={
          props.poolStep === 'category' ? 'What are you paying?'
          : props.poolStep === 'details' ? 'Bill details.'
          : 'Proof of bill.'
        }
        subtitle={
          props.poolStep === 'category' ? 'Funds go directly to the institution.'
          : props.poolStep === 'details' ? 'We check the bill, not you.'
          : 'Upload the bill. Only staff see it.'
        }
      />

      {props.rateLimited && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-900">Daily limit reached.</p>
        </div>
      )}
      {props.poolError && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-900">{props.poolError}</p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
        {(['category', 'details', 'photo'] as const).map((s, i) => (
          <React.Fragment key={s}>
            <div className={'flex items-center gap-1.5 ' + (current >= i ? 'text-lp-green' : 'text-lp-ink/40')}>
              <span className="stat-display text-sm tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] font-semibold hidden sm:inline">
                {s === 'category' ? 'Category' : s === 'details' ? 'Details' : 'Photo'}
              </span>
            </div>
            {i < 2 && <div className={'flex-1 h-px ' + (current > i ? 'bg-lp-green/40' : 'bg-lp-ink/10')} />}
          </React.Fragment>
        ))}
      </div>

      {props.poolStep === 'category' && (
        <div className="space-y-3">
          {POOL_CATS.map(c => {
            const I = c.Icon;
            const selected = props.poolCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => props.setPoolCat(c.id)}
                className={'w-full text-left card-editorial rounded-2xl p-4 flex items-start gap-3 press-scale transition-all ' + (selected ? 'ring-2 ring-lp-green' : '')}
              >
                <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center shrink-0">
                  <I className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-lp-ink">{c.name}</div>
                  <div className="text-xs text-lp-ink/55 mt-1">{c.desc}</div>
                </div>
                {selected && <CheckCircle className="w-5 h-5 text-lp-green shrink-0" strokeWidth={2} />}
              </button>
            );
          })}

          {props.poolCat === 'hospital_invoice' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-900 leading-relaxed">
                Only invoice number and amount. <strong>No clinical details</strong> collected.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button variant="primary" fullWidth onClick={() => props.setPoolStep('details')} disabled={!props.poolCat}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {props.poolStep === 'details' && (() => {
        const cat = POOL_CATS.find(c => c.id === props.poolCat)!;
        return (
          <div className="space-y-4">
            <div className="card-editorial rounded-2xl p-5">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-ink/40 mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                {cat.objLabel}
              </div>
              <input
                type="text"
                value={props.poolObject}
                onChange={e => { props.setPoolObject(e.target.value); props.setPoolError(null); }}
                placeholder={cat.placeholder}
                className={'w-full bg-transparent border-0 outline-none p-0 stat-display text-2xl text-lp-ink tabular-nums placeholder:text-lp-ink/20 ' + (props.objectError ? 'text-rose-600' : '')}
              />
              {props.objectError && (
                <div className="text-xs text-rose-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" />{props.objectError}
                </div>
              )}
              {!props.objectError && props.objectValid && (
                <div className="text-xs text-lp-green flex items-center gap-1 mt-2">
                  <Check className="w-3 h-3" />Valid format
                </div>
              )}
            </div>

            <div className="card-editorial rounded-2xl p-5">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-ink/40 mb-3">
                Amount
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-lp-ink/50 font-medium">KES</span>
                <input
                  type="number"
                  value={props.poolAmount}
                  onChange={e => { props.setPoolAmount(e.target.value); props.setPoolError(null); }}
                  placeholder="0"
                  className="stat-display text-4xl text-lp-ink tabular-nums bg-transparent border-0 outline-none p-0 w-full placeholder:text-lp-ink/20"
                />
              </div>
              {props.numAmount > 0 && props.numAmount > props.valueRemaining && (
                <div className="text-xs text-rose-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  Exceeds session allowance (KES {props.valueRemaining.toLocaleString()} left)
                </div>
              )}
            </div>

            {props.willEscalate && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  Over KES 5,000 requires <strong>photo verification</strong>.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => props.setPoolStep('category')}>
                Back
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={props.handleSubmitPool}
                disabled={!props.objectValid || !props.numAmount || props.pooling || props.rateLimited || props.numAmount > props.valueRemaining}
              >
                {props.pooling ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </div>
        );
      })()}

      {props.poolStep === 'photo' && (
        <div className="space-y-4">
          <div className="card-editorial rounded-2xl p-5 space-y-3">
            {!evidenceFile ? (
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  capture="environment"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) setEvidenceFile(f);
                  }}
                  className="hidden"
                />
                <div className="w-full py-8 border border-dashed border-lp-ink/15 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-lp-green hover:bg-lp-sage/20 transition-colors press-scale">
                  <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center">
                    <Camera className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
                  </div>
                  <span className="text-sm font-semibold text-lp-green">Choose photo</span>
                  <span className="text-xs text-lp-ink/50">JPEG, PNG, or PDF — max 5MB</span>
                </div>
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-lp-canvas border border-lp-ink/8">
                <FileText className="w-4 h-4 text-lp-green shrink-0" />
                <span className="text-sm text-lp-ink truncate flex-1">{evidenceFile.name}</span>
                <span className="text-xs text-lp-ink/50 shrink-0">
                  {(evidenceFile.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => setEvidenceFile(null)}
                  className="text-xs text-lp-ink/60 hover:text-rose-600 shrink-0 press-scale"
                >
                  Change
                </button>
              </div>
            )}

            {props.evidenceError && (
              <div className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {props.evidenceError}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => props.setPoolStep('details')}>
              Back
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => evidenceFile && props.handleUploadEvidence(evidenceFile)}
              disabled={!evidenceFile || props.evidenceUploading}
            >
              {props.evidenceUploading ? 'Uploading…' : 'Submit photo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
