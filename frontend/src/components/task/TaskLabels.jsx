// frontend/src/components/task/TaskLabels.jsx
'use client';
import { useState } from 'react';
import { useUpdateTaskMutation } from '@/store/api/taskApi';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6',
];

export default function TaskLabels({ labels = [], taskId }) {
  const [showForm, setShowForm]   = useState(false);
  const [text, setText]           = useState('');
  const [color, setColor]         = useState(PRESET_COLORS[0]);
  const [updateTask, { isLoading }] = useUpdateTaskMutation();

  const addLabel = async () => {
    if (!text.trim()) return;
    const updated = [...labels, { text, color }];
    await updateTask({ id: taskId, labels: updated });
    setText('');
    setShowForm(false);
  };

  const removeLabel = async (index) => {
    const updated = labels.filter((_, i) => i !== index);
    await updateTask({ id: taskId, labels: updated });
  };

  return (
    <div className="space-y-1.5">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center justify-between group">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium flex-1 truncate"
            style={{ backgroundColor: label.color + '20', color: label.color }}
          >
            {label.text}
          </span>
          <button
            onClick={() => removeLabel(i)}
            className="text-slate-300 hover:text-red-500 ml-1 opacity-0 
                       group-hover:opacity-100 transition-opacity text-xs"
          >
            ✕
          </button>
        </div>
      ))}

      {showForm ? (
        <div className="space-y-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Label name..."
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 
                       focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-transform 
                            ${color === c ? 'scale-125 ring-2 ring-white ring-offset-1' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={addLabel}
              disabled={isLoading}
              className="flex-1 text-xs bg-indigo-600 text-white rounded-lg py-1 hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 text-xs bg-slate-100 text-slate-600 rounded-lg py-1 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-slate-400 hover:text-indigo-600 transition-colors w-full text-left"
        >
          + Add label
        </button>
      )}
    </div>
  );
}