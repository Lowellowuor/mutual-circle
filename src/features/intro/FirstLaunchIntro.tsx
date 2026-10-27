import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../ui/Button';
import { ShieldCheck, KeyRound, Smartphone, ArrowRight } from 'lucide-react';

export interface FirstLaunchIntroProps {
  onComplete: () => void;
}

export const FirstLaunchIntro: React.FC<FirstLaunchIntroProps> = ({ onComplete }) => {
  const { t } = useApp();
  const [step, setStep] = useState<number>(1);

  const cards = [
    {
      id: 1,
      icon: <ShieldCheck className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />,
      title: t('intro_card1_title'),
      body: t('intro_card1_body')
    },
    {
      id: 2,
      icon: <KeyRound className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />,
      title: t('intro_card2_title'),
      body: t('intro_card2_body')
    },
    {
      id: 3,
      icon: <Smartphone className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />,
      title: t('intro_card3_title'),
      body: t('intro_card3_body')
    }
  ];

  const current = cards[step - 1];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F4] flex flex-col justify-between p-5 max-w-md mx-auto select-none animate-in fade-in duration-200">
      
      {/* Top Segmented Progress Bar & Skip */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center gap-1.5 w-full">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                i <= step ? 'bg-[#1F6B4A]' : 'bg-black/15'
              }`} 
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1F6B4A]">The Mutual Circle</span>
          <button
            onClick={onComplete}
            className="min-h-[44px] min-w-[44px] px-2 text-sm text-[#111111]/70 hover:text-[#111111] font-medium flex items-center justify-end cursor-pointer"
          >
            {t('btn_skip')}
          </button>
        </div>
      </div>

      {/* Story Card Tap Surface: Left half goes back, Right half advances */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center my-4 py-8">
        
        {/* Left tap area */}
        <div 
          onClick={handlePrev}
          className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer"
          aria-label="Previous story card"
        />
        {/* Right tap area */}
        <div 
          onClick={handleNext}
          className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer"
          aria-label="Next story card"
        />

        <div className="w-16 h-16 rounded-full bg-[#DCE8E0] flex items-center justify-center mb-6 shadow-xs">
          {current.icon}
        </div>

        <h2 className="font-serif text-[28px] font-bold text-[#111111] leading-tight mb-3">
          {current.title}
        </h2>

        <p className="text-[16px] text-[#111111]/75 leading-relaxed max-w-xs mx-auto">
          {current.body}
        </p>
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="pb-4">
        <Button
          fullWidth
          size="sticky"
          onClick={handleNext}
          icon={<ArrowRight className="w-5 h-5" strokeWidth={1.75} />}
          iconPosition="right"
        >
          {step === 3 ? t('btn_start') : t('btn_next')}
        </Button>
      </div>

    </div>
  );
};
