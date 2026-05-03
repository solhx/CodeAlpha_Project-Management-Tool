// frontend/src/components/notifications/NotificationList.jsx
'use client';
import { useGetNotificationsQuery, useMarkReadMutation } from '@/store/api/notificationApi';
import NotificationItem from './NotificationItem';
import Spinner from '../ui/Spinner';
import Link from 'next/link';

export default function NotificationList({ onClose }) {
  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 10 });
  const notifications = data?.data?.notifications || [];

  if (isLoading) return <div className="flex justify-center p-6"><Spinner /></div>;

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-3xl mb-2">🔔</p>
        <p className="text-slate-400 text-sm">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifications.map((n) => (
          <NotificationItem key={n._id} notification={n} onClose={onClose} />
        ))}
      </div>
      <div className="px-5 py-3 border-t border-slate-100 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
}
