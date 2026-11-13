import { ScreenHeader } from '../../ui';
import React from 'react';
import { Trophy, Edit2 } from 'lucide-react';
import { EmptyState } from '../Shared/EmptyState';

interface LeaderEntry {
  display_name: string;
  gift_count: number;
  total_pence: number;
}

interface MyProfile {
  display_name: string;
  opt_in_ledger: boolean;
}

interface DonorLeadersProps {
  leaderboard: LeaderEntry[];
  myProfile: MyProfile | null;
  editingProfile: boolean;
  setEditingProfile: (v: boolean) => void;
  profileName: string;
  setProfileName: (v: string) => void;
  profileOptIn: boolean;
  setProfileOptIn: (v: boolean) => void;
  profileSaving: boolean;
  saveProfile: () => void;
}

export const DonorLeaders: React.FC<DonorLeadersProps> = (props) => {
  return (
    <div className="space-y-6 pb-4">
      <ScreenHeader number="04" eyebrow="Community" title="Leaders" subtitle="Opt-in recognition. Aggregate totals only." />
      
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                You are not in the public leaderboard. Your contributions are still counted and pooled.
              </p>
              <button className="btn btn-primary w-full mb-3"> props.setEditingProfile(true)}>
                Join the leaderboard
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                Display name (optional)
              </label>
              <input
                type="text"
                value={props.profileName}
                onChange={(e) => props.setProfileName(e.target.value.slice(0, 60))}
                placeholder="e.g. Nairobi Tech Workers"
                className="w-full bg-surface border border-tile rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-pine outline-none"
              />
              <p className="text-xs text-muted">Leave blank to appear as "Anonymous Contributor".</p>
            </div>
            <label className="flex items-start gap-3 p-3 bg-canvas border border-tile rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={props.profileOptIn}
                onChange={(e) => props.setProfileOptIn(e.target.checked)}
                className="mt-0.5 accent-pine w-4 h-4"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink">Show me on the public leaderboard</div>
                <div className="text-xs text-muted mt-0.5">
                  Only your total given and gift count are shown. Never a recipient link.
                </div>
              </div>
            </label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  props.setEditingProfile(false);
                  props.setProfileName(props.myProfile?.display_name || '');
                  props.setProfileOptIn(props.myProfile?.opt_in_ledger || false);
                }}
              >
                Cancel
              </button>
              <Button
                variant="primary"
                fullWidth
                onClick={props.saveProfile}
                disabled={props.profileSaving}
              >
                {props.profileSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card-editorial p-5 md:p-6 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Top contributors</h3>
          <span className="text-xs font-semibold bg-lime text-pine px-2 py-0.5 rounded">Opt-in</span>
        </div>
        {props.leaderboard.length === 0 ? (
          <EmptyState Icon={Trophy} title="No opt-in donors yet" body="Be the first to appear here." compact />
        ) : (
          <div className="space-y-1">
            {props.leaderboard.map((entry, idx) => (
              <div
                key={`${entry.display_name}-${idx}`}
                className="flex items-center gap-3 py-2 border-b border-tile last:border-0"
              >
                <div className="w-6 text-center text-xs font-bold text-muted">#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">{entry.display_name}</div>
                  <div className="text-xs text-muted">
                    {entry.gift_count} gift{entry.gift_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-sm font-bold text-pine shrink-0">
                  KES {(entry.total_pence / 100).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-editorial p-5 md:p-6 mb-4">
        <h3 className="text-sm font-bold text-rose-900">What the leaderboard does NOT show</h3>
        <ul className="text-sm text-rose-900/80 leading-relaxed space-y-1">
          <li>· Which specific bills or recipients your money funded</li>
          <li>· Per-contribution timestamps or categories</li>
          <li>· Any identification of who received the resources</li>
        </ul>
        <p className="text-xs text-rose-900/60 pt-2 border-t border-rose-200">
          Aggregate totals only. Recipient dignity comes first.
        </p>
      </div>
    </div>
  );
};