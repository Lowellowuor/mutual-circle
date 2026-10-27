import React from 'react';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number; // 1-indexed
  className?: string;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  totalSteps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 justify-center ${className}`} aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div
            key={idx}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isActive 
                ? 'w-7 bg-[#1F6B4A]' 
                : isDone 
                ? 'w-2.5 bg-[#1F6B4A]/60' 
                : 'w-2.5 bg-black/15'
            }`}
          />
        );
      })}
    </div>
  );
};

export interface StatusStepperProps {
  status: 'submitted' | 'verified' | 'fulfilled' | 'review';
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ status }) => {
  // Hard rule: Stepper labels must be strictly: Submitted, Verified, Fulfilled.
  const steps = [
    { id: 'submitted', label: 'Submitted', icon: Clock },
    { id: 'verified', label: 'Verified', icon: ShieldCheck },
    { id: 'fulfilled', label: 'Fulfilled', icon: CheckCircle2 }
  ];

  const getStepIndex = () => {
    if (status === 'fulfilled') return 3;
    if (status === 'verified') return 2;
    return 1;
  };

  const currentIndex = getStepIndex();

  return (
    <div className="flex items-center justify-between w-full py-2">
      {steps.map((step, idx) => {
        const stepIndex = idx + 1;
        const isCompleted = stepIndex <= currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const IconComponent = step.icon;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-250 ${
                  isCompleted 
                    ? 'bg-[#1F6B4A] text-white' 
                    : 'bg-[#DCE8E0]/70 text-[#1F6B4A]/60'
                }`}
              >
                <IconComponent className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <span className={`text-sm font-medium ${isCurrent ? 'text-[#1F6B4A] font-semibold' : 'text-[#111111]/70'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div 
                className={`h-1 flex-1 mx-1.5 rounded-full transition-colors duration-250 ${
                  stepIndex < currentIndex ? 'bg-[#1F6B4A]' : 'bg-black/15'
                }`} 
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
