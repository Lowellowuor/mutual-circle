import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getNotifications, markAllNotificationsRead } from '../../lib/apiClient';
import { MessageSquare, Shield, Check, Clock, RotateCcw, Bell } from 'lucide-react';
import { ScreenHeader } from '../../ui';

interface Notification {
  id: string;
  request_id: string | null;
  template: string;
  content: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
}

const TEMPLATE_LABELS: Record<string, string> = {
  swap_submitted: 'Package reserved',
  pool_submitted: 'Request received',
  pool_pending: 'Verification pending',
  verified: 'Verified',
  dispatched: 'Payment sent',
  withdrawn: 'Withdrawn',
  collected: 'Collected',
};

function relativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    if (isNaN(then)) return 'recently';
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    return Math.floor(days / 30) + 'mo ago';
  } catch {
    return 'recently';
  }
}

export const RequesterMessages: React.FC = () => {
  const { tokenHash } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenHash) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const r = await getNotifications(tokenHash);
      if (!cancelled) {
        const list = r?.notifications || [];
        setNotifications(list);
        setLoading(false);

        const hasUnread = list.some((n: Notification) => !n.read_at);
        if (hasUnread) {
          const now = new Date().toISOString();
          setNotifications(list.map((n: Notification) =>
            n.read_at ? n : { ...n, read_at: now }
          ));
          markAllNotificationsRead(tokenHash).catch((e) => { console.error('[messages] mark-all-read failed', e); });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [tokenHash]);

  const refresh = async () => {
    if (!tokenHash) return;
    setLoading(true);
    const r = await getNotifications(tokenHash);
    setNotifications(r?.notifications || []);
    setLoading(false);
  };

  if (!tokenHash) {
    return (
      <div className="relative pb-20 content-in">
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-lp-sage flex items-center justify-center mx-auto mb-5">
            <Bell className="w-6 h-6 text-lp-green" strokeWidth={1.75} />
          </div>
          <p className="display-serif text-3xl text-lp-ink">Sign in first.</p>
          <p className="mt-3 text-sm text-lp-ink/55 leading-relaxed">
            Messages appear here once you're signed in on the Mutual Circle tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-20 content-in">
      <div
        className="absolute -top-16 -right-24 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none orb-drift"
        style={{ background: 'radial-gradient(circle, rgba(220,232,224,0.6) 0%, rgba(220,232,224,0) 70%)' }}
        aria-hidden="true"
      />

      <ScreenHeader
        number="06"
        eyebrow="Messages"
        title="Your updates."
        subtitle="Every request outcome, delivered here and by SMS in production."
        action={
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1 text-xs font-semibold text-lp-green hover:underline press-scale"
          >
            <RotateCcw className="w-3 h-3" /> Refresh
          </button>
        }
      />

      <div className="mb-8 rounded-2xl border border-lp-green/20 bg-lp-sage/30 px-4 py-3 flex items-start gap-3">
        <Shield className="w-4 h-4 text-lp-green shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-xs text-lp-ink/65 leading-relaxed">
          Messages are tied to your anonymous token. No names, addresses, or clinical details.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-lp-green animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-lp-green animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-lp-green animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center">
          <p className="display-serif text-3xl text-lp-ink">No messages yet.</p>
          <p className="mt-3 text-sm text-lp-ink/55 max-w-xs mx-auto leading-relaxed">
            Make a request on the Mutual Circle tab. Updates appear here right after.
          </p>
        </div>
      ) : (
        <div>
          {notifications.map((n, i) => {
            const unread = !n.read_at;
            return (
              <div key={n.id} className="py-5 border-b border-lp-ink/8 last:border-0">
                <div className="flex gap-4">
                  <span className="stat-display text-xl text-lp-green/40 tabular-nums shrink-0 w-8">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-lp-green">
                          {TEMPLATE_LABELS[n.template] || n.template}
                        </span>
                        {unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" aria-label="Unread" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-lp-ink/40 shrink-0">
                        <Clock className="w-3 h-3" />
                        {relativeTime(n.created_at)}
                      </div>
                    </div>
                    <p className="text-sm text-lp-ink leading-relaxed mt-2">{n.content}</p>
                    {n.request_id && (
                      <div className="text-[10px] font-mono text-lp-ink/40 mt-2">
                        Request · {n.request_id.slice(0, 8)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
