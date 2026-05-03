// frontend/src/app/(dashboard)/notifications/page.jsx
'use client';
import { useState }                      from 'react';
import { useRouter }                     from 'next/navigation';
import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
}                                        from '@/store/api/notificationApi';
import Spinner                           from '@/components/ui/Spinner';
import { NotificationSkeleton }          from '@/components/ui/Skeleton';

const NOTIF_CONFIG = {
  task_assigned:     { icon: '📌', bg: 'bg-indigo-50',  label: 'Task Assigned'     },
  task_updated:      { icon: '✏️',  bg: 'bg-blue-50',    label: 'Task Updated'      },
  task_completed:    { icon: '✅',  bg: 'bg-green-50',   label: 'Task Completed'    },
  comment_added:     { icon: '💬',  bg: 'bg-purple-50',  label: 'New Comment'       },
  comment_mention:   { icon: '@',   bg: 'bg-pink-50',    label: 'You were Mentioned'},
  project_invite:    { icon: '🤝',  bg: 'bg-amber-50',   label: 'Project Invite'    },
  due_date_reminder: { icon: '⏰',  bg: 'bg-red-50',     label: 'Due Date Reminder' },
  member_joined:     { icon: '👤',  bg: 'bg-teal-50',    label: 'Member Joined'     },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function NotificationsPage() {
  const [page,   setPage]   = useState(1);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [type,   setType]   = useState('all');
  const router              = useRouter();

  const { data, isLoading, isFetching } = useGetNotificationsQuery({
    page,
    limit: 20,
  });

  const [markRead]        = useMarkReadMutation();
  const [markAllRead]     = useMarkAllReadMutation();
  const [deleteNotif]     = useDeleteNotificationMutation();

  const notifications = data?.data?.notifications || [];
  const pagination    = data?.data?.pagination;
  const unreadCount   = data?.data?.unread || 0;

  // Client-side filter
  const filtered = notifications.filter((n) => {
    const passesRead = filter === 'unread' ? !n.isRead : true;
    const passesType = type   !== 'all'   ? n.type === type : true;
    return passesRead && passesType;
  });

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
    if (n.link)    router.push(n.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotif(id);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You are all caught up 🎉'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5"
          >
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Read filter */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {['all', 'unread'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize
                         transition-colors ${
                           filter === f
                             ? 'bg-white text-slate-800 shadow-sm'
                             : 'text-slate-500 hover:text-slate-700'
                         }`}
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs
                                  w-5 h-5 rounded-full inline-flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2
                     bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">All Types</option>
          {Object.entries(NOTIF_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Notification List ── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => <NotificationSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🔔</p>
            <p className="text-slate-600 font-semibold">No notifications</p>
            <p className="text-slate-400 text-sm mt-1">
              {filter !== 'all' || type !== 'all'
                ? 'Try changing your filters'
                : 'You will be notified of task updates, comments and more'}
            </p>
          </div>
        ) : (
          <div className={`divide-y divide-slate-50 ${isFetching ? 'opacity-60' : ''}`}>
            {filtered.map((n) => {
              const cfg     = NOTIF_CONFIG[n.type] || { icon: '🔔', bg: 'bg-slate-50' };
              const isUnread = !n.isRead;

              return (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`flex gap-4 px-5 py-4 transition-colors group
                    ${n.link ? 'cursor-pointer' : ''}
                    ${isUnread ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50'}
                  `}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center
                                   justify-center text-xl flex-shrink-0 mt-0.5`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Sender */}
                    {n.sender && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <img
                          src={
                            n.sender?.avatar?.url ||
                            `https://ui-avatars.com/api/?name=${n.sender?.name}&size=18`
                          }
                          className="w-4.5 h-4.5 rounded-full"
                          alt={n.sender?.name}
                        />
                        <span className="text-xs font-medium text-slate-500">
                          {n.sender?.name}
                        </span>
                      </div>
                    )}

                    {/* Message */}
                    <p className={`text-sm text-slate-700 leading-relaxed ${
                      isUnread ? 'font-medium' : ''
                    }`}>
                      {n.message}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                       ${cfg.bg} text-slate-600`}>
                        {NOTIF_CONFIG[n.type]?.label || n.type}
                      </span>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {isUnread && (
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-1" />
                    )}
                    <button
                      onClick={(e) => handleDelete(e, n._id)}
                      title="Delete notification"
                      className="text-slate-300 hover:text-red-500 opacity-0
                                 group-hover:opacity-100 transition-all p-1 rounded-lg
                                 hover:bg-red-50 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3
                          border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Page {page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}