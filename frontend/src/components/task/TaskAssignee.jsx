// frontend/src/components/task/TaskAssignee.jsx
'use client';
import { useState, useEffect }   from 'react';
import { useAssignTaskMutation } from '@/store/api/taskApi';
import api                       from '@/lib/axios';

export default function TaskAssignee({ taskId, projectId, currentAssignees = [] }) {
  const [open,     setOpen    ] = useState(false);
  const [query,    setQuery   ] = useState('');
  const [members,  setMembers ] = useState([]);
  const [selected, setSelected] = useState(
    currentAssignees.map((u) => u._id || u)
  );
  const [assignTask, { isLoading }] = useAssignTaskMutation();

  // Sync when parent passes updated assignees (e.g. socket update)
  useEffect(() => {
    setSelected(currentAssignees.map((u) => u._id || u));
  }, [currentAssignees]);

  // Load project members when dropdown opens
  useEffect(() => {
    if (!open || !projectId) return;
    api.get(`/projects/${projectId}`)
      .then(({ data }) => {
        const raw = data.data?.project?.members || [];

        // ✅ FIX: Safely map — members[].user must be a populated object
        const memberUsers = raw
          .map((m) => (typeof m.user === 'object' && m.user !== null ? m.user : null))
          .filter(Boolean);

        // ✅ Include the owner too
        const owner = data.data?.project?.owner;
        if (owner && typeof owner === 'object') {
          const alreadyIn = memberUsers.some((u) => u._id === owner._id);
          if (!alreadyIn) memberUsers.unshift(owner);
        }

        setMembers(memberUsers);
      })
      .catch(console.error);
  }, [open, projectId]);

  const filtered = members.filter((m) =>
    m.name?.toLowerCase().includes(query.toLowerCase()) ||
    m.email?.toLowerCase().includes(query.toLowerCase())
  );

  const toggleAssignee = async (userId) => {
    const next = selected.includes(userId)
      ? selected.filter((id) => id !== userId)
      : [...selected, userId];

    setSelected(next);
    try {
      await assignTask({ taskId, assignees: next }).unwrap();
    } catch (err) {
      // Revert optimistic update on failure
      setSelected(selected);
      console.error('Assign failed:', err);
    }
  };

  // Build display list from members (populated) or fallback to currentAssignees
  const assignedUsers = members.length > 0
    ? members.filter((m) => selected.includes(m._id))
    : currentAssignees.filter((u) => typeof u === 'object');

  return (
    <div className="relative">
      {/* ── Trigger / Display ── */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-wrap gap-1 min-h-[28px] w-full text-left"
        title="Click to manage assignees"
      >
        {assignedUsers.length === 0 ? (
          <span className="text-xs text-slate-400 hover:text-indigo-600 
                           transition-colors flex items-center gap-1">
            <span className="text-base">+</span> Assign members
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {assignedUsers.slice(0, 3).map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-1.5 bg-white border 
                           border-slate-200 rounded-full px-2 py-0.5"
              >
                <img
                  src={
                    u.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=14`
                  }
                  className="w-3.5 h-3.5 rounded-full"
                  alt={u.name}
                />
                <span className="text-xs text-slate-700 font-medium">
                  {u.name.split(' ')[0]}
                </span>
              </div>
            ))}
            {assignedUsers.length > 3 && (
              <span className="text-xs text-slate-400 self-center">
                +{assignedUsers.length - 3} more
              </span>
            )}
          </div>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute top-full mt-1 left-0 w-60 bg-white rounded-xl
                          shadow-xl border border-slate-200 z-20 overflow-hidden">

            {/* Search */}
            <div className="p-2 border-b border-slate-100">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full text-sm px-2.5 py-1.5 border border-slate-200 
                           rounded-lg focus:outline-none focus:ring-2 
                           focus:ring-indigo-300"
              />
            </div>

            {/* Member List */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  {members.length === 0 ? 'Loading members...' : 'No members found'}
                </p>
              ) : (
                filtered.map((member) => {
                  const isSelected = selected.includes(member._id);
                  return (
                    <button
                      key={member._id}
                      onClick={() => toggleAssignee(member._id)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-2.5 px-3 py-2 
                                 hover:bg-slate-50 transition-colors text-left 
                                 disabled:opacity-60"
                    >
                      <img
                        src={
                          member.avatar?.url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            member.name
                          )}&size=28`
                        }
                        className="w-7 h-7 rounded-full flex-shrink-0"
                        alt={member.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {member.name}
                        </p>
                        {member.email && (
                          <p className="text-xs text-slate-400 truncate">
                            {member.email}
                          </p>
                        )}
                      </div>
                      {isLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 
                                        border-t-indigo-500 rounded-full animate-spin 
                                        flex-shrink-0" />
                      ) : isSelected ? (
                        <span className="text-indigo-600 text-sm flex-shrink-0">✓</span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {selected.length > 0 && (
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-500">
                  {selected.length} assignee{selected.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}