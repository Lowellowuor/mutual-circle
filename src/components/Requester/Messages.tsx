import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getNotifications, markAllNotificationsRead } from '../../lib/apiClient';
import { MessageSquare, Shield, Check, Clock, RotateCcw, Bell } from 'lucide-react';

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

const TEMPLATE_ICONS: Record<string, string> = {
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

        // Auto-mark all unread as read — user opened Messages tab
        const hasUnread = list.some((n: Notification) => !n.read_at);
        if (hasUnread) {
          const now = new Date().toISOString();
          setNotifications(list.map((n: Notification) =>
            n.read_at ? n : { ...n, read_at: now }
          ));
          markAllNotificationsRead(tokenHash).catch(() => {});
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

  // Not authenticated
  if (!tokenHash) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white border border-[#111111]/15 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-[#DCE8E0] text-[#1F6B4A] rounded-2xl flex items-center justify-center mx-auto">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-[#111111]">Messages</h1>
          <p className="text-xs text-[#111111]/60 mt-1">Sign in on the Mutual Circle tab first.</p>
        </div>
        <p className="text-[11px] text-[#111111]/50 leading-relaxed">
          Once signed in, your request updates — verified, dispatched, collected — appear here. In production these arrive as SMS on the same shortcode you came in on.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl font-bold text-[#111111]">Your Messages</h1>
          <p className="text-[11px] text-[#111111]/60 mt-0.5">Request outcomes, confirmed by SMS in production.</p>
        </div>
        <button
          onClick={refresh}
          className="text-[10px] text-[#1F6B4A] hover:underline flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl flex items-start gap-2">
        <Shield className="w-3 h-3 text-[#1F6B4A] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#111111]/70 leading-relaxed">
          Messages are tied to your anonymous token. They never include names, addresses, or clinical details — same rules as the rest of the platform.
        </p>
      </div>

      {loading ? (
        <div className="p-5 bg-white border border-[#111111]/15 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-[#111111]/50">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-5 bg-white border border-[#111111]/15 rounded-xl text-center space-y-2">
          <MessageSquare className="w-6 h-6 text-[#111111]/20 mx-auto" />
          <div className="text-xs font-bold text-[#111111]">No messages yet</div>
          <p className="text-[11px] text-[#111111]/50">
            Make a request on the Mutual Circle tab. Updates will appear here immediately after submission.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className="p-3 bg-white border border-[#111111]/15 rounded-xl space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-7 h-7 rounded-lg bg-[#DCE8E0] text-[#1F6B4A] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                    {!n.read_at && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase text-[#1F6B4A] tracking-wider">
                      {TEMPLATE_ICONS[n.template] || n.template}
                    </div>
                    <div className="text-[10px] text-[#111111]/40 font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-[#111111]/50 shrink-0">
                  <Clock className="w-3 h-3" />
                  {relativeTime(n.created_at)}
                </div>
              </div>
              <p className="text-xs text-[#111111] leading-relaxed">{n.content}</p>
              {n.request_id && (
                <div className="text-[9px] font-mono text-[#111111]/40 pt-1 border-t border-[#111111]/5">
                  Request: {n.request_id.slice(0, 8)}…
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
