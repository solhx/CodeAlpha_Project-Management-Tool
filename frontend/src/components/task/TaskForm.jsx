// frontend/src/components/task/TaskForm.jsx
'use client';
import { useState, useEffect } from 'react';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'critical'];
const PRIORITY_ICONS = {
  none: '⚪', low: '🟢', medium: '🟡', high: '🟠', critical: '🔴',
};

const DEFAULT_FORM = {
  title:       '',
  description: '',
  priority:    'none',
  dueDate:     '',
  startDate:   '',
  estimatedHours: '',
  labels:      [],
};

export default function TaskForm({
  initialValues = {},
  onSubmit,
  isLoading      = false,
  submitLabel    = 'Save Task',
  boardMembers   = [],
  selectedAssignees = [],
  onAssigneesChange,
}) {
  const [form,     setForm]     = useState({ ...DEFAULT_FORM, ...initialValues });
  const [errors,   setErrors]   = useState({});
  const [newLabel, setNewLabel] = useState('');
  const [labelColor, setLabelColor] = useState('#6366f1');

  const LABEL_COLORS = ['#6366f1','#ef4444','#f97316','#22c55e','#3b82f6','#ec4899','#14b8a6'];

  useEffect(() => {
    setForm({ ...DEFAULT_FORM, ...initialValues });
  }, [JSON.stringify(initialValues)]);

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())             errs.title = 'Task title is required';
    if (form.title.trim().length > 200) errs.title = 'Max 200 characters';
    if (form.description.length > 2000) errs.description = 'Max 2000 characters';
    if (form.estimatedHours && isNaN(Number(form.estimatedHours))) {
      errs.estimatedHours = 'Must be a number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      assignees:      selectedAssignees,
    });
  };

  const addLabel = () => {
    if (!newLabel.trim()) return;
    set('labels', [...(form.labels || []), { text: newLabel.trim(), color: labelColor }]);
    setNewLabel('');
  };

  const removeLabel = (index) => {
    set('labels', form.labels.filter((_, i) => i !== index));
  };

  const toggleAssignee = (userId) => {
    const next = selectedAssignees.includes(userId)
      ? selectedAssignees.filter((id) => id !== userId)
      : [...selectedAssignees, userId];
    onAssigneesChange?.(next);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Task Title <span className="text-red-500">*</span>
        </label>
        <input
          autoFocus
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="What needs to be done?"
          maxLength={200}
          className={`input-field ${errors.title ? 'border-red-400 bg-red-50' : ''}`}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        <p className="text-xs text-slate-400 mt-1 text-right">{form.title.length}/200</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Add a more detailed description..."
          rows={4}
          maxLength={2000}
          className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set('priority', p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                         border-2 transition-all capitalize ${
                           form.priority === p
                             ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                             : 'border-slate-200 text-slate-600 hover:border-slate-300'
                         }`}
            >
              {PRIORITY_ICONS[p]} {p}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Due Date
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
            min={form.startDate || new Date().toISOString().split('T')[0]}
            className="input-field"
          />
        </div>
      </div>

      {/* Estimated Hours */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Estimated Hours
        </label>
        <input
          type="number"
          value={form.estimatedHours}
          onChange={(e) => set('estimatedHours', e.target.value)}
          placeholder="e.g. 4"
          min="0"
          max="9999"
          step="0.5"
          className={`input-field ${errors.estimatedHours ? 'border-red-400' : ''}`}
        />
        {errors.estimatedHours && (
          <p className="text-red-500 text-xs mt-1">{errors.estimatedHours}</p>
        )}
      </div>

      {/* Assignees */}
      {boardMembers.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Assignees
          </label>
          <div className="flex flex-wrap gap-2">
            {boardMembers.map((member) => {
              const id         = member._id || member.user?._id;
              const name       = member.name || member.user?.name || 'Unknown';
              const avatarUrl  = member.avatar?.url || member.user?.avatar?.url ||
                `https://ui-avatars.com/api/?name=${name}&size=28`;
              const isSelected = selectedAssignees.includes(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleAssignee(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                             border-2 transition-all ${
                               isSelected
                                 ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                 : 'border-slate-200 text-slate-600 hover:border-slate-300'
                             }`}
                >
                  <img src={avatarUrl} className="w-5 h-5 rounded-full" alt={name} />
                  {name.split(' ')[0]}
                  {isSelected && <span className="text-indigo-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Labels */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Labels</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(form.labels || []).map((label, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: label.color + '25', color: label.color }}
            >
              {label.text}
              <button
                type="button"
                onClick={() => removeLabel(i)}
                className="hover:opacity-70 ml-0.5"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
            placeholder="Label name..."
            className="input-field flex-1 text-sm py-1.5"
          />
          <div className="flex gap-1">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setLabelColor(c)}
                className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${
                  labelColor === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addLabel}
            disabled={!newLabel.trim()}
            className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white
                             rounded-full animate-spin" />
            Saving...
          </span>
        ) : submitLabel}
      </button>
    </form>
  );
}