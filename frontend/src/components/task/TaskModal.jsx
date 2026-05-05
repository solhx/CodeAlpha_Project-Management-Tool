//src/components/task/TaskModal.jsx
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useUpdateTaskMutation, useDeleteTaskMutation } from '@/store/api/taskApi';
import { useGetCommentsQuery } from '@/store/api/commentApi';
import CommentList  from '../comment/CommentList';
import TaskLabels   from './TaskLabels';
import TaskAssignee from './TaskAssignee';  // ✅ ADDED
import api          from '@/lib/axios';     // ✅ ADDED for activity log

const PRIORITIES = ['none', 'low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', none: '⚪',
};

export default function TaskModal({ task, onClose }) {
  const [title,          setTitle         ] = useState(task.title);
  const [description,    setDescription   ] = useState(task.description || '');
  const [priority,       setPriority      ] = useState(task.priority);
  const [dueDate,        setDueDate       ] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [activeTab,      setActiveTab     ] = useState('comments');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask]                            = useDeleteTaskMutation();
  const { data: commentsData }                  = useGetCommentsQuery(task._id);

  const handleSave = useCallback(async (overrides = {}) => {
    try {
      await updateTask({
        id         : task._id,
        title,
        description,
        priority,
        dueDate    : dueDate || null,
        ...overrides,
      }).unwrap();
    } catch (err) {
      console.error('Update failed:', err);
    }
  }, [task._id, title, description, priority, dueDate, updateTask]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    try {
      await deleteTask(task._id).unwrap();
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start 
                 justify-center pt-10 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] 
                      overflow-hidden shadow-2xl flex flex-col">

        {/* Cover Color Bar */}
        {task.coverColor && (
          <div className="h-10 rounded-t-2xl" style={{ backgroundColor: task.coverColor }} />
        )}

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex-1 mr-4">
            {isEditingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                  handleSave();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                    handleSave();
                  }
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setTitle(task.title);
                  }
                }}
                className="text-xl font-bold text-slate-800 w-full border-b-2 
                           border-indigo-400 outline-none pb-1"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-slate-800 cursor-pointer 
                           hover:text-indigo-600 transition-colors"
                title="Click to edit title"
              >
                {title}
              </h2>
            )}
            <p className="text-xs text-slate-400 mt-1">
              in{' '}
              <span className="text-indigo-500 font-medium">
                {task.column?.title}
              </span>
              {' '}• Created by{' '}
              <span className="font-medium">{task.createdBy?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 
                         p-2 rounded-lg transition-colors text-sm"
              title="Delete task"
            >
              🗑️
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                         p-2 rounded-lg transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Main Content ── */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                📝 Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSave()}
                rows={4}
                placeholder="Add a more detailed description..."
                className="w-full text-sm text-slate-700 border border-slate-200 
                           rounded-xl p-3 resize-none focus:outline-none focus:ring-2 
                           focus:ring-indigo-300 transition-all"
              />
            </div>

            {/* Checklist */}
            <ChecklistSection task={task} />

            {/* Tabs */}
            <div>
              <div className="flex gap-1 border-b border-slate-200 mb-4">
                {['comments', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors
                      ${activeTab === tab
                        ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                        : 'text-slate-500 hover:text-slate-700'}
                    `}
                  >
                    {tab === 'comments'
                      ? `💬 Comments (${commentsData?.data?.comments?.length || 0})`
                      : '📋 Activity'}
                  </button>
                ))}
              </div>

              {activeTab === 'comments'
                ? <CommentList taskId={task._id} />
                : <ActivitySection taskId={task._id} />}
            </div>
          </div>

          {/* ── Sidebar Panel ── */}
          <div className="w-60 border-l border-slate-100 p-5 space-y-5 
                          overflow-y-auto bg-slate-50 flex-shrink-0">

            {/* ✅ Assignees — now interactive via TaskAssignee */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Assignees
              </p>
              <TaskAssignee
                taskId={task._id}
                projectId={task.project?._id || task.project}
                currentAssignees={task.assignees || []}
              />
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Priority
              </p>
              <select
                value={priority}
                onChange={(e) => {
                  const newPriority = e.target.value;
                  setPriority(newPriority);
                  handleSave({ priority: newPriority });
                }}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 
                           bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_COLORS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Due Date
              </p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDueDate(newDate);
                  handleSave({ dueDate: newDate || null });
                }}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 
                           bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Labels */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Labels
              </p>
              <TaskLabels labels={task.labels} taskId={task._id} />
            </div>

            {/* Save Button */}
            <button
              onClick={() => handleSave()}
              disabled={isUpdating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm 
                         font-medium py-2 rounded-lg transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 
                                  border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                '💾 Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Checklist Section ─────────────────────────────────────────────────────────
function ChecklistSection({ task }) {
  const [items,   setItems  ] = useState(task.checklist || []);
  const [newItem, setNewItem] = useState('');
  const [updateTask]          = useUpdateTaskMutation();

  const completedCount = items.filter((i) => i.isCompleted).length;
  const progress       = items.length
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  const toggleItem = async (index) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setItems(updated);
    await updateTask({ id: task._id, checklist: updated });
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const updated = [...items, { text: newItem.trim(), isCompleted: false }];
    setItems(updated);
    setNewItem('');
    await updateTask({ id: task._id, checklist: updated });
  };

  const removeItem = async (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    await updateTask({ id: task._id, checklist: updated });
  };

  if (items.length === 0 && !newItem.trim()) {
    return (
      <button
        onClick={() => setNewItem(' ')}
        className="text-sm text-slate-400 hover:text-indigo-600 transition-colors"
      >
        + Add Checklist
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-slate-700">
          ✅ Checklist ({completedCount}/{items.length})
        </label>
        <span className="text-xs text-slate-400">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-200 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={() => toggleItem(i)}
              className="w-4 h-4 accent-indigo-600 rounded flex-shrink-0"
            />
            <span className={`text-sm flex-1 ${
              item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'
            }`}>
              {item.text}
            </span>
            {/* ✅ ADDED: Remove checklist item button */}
            <button
              onClick={() => removeItem(i)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 
                         hover:text-red-400 transition-all text-xs"
              title="Remove item"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add New Item */}
      <div className="flex gap-2 mt-3">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item..."
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 
                     focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={addItem}
          disabled={!newItem.trim()}
          className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg 
                     hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Activity Section ──────────────────────────────────────────────────────────
function ActivitySection({ taskId }) {
  const [logs,    setLogs   ] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    api.get('/activity', { params: { taskId } })
      .then(({ data }) => setLogs(data.data?.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return (
    <div className="flex justify-center py-6">
      <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 
                      rounded-full animate-spin" />
    </div>
  );

  if (logs.length === 0) return (
    <p className="text-center text-slate-400 text-sm py-6">No activity yet.</p>
  );

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log._id} className="flex items-start gap-3 text-sm">
          <img
            src={
              log.actor?.avatar?.url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                log.actor?.name || '?'
              )}&size=28`
            }
            className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
            alt={log.actor?.name}
          />
          <div className="flex-1 min-w-0">
            <p className="text-slate-700">
              <span className="font-medium">{log.actor?.name}</span>{' '}
              <span className="text-slate-500">{log.detail}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}