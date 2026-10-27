import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PhoneVerification: React.FC = () => {
  const { 
    phoneNumber, 
    setPhoneNumber, 
    setIsPhoneVerified, 
    setRequesterScreen 
  } = useApp();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState<string>('4928');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 400);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsPhoneVerified(true);
      setRequesterScreen('home');
    }, 400);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <button
          onClick={() => setRequesterScreen('channel')}
          className="text-xs text-[#111111]/60 hover:text-[#111111] mb-2 inline-flex items-center gap-1 cursor-pointer"
        >
          â† Back to Channels
        </button>
        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          {step === 'phone' ? 'Phone Verification' : 'Enter One-Time Code'}
        </h2>
        <p className="text-xs sm:text-sm text-[#111111]/70 mt-1">
          {step === 'phone' 
            ? 'We use your phone number exclusively to generate a private, one-way cryptographic token.' 
            : 'A simulated 4-digit code was sent to your phone.'}
        </p>
      </div>

      {/* Step 1: Phone input */}
      {step === 'phone' ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
              Kenyan Mobile Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                required
                className="w-full bg-white border border-[#111111]/20 rounded-xl px-4 py-3 text-sm font-mono text-[#111111] focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              {['+254 7XX XXX XXX', '+254 7XX XXX XXX', '+254 7XX XXX XXX'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPhoneNumber(num)}
                  className="text-[11px] font-mono text-[#1F6B4A] bg-[#DCE8E0]/60 hover:bg-[#DCE8E0] px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  Preset {num.slice(-3)}
                </button>
              ))}
            </div>
          </div>

          {/* Critical Explanatory Note on One-Way Token */}
          <div className="p-4 rounded-xl bg-white border border-[#111111]/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6B4A]">
              <Lock className="w-4 h-4" />
              <span>How your privacy is protected</span>
            </div>
            <p className="text-xs text-[#111111]/75 leading-relaxed">
              A private token is created via one-way cryptographic hashing. This token is <strong>never shown to anyone</strong>â€”including staff, operators, and donors. It is used strictly by the automated rate-limiting engine to ensure fair community rotation.
            </p>
            <p className="text-[11px] text-[#111111]/60 leading-relaxed border-t border-[#111111]/10 pt-2">
              <strong>Telecom note:</strong> While our platform isolates your identity from people in the resource distribution chain, M-Pesa mobile wallets in Kenya are legally tied to verified SIM cards by telecoms under Kenya SIM registration regulations and the POCAMLA anti-money-laundering framework.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Creating Private Token...' : 'Send Verification Code'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        /* Step 2: OTP code */
        <form onSubmit={handleOtpVerify} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
              Verification Code (Simulated)
            </label>
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className="w-12 h-14 rounded-xl bg-white border-2 border-[#1F6B4A] flex items-center justify-center font-mono text-xl font-bold text-[#111111] shadow-sm"
                >
                  {otpCode[idx] || 'â€¢'}
                </div>
              ))}
            </div>
            <div className="text-center pt-2">
              <span className="text-xs text-[#111111]/60">
                Code sent to <span className="font-mono text-[#111111]">{phoneNumber}</span>
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#DCE8E0]/40 border border-[#1F6B4A]/20 flex items-center gap-2.5 text-xs text-[#1F6B4A]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>One-way token established. No name or personal record created.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1F6B4A] hover:bg-[#18553a] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Verifying...' : 'Access Resource Network'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full text-center text-xs text-[#111111]/60 hover:text-[#111111] underline cursor-pointer"
          >
            Change phone number
          </button>
        </form>
      )}

    </div>
  );
};

