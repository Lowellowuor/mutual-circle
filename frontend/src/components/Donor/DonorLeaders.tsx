import React from 'react';
import { ScreenHeader } from '../../ui';

interface DonorLeadersProps {
  myProfile: any;
  editingProfile: boolean;
  setEditingProfile: (v: boolean) => void;
  profileName: string;
  setProfileName: (v: string) => void;
  profileSaving: boolean;
  saveProfile: () => Promise<void> | void;
  cancelEdit: () => void;
  leaderboard: { display_name: string; total_pence: number; gift_count: number; }[];
  profileOptIn?: boolean;
  setProfileOptIn?: (v: boolean) => void;
}

export const DonorLeaders: React.FC<DonorLeadersProps> = (props) => {
  return (
    <div className="relative pb-20 content-in">
      <ScreenHeader number="04" eyebrow="Community" title="Leaders" subtitle="Opt-in recognition. Aggregate totals only." />

      <div className="card-editorial p-5 md:p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-[#111111]/50">Your standing</span>
          {!props.editingProfile && (
            <button
              onClick={() => props.setEditingProfile(true)}
              className="text-xs font-semibold text-[#1F6B4A] hover:text-[#18553a] transition-colors press-scale"
            >
              Edit
            </button>
          )}
        </div>

        {!props.editingProfile ? (
          props.myProfile?.opt_in_ledger ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#111111]/50">Display name</span>
                <span className="font-semibold text-[#111111]">
                  {props.myProfile.display_name || 'Anonymous Contributor'}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E8E6DE] pt-2">
                <span className="text-[#111111]/50">Listed publicly</span>
                <span className="font-semibold text-[#1F6B4A]">Yes</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="type-body-m text-[#111111]/70">
                You are not in the public leaderboard. Your contributions are still counted and pooled.
              </p>
              <button className="btn btn-primary w-full" onClick={() => props.setEditingProfile(true)}>
                Join the leaderboard
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block section-label mb-2">Display name (optional)</label>
              <input
                type="text"
                value={props.profileName}
                onChange={(e) => props.setProfileName(e.target.value.slice(0, 60))}
                placeholder="e.g. Nairobi Tech Workers"
                className="w-full h-12 px-4 rounded-xl bg-white border border-[#E8E6DE] text-sm text-[#111111] focus:outline-none focus:border-[#1F6B4A] focus:ring-2 focus:ring-[#1F6B4A]/20 transition-all"
              />
            </div>
            
            <label className="flex items-center gap-3 p-3 bg-white border border-[#E8E6DE] rounded-xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={props.profileOptIn ?? true} 
                onChange={(e) => props.setProfileOptIn?.(e.target.checked)} 
                className="mt-1" 
              />
              <div className="text-xs text-[#111111]/70">
                Include my name in the public recognition ledger.
              </div>
            </label>

            <div className="flex gap-2 pt-2">
              <button className="btn btn-secondary w-1/2" onClick={props.cancelEdit} disabled={props.profileSaving}>
                Cancel
              </button>
              <button className="btn btn-primary w-1/2" onClick={props.saveProfile} disabled={props.profileSaving}>
                {props.profileSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="eyebrow text-[#111111]/40 mb-4">Top Donors</h3>
        <div className="surface-solid r-card divide-y divide-[#E8E6DE]">
          {props.leaderboard.map((entry: any, i: number) => (
             <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#111111]/40 w-4">{i + 1}.</span>
                  <span className="text-sm font-medium text-[#111111]">{entry.display_name}</span>
                </div>
                <span className="text-sm font-semibold text-[#1F6B4A] tabular-nums">KES {(entry.total_pence / 100).toLocaleString()}</span>
             </div>
          ))}
          {props.leaderboard.length === 0 && (
             <div className="p-6 text-center text-sm text-[#111111]/50">No entries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
