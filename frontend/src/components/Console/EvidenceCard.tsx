import React from 'react';
import { fetchEvidencePhoto, approveEvidence, rejectEvidence } from '../../lib/apiClient';

const EvidenceCard: React.FC<{
  item: any;
  sessionToken: string;
  onApproved: () => void;
  onRejected: () => void;
  push: (toast: any) => void;
}> = ({ item, sessionToken, onApproved, onRejected, push }) => {
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photoError, setPhotoError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [showReject, setShowReject] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');

  React.useEffect(() => {
    let objUrl: string | null = null;
    let cancelled = false;
    fetchEvidencePhoto(sessionToken, item.id).then(url => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      if (url) {
        objUrl = url;
        setPhotoUrl(url);
      } else {
        setPhotoError(true);
      }
    });
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [item.id, sessionToken]);

  const handleApprove = async () => {
    setBusy(true);
    const r = await approveEvidence(sessionToken, item.id);
    setBusy(false);
    if (r) {
      push({ kind: 'success', message: `Approved ${item.id.slice(0, 8)}` });
      onApproved();
    } else {
      push({ kind: 'error', message: 'Approve failed' });
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 3) {
      push({ kind: 'error', message: 'Reason required (min 3 chars)' });
      return;
    }
    setBusy(true);
    const r = await rejectEvidence(sessionToken, item.id, rejectReason.trim());
    setBusy(false);
    if (r) {
      push({ kind: 'success', message: 'Rejected' });
      setShowReject(false);
      setRejectReason('');
      onRejected();
    } else {
      push({ kind: 'error', message: 'Reject failed' });
    }
  };

  const isImage = photoUrl && !photoError;

  return (
    <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-ink/50">{item.id.slice(0, 12)}</span>
        <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">
          T2 · PHOTO
        </span>
      </div>

      <div>
        <div className="font-bold text-[12px] text-ink uppercase">
          {item.category.replace('_', ' ')}
        </div>
        <div className="text-[11px] font-mono text-pine">{item.hashed_object_id}</div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-ink">
          <span className="text-[9px] text-ink/50 mr-0.5">KES</span>
          <span className="text-sm tabular-nums">
            {(item.amount_pence / 100).toLocaleString()}
          </span>
        </span>
        <span className="text-[10px] font-mono text-ink/50">
          {item.evidence_submitted_at
            ? new Date(item.evidence_submitted_at).toLocaleString()
            : '—'}
        </span>
      </div>

      <div className="rounded-lg overflow-hidden border border-tile bg-canvas">
        {isImage ? (
          <img
            src={photoUrl!}
            alt="Evidence"
            className="w-full max-h-64 object-contain"
          />
        ) : photoError ? (
          <div className="p-4 text-center text-[11px] text-rose-600">
            Could not load photo
          </div>
        ) : (
          <div className="p-4 text-center text-[11px] text-ink/50">Loading photo…</div>
        )}
      </div>

      {!showReject ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowReject(true)}
            disabled={busy}
            className="py-2 bg-white border border-rose-300 text-rose-700 rounded-lg text-[11px] font-semibold disabled:opacity-40"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={busy}
            className="py-2 bg-pine hover:bg-pine-deep text-white rounded-lg text-[11px] font-semibold disabled:opacity-40"
          >
            {busy ? 'Approving…' : 'Approve'}
          </button>
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-tile">
          <label className="text-[10px] font-mono uppercase text-ink/50">
            Rejection reason
          </label>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Photo is blurry — cannot read meter number"
            className="w-full bg-canvas border border-tile rounded-lg p-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-pine"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setShowReject(false);
                setRejectReason('');
              }}
              className="py-1.5 bg-white border border-tile rounded-lg text-[11px]"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={busy || rejectReason.trim().length < 3}
              className="py-1.5 bg-rose-600 text-white rounded-lg text-[11px] font-semibold disabled:opacity-40"
            >
              {busy ? 'Rejecting…' : 'Confirm reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceCard;
