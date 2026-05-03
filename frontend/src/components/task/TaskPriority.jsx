// frontend/src/components/task/TaskPriority.jsx
'use client';
import { useState }              from 'react';
import { useUpdateTaskMutation } from '@/store/api/taskApi';
import { PRIORITY_CONFIG }       from '@/lib/utils';

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'];

export default function TaskPriority({ taskId, currentPriority, onChange }) {
  const [open, setOpen]               = useState(false);
  const [updateTask, { isLoading }]   = useUpdateTaskMutation();
  const config = PRIORITY_CONFIG[currentPriority] || PRIORITY_CONFIG.none;

  const handleSelect = async (priority) => {
    setOpen(false);
    if (priority === currentPriority) return;

    if (onChange) {
      onChange(priority);
    } else {
      await updateTask({ id: taskId, priority }).unwrap();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                   font-medium border transition-all hover:opacity-80
                   ${config.bg} ${config.color} border-current/20`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        <span className="text-current/60">▼</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full mt-1 left-0 w-44 bg-white rounded-xl
                          shadow-lg border border-slate-200 z-20 overflow-hidden py-1">
            {PRIORITIES.map((p) => {
              const pc = PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  onClick={() => handleSelect(p)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm
                             hover:bg-slate-50 transition-colors text-left
                             ${p === currentPriority ? 'bg-slate-50 font-semibold' : ''}`}
                >
                  <span>{pc.icon}</span>
                  <span className={pc.color}>{pc.label}</span>
                  {p === currentPriority && <span className="ml-auto text-indigo-500">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}