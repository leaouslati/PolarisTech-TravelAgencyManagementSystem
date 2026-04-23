import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const NotificationBell = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data?.data || res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

const markOne = async (notification_id) => {
  try {
    await api.patch(`/notifications/${notification_id}/read`);
    setNotifications(prev =>
      prev.map(n =>
        n.notification_id === notification_id ? { ...n, is_read: true } : n
      )
    );
  } catch {}
};

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-slate-600 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden"
          style={{ width: '340px' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
          {loading ? (
  <div className="px-4 py-6 text-sm text-slate-400">Loading...</div>
) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.notification_id}
                  onClick={() => !n.is_read && markOne(n.notification_id)}
                  className={`p-3 border-b cursor-pointer flex items-center gap-3 transition-colors ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 transition-colors ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;