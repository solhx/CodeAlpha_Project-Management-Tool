// frontend/src/app/(dashboard)/my-tasks/page.jsx
'use client';
import { useState } from 'react';
import { useGetMyTasksQuery } from '@/store/api/taskApi';
import Spinner from '@/components/ui/Spinner';
import { PRIORITY_CONFIG, STATUS_LABELS, isOverdue, formatDate } from '@/lib/utils';

const FILTERS = {
  status:   ['all', 'todo', 'in_progress', 'review', 'done'],
  priority: ['all', 'critical', 'high', 'medium', 'low', 'none'],
};

const STATUS_COLORS = {
  todo:        'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review:      'bg-amber-100 text-amber-700',
  done:        'bg-green-100 text-green-700',
};

export default function MyTasksPage() {
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy,         setSortBy]         = useState('dueDate');
  const [page,           setPage]           = useState(1);

  const params = {
    page,
    limit: 20,
    ...(statusFilter   !== 'all' && { status:   statusFilter   }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
  };

  const { data, isLoading } = useGetMyTasksQuery(params);
  const tasks      = data?.data?.tasks      || [];
  const pagination = data?.data?.pagination;

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'priority') {
      const order = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      return (order[a.priority] || 4) - (order[b.priority] || 4);
    }
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
        <p className="text-slate-500 mt-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
          {overdueTasks.length > 0 && (
            <span className="ml-2 text-red-500 font-medium">
              · {overdueTasks.length} overdue
            </span>
          )}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: tasks.length,                                       color: 'bg-indigo-50 text-indigo-700' },
          { label: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length, color: 'bg-blue-50 text-blue-700'    },
          { label: 'Overdue',     value: overdueTasks.length,                                color: 'bg-red-50 text-red-700'       },
          { label: 'Completed',   value: tasks.filter((t) => t.status === 'done').length,    color: 'bg-green-50 text-green-700'   },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Sort */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {FILTERS.status.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s === 'all' ? 'All Statuses' : STATUS_LABELS[s] || s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-600">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {FILTERS.priority.map((p) => (
              <option key={p} value={p} className="capitalize">
                {p === 'all' ? 'All Priorities' : p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-semibold text-slate-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="createdAt">Newest</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-slate-500 font-medium">No tasks found</p>
            <p className="text-slate-400 text-sm mt-1">
              {statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try changing your filters'
                : 'Tasks assigned to you will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Task', 'Project', 'Status', 'Priority', 'Due Date', 'Board'].map((h) => (
                      <th key={h}
                          className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const pConf   = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;

                    return (
                      <tr key={task._id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer group">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-indigo-600
                                         transition-colors line-clamp-1">
                              {task.title}
                            </p>
                            {task.checklist?.length > 0 && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                ✅ {task.checklist.filter((c) => c.isCompleted).length}/
                                {task.checklist.length} done
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{task.project?.icon || '📋'}</span>
                            <span className="text-slate-600 truncate max-w-[120px]">
                              {task.project?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${STATUS_COLORS[task.status]} capitalize`}>
                            {STATUS_LABELS[task.status] || task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${pConf.bg} ${pConf.color} capitalize`}>
                            {pConf.icon} {pConf.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs font-medium ${
                          overdue ? 'text-red-600' : 'text-slate-500'
                        }`}>
                          {task.dueDate ? (
                            <span>
                              {overdue && '⚠️ '}
                              {formatDate(task.dueDate)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[120px]">
                          {task.board?.name || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
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
          </>
        )}
      </div>
    </div>
  );
}