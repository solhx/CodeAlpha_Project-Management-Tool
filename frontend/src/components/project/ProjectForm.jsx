// frontend/src/components/project/ProjectForm.jsx
'use client';
import { useState, useEffect } from 'react';

const ICON_OPTIONS  = ['📋','🚀','💡','🎯','🔥','⚡','🌟','🛠️','📊','🎨','🔬','📱','🏆','🌍','💼'];
const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#06b6d4','#64748b','#0f172a',
];

const DEFAULT_FORM = {
  name:        '',
  description: '',
  color:       '#6366f1',
  icon:        '📋',
  isPrivate:   false,
  dueDate:     '',
  tags:        '',
  status:      'active',
};

export default function ProjectForm({
  initialValues = {},
  onSubmit,
  isLoading  = false,
  submitLabel = 'Save',
  showStatus = false,
}) {
  const [form,   setForm]   = useState({ ...DEFAULT_FORM, ...initialValues });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({ ...DEFAULT_FORM, ...initialValues });
  }, [JSON.stringify(initialValues)]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())             errs.name = 'Project name is required';
    if (form.name.trim().length > 100) errs.name = 'Max 100 characters';
    if (form.description.length > 500) errs.description = 'Max 500 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Preview */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden shadow-md"
        style={{ backgroundColor: form.color }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative flex items-center gap-3">
          <span className="text-4xl">{form.icon}</span>
          <div>
            <p className="text-lg font-bold leading-tight">
              {form.name || 'Project Name'}
            </p>
            <p className="text-white/70 text-sm mt-0.5">
              {form.description || 'Add a description...'}
            </p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Website Redesign"
          maxLength={100}
          className={`input-field ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        <p className="text-xs text-slate-400 mt-1 text-right">{form.name.length}/100</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What is this project about?"
          rows={3}
          maxLength={500}
          className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        <p className="text-xs text-slate-400 mt-1 text-right">{form.description.length}/500</p>
      </div>

      {/* Icon Row */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => set('icon', icon)}
              className={`w-10 h-10 text-xl rounded-xl transition-all hover:scale-110 ${
                form.icon === icon
                  ? 'ring-2 ring-indigo-600 ring-offset-2 bg-indigo-50 scale-110'
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color Row */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set('color', color)}
              className={`w-9 h-9 rounded-xl transition-all hover:scale-110 ${
                form.color === color
                  ? 'ring-2 ring-offset-2 ring-slate-500 scale-110'
                  : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Due Date + Tags */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="design, api, frontend"
            className="input-field"
          />
          <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
        </div>
      </div>

      {/* Status (edit mode only) */}
      {showStatus && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="input-field"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {/* Privacy Toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
          type="button"
          onClick={() => set('isPrivate', !form.isPrivate)}
          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
            form.isPrivate ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
                        transition-transform ${
                          form.isPrivate ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
          />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {form.isPrivate ? '🔒 Private Project' : '🌐 Public Project'}
          </p>
          <p className="text-xs text-slate-400">
            {form.isPrivate
              ? 'Only invited members can access this project'
              : 'All team members can see this project'}
          </p>
        </div>
      </label>

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