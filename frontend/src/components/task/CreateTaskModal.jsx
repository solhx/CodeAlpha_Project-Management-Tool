// frontend/src/components/task/CreateTaskModal.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams }           from 'next/navigation';
import { useCreateTaskMutation } from '@/store/api/taskApi';
import api from '@/lib/axios';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', none: '⚪',
};

export default function CreateTaskModal({ columnId, boardId, projectId: propProjectId, onClose }) {
  const params    = useParams();
  const projectId = propProjectId || params?.projectId;

  const [title,             setTitle            ] = useState('');
  const [description,       setDescription      ] = useState('');
  const [priority,          setPriority         ] = useState('none');
  const [dueDate,           setDueDate          ] = useState('');
  const [error,             setError            ] = useState('');
  const [members,           setMembers          ] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [loadingMembers,    setLoadingMembers   ] = useState(false);

  const [createTask, { isLoading }] = useCreateTaskMutation();

  // ── Load project members on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    setLoadingMembers(true);
    api.get(`/projects/${projectId}`)
      .then(({ data }) => {
        const raw = data.data?.project?.members || [];

        // members[].user must be a populated object (ensure backend populates it)
        const memberUsers = raw
          .map((m) => (typeof m.user === 'object' && m.user !== null ? m.user : null))
          .filter(Boolean);

        // Also include the owner if populated
        const owner = data.data?.project?.owner;
        if (owner && typeof owner === 'object') {
          const alreadyIn = memberUsers.some((u) => u._id === owner._id);
          if (!alreadyIn) memberUsers.unshift(owner);
        }

        setMembers(memberUsers);
      })
      .catch((err) => console.error('Failed to load members:', err))
      .finally(() => setLoadingMembers(false));
  }, [projectId]);

  const toggleAssignee = (userId) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

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
        projectId,
        assignees  : selectedAssignees,
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">

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

          {/* ── Assignees ── */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Assignees{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>

            {loadingMembers ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 
                                rounded-full animate-spin" />
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No members found in this project.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const id         = member._id;
                  const name       = member.name || 'Unknown';
                  const avatarUrl  =
                    member.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=28`;
                  const isSelected = selectedAssignees.includes(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleAssignee(id)}
                      title={member.email || name}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                        border-2 transition-all
                        ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'}
                      `}
                    >
                      <img
                        src={avatarUrl}
                        className="w-5 h-5 rounded-full"
                        alt={name}
                      />
                      {name.split(' ')[0]}
                      {isSelected && (
                        <span className="text-indigo-600 text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedAssignees.length > 0 && (
              <p className="text-xs text-indigo-600 mt-2">
                {selectedAssignees.length} member
                {selectedAssignees.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* ── Actions ── */}
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