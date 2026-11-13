import React from 'react';
import { Users, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ScreenHeader } from '../../ui';

interface HouseholdSetupProps {
  householdMode: 'alone' | 'family' | null;
  setHouseholdMode: (mode: 'alone' | 'family' | null) => void;
  householdSize: number;
  setHouseholdSize: (size: number) => void;
  householdError: string | null;
  handleHouseholdComplete: (size: number) => Promise<void>;
}

export const HouseholdSetup: React.FC<HouseholdSetupProps> = (props) => {
  return (
    <div className="relative pb-20 content-in px-4 pt-6">
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-md mx-auto">
        <ScreenHeader
          number="01"
          eyebrow="Setup"
          title="Who is this for?"
          subtitle="Sizes your bundle correctly. You can change this later."
        />

        {props.householdMode === null && (
          <div className="space-y-3">
            <button
              onClick={() => props.handleHouseholdComplete(1)}
              className="w-full card-editorial rounded-2xl p-4 flex items-center gap-3 press-scale text-left"
            >
              <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-lp-ink">Just me</div>
                <div className="text-xs text-lp-ink/55 mt-1">Standard bundle for one person</div>
              </div>
            </button>

            <button
              onClick={() => { props.setHouseholdMode('family'); props.setHouseholdSize(2); }}
              className="w-full card-editorial rounded-2xl p-4 flex items-center gap-3 press-scale text-left"
            >
              <div className="w-10 h-10 rounded-full bg-lp-sage flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-lp-green" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-lp-ink">My household</div>
                <div className="text-xs text-lp-ink/55 mt-1">Bundles sized for 2 or more people</div>
              </div>
            </button>
          </div>
        )}

        {props.householdMode === 'family' && (
          <div className="space-y-4">
            <div className="eyebrow">How many people, including you?</div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => props.setHouseholdSize(n)}
                  className={
                    'py-4 rounded-2xl text-center text-base font-semibold press-scale transition-all ' +
                    (props.householdSize === n
                      ? 'bg-lp-green text-white'
                      : 'card-editorial text-lp-ink')
                  }
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={() => props.setHouseholdSize(10)}
              className={
                'w-full py-4 rounded-2xl text-sm font-semibold press-scale transition-all ' +
                (props.householdSize >= 10
                  ? 'bg-lp-green text-white'
                  : 'card-editorial text-lp-ink')
              }
            >
              10 or more
            </button>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => { props.setHouseholdMode(null); }}>
                Back
              </Button>
              <Button variant="primary" fullWidth onClick={() => props.handleHouseholdComplete(props.householdSize)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {props.householdError && (
          <div className="text-xs text-rose-600 flex items-center gap-1 justify-center mt-3">
            <AlertCircle className="w-3 h-3" />
            {props.householdError}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-lp-ink/8">
          
          <div>
            {[
              { range: '1 person', size: 'Small' },
              { range: '2–3 people', size: 'Standard' },
              { range: '4–6 people', size: 'Large' },
              { range: '7+ people', size: 'Family' },
            ].map(row => (
              <div key={row.range} className="flex justify-between items-baseline py-3 border-b border-lp-ink/8 last:border-0">
                <span className="text-sm text-lp-ink/55">{row.range}</span>
                <span className="text-sm font-semibold text-lp-ink">{row.size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
