import { useEffect, useRef, useState } from "react";
import client from "../api/client";

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const { data } = await client.get("/notifications/me");
      setNotifications(data.notifications);
    } catch {
      // silently ignore — bell just won't update
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    await client.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-lavender-50 transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-700">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-lavender-600 rounded-full animate-popIn" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 card p-0 overflow-hidden animate-popIn z-50">
          <div className="px-4 py-3 border-b border-lavender-100 font-semibold text-sm">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-ink-500">You're all caught up.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => markRead(n._id)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-lavender-50 last:border-0 hover:bg-lavender-50 transition-colors ${
                  n.read ? "text-ink-500" : "text-ink-900 font-medium bg-lavender-50/50"
                }`}
              >
                {n.message}
                <div className="text-xs text-ink-500 font-normal mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
