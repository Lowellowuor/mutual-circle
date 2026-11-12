import React from 'react';
import { ShieldCheck, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';

interface RequesterIntakeProps {
  intakeStep: 'phone' | 'otp';
  phone: string;
  setPhone: (v: string) => void;
  phoneError: string | null;
  otpInput: string;
  setOtpInput: (v: string) => void;
  otpError: string | null;
  otpProcessing: boolean;
  resendCooldown: number;
  generatedOtp: string;
  handleSendOtp: (e: React.FormEvent) => void;
  handleVerifyOtp: (e: React.FormEvent) => void;
  handleResend: () => void;
  handleBackToPhone: () => void;
}

export const RequesterIntake: React.FC<RequesterIntakeProps> = (props) => {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center w-full content-in px-4">
      <div
        className="absolute -top-16 -right-24 w-[320px] h-[320px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.65) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-lp-sage flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-6 h-6 text-lp-green" strokeWidth={1.75} />
          </div>
          <span className="eyebrow">{props.intakeStep === 'phone' ? '01 — Sign in' : '02 — Verify'}</span>
          <h1 className="display-serif mt-3 text-4xl text-lp-ink leading-tight">
            {props.intakeStep === 'phone' ? 'Get your token.' : 'Enter the code.'}
          </h1>
          <p className="mt-3 text-sm text-lp-ink/55 leading-relaxed max-w-xs mx-auto">
            {props.intakeStep === 'phone'
              ? 'Your phone number becomes an anonymous token. No name, no address.'
              : 'We sent a 4-digit code to ' + props.phone + '.'}
          </p>
        </div>

        {props.intakeStep === 'phone' ? (
          <form onSubmit={props.handleSendOtp} className="space-y-4">
            <div className="card-editorial rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-lp-sage flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
                </div>
                <input
                  type="tel"
                  value={props.phone}
                  onChange={e => props.setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="flex-1 bg-transparent border-0 outline-none p-0 stat-display text-2xl text-lp-ink placeholder:text-lp-ink/20 tabular-nums"
                  autoFocus
                />
              </div>
            </div>

            {props.phoneError && (
              <p className="text-sm text-rose-600 text-center">{props.phoneError}</p>
            )}

            <Button type="submit" variant="primary" fullWidth className="!h-12">
              Continue
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        ) : (
          <form onSubmit={props.handleVerifyOtp} className="space-y-4">
            <div className="card-editorial rounded-2xl p-5 text-center">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={props.otpInput}
                onChange={e => props.setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full bg-transparent border-0 outline-none p-0 stat-display text-5xl text-lp-ink placeholder:text-lp-ink/15 tracking-[0.4em] tabular-nums text-center"
                autoFocus
              />
            </div>

            {props.otpError && (
              <p className="text-sm text-rose-600 text-center">{props.otpError}</p>
            )}

            {import.meta.env.DEV && (
              <p className="text-center text-xs text-lp-ink/50">
                Dev — OTP:{' '}
                <span className="font-mono font-semibold text-lp-green text-base tracking-widest">{props.generatedOtp}</span>
              </p>
            )}

            <Button type="submit" variant="primary" fullWidth className="!h-12" disabled={props.otpInput.length < 4 || props.otpProcessing}>
              {props.otpProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={props.handleBackToPhone}
                className="text-lp-ink/50 hover:text-lp-ink font-medium transition-colors press-scale"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={props.handleResend}
                disabled={props.resendCooldown > 0}
                className="text-lp-green font-semibold hover:underline disabled:opacity-40 press-scale"
              >
                {props.resendCooldown > 0 ? `Resend in ${props.resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-lp-ink/40 leading-relaxed px-4">
          Your phone number is hashed into a secure token and immediately discarded. We never store your raw number, name, or location.
        </p>
      </div>
    </div>
  );
};
