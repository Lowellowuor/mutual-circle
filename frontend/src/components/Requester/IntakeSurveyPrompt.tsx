import React from 'react';
import { ClipboardList, ChevronRight, X } from 'lucide-react';

interface Props {
  onOpen: () => void;
  onDismiss: () => void;
}

export const IntakeSurveyPrompt: React.FC<Props> = ({ onOpen, onDismiss }) => (
  <div className="mb-6 rounded-2xl border border-lp-green/20 bg-lp-sage/30 px-4 py-3 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={onOpen}>
      <div className="w-8 h-8 rounded-full bg-lp-green/10 flex items-center justify-center shrink-0">
        <ClipboardList className="w-4 h-4 text-lp-green" />
      </div>
      <div>
        <div className="text-sm font-semibold text-lp-ink">Help us size your basket</div>
        <div className="text-xs text-lp-ink/60">Answer 4 quick questions to speed up your requests.</div>
      </div>
      <ChevronRight className="w-4 h-4 text-lp-ink/40 ml-auto mr-2" />
    </div>
    <button onClick={onDismiss} className="p-2 text-lp-ink/40 hover:text-lp-ink">
      <X className="w-4 h-4" />
    </button>
  </div>
);
