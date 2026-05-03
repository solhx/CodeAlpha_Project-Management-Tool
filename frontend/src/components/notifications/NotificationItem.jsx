// frontend/src/components/notifications/NotificationItem.jsx
'use client';
import { useMarkReadMutation } from '@/store/api/notificationApi';
import { useRouter } from 'next/navigation';

const NOTIF_ICONS = {
  task_assigned:    '📌',
  task_updated:     '✏️',
  task_completed:   '✅',
  comment_added:    '💬',
  comment_mention:  '🔔',
  project_invite:   '🤝',
  due_date_reminder:'⏰',
  member_joined:    '👤',
};

export default function NotificationItem({ notification, onClose }) {
  const [markRead] = useMarkReadMutation();
  const router = useRouter();

  const handleClick = async () => {
    if (!notification.isRead) await markRead(notification._id);
    if (notification.link) {
      router.push(notification.link);
      onClose?.();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50
        ${!notification.isRead ? 'bg-indigo-50/50' : ''}
      `}
    >
      <div className="text-xl flex-shrink-0 mt-0.5">
        {NOTIF_ICONS[notification.type] || '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-slate-700 line-clamp-2 ${!notification.isRead ? 'font-medium' : ''}`}>
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}