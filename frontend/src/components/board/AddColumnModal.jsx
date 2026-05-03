// frontend/src/components/board/AddColumnModal.jsx
'use client';
import { useState } from 'react';
import { useCreateColumnMutation } from '@/store/api/boardApi';

const COLUMN_COLORS = [
  '#e2e8f0','#dbeafe','#fef3c7','#dcfce7',
  '#fce7f3','#ede9fe','#fee2e2','#e0f2fe',
];

export default function AddColumnModal({ boardId, onClose }) {
  const [title,  setTitle]  = useState('');
  const [color,  setColor]  = useState('#e2e8f0');
  const [limit,  setLimit]  = useState('');
  const [createColumn, { isLoading }] = useCreateColumnMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createColumn({
        boardId,
        title: title.trim(),
        color,
        taskLimit: limit ? Number(limit) : null,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error('Failed to create column:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-slide-up">
        <h3 className="font-bold text-slate-800 mb-5">Add New Column</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Column Title <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Backlog, Testing..."
              className="input-field"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Column Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                    color === c
                      ? 'border-slate-500 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              WIP Limit
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Max tasks in this column"
              min="1"
              max="99"
              className="input-field"
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave empty for no limit
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="btn-primary flex-1 text-sm disabled:opacity-60"
            >
              {isLoading ? 'Creating...' : 'Create Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}