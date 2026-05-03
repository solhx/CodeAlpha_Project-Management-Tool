// frontend/src/components/notifications/NotificationBell.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { useGetNotificationsQuery, useMarkAllReadMutation } from '@/store/api/notificationApi';
import NotificationList from './NotificationList';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data } = useGetNotificationsQuery({ page: 1, limit: 10 });
  const [markAllRead] = useMarkAllReadMutation();

  const unreadCount = data?.data?.unread || 0;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white 
                           text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-xl 
                        border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          <NotificationList onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
