//frontend/src/components/task/CreateTaskModal.jsx
'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation'; // ✅ ADD THIS
import { useCreateTaskMutation } from '@/store/api/taskApi';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', none: '⚪',
};

export default function CreateTaskModal({ columnId, boardId, onClose }) {
  const { projectId } = useParams(); // ✅ Extract projectId from the URL
                                     // /projects/[projectId]/boards/[boardId]

  const [title,       setTitle      ] = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority   ] = useState('none');
  const [dueDate,     setDueDate    ] = useState('');
  const [error,       setError      ] = useState('');

  const [createTask, { isLoading }] = useCreateTaskMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      await createTask({
        title      : title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate    : dueDate || undefined,
        columnId,
        boardId,
        projectId, // ✅ FIX: Now included → MongoDB validation passes
      }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create task. Please try again.');
      console.error('Create task failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
                 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl 
                      flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 
                        border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">✨ Create New Task</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                       p-1.5 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 
                            text-sm px-4 py-2.5 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="What needs to be done?"
              className={`
                w-full text-sm border rounded-xl px-3 py-2.5 
                focus:outline-none focus:ring-2 transition-all
                ${error && !title.trim()
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-200 focus:ring-indigo-300'}
              `}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 
                         resize-none focus:outline-none focus:ring-2 
                         focus:ring-indigo-300 transition-all"
            />
          </div>

          {/* Priority + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 
                           bg-white focus:outline-none focus:ring-2 
                           focus:ring-indigo-300 transition-all"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_COLORS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 
                           bg-white focus:outline-none focus:ring-2 
                           focus:ring-indigo-300 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm font-medium text-slate-600 bg-slate-100 
                         hover:bg-slate-200 py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 text-sm font-medium text-white bg-indigo-600 
                         hover:bg-indigo-700 py-2.5 rounded-xl transition-colors 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 
                                  border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                '✨ Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}