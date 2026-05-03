// frontend/src/app/(dashboard)/projects/new/page.jsx
'use client';
import { useState } from 'react';
import { useCreateProjectMutation } from '@/store/api/projectApi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ICON_OPTIONS  = ['📋','🚀','💡','🎯','🔥','⚡','🌟','🛠️','📊','🎨','🔬','📱'];
const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#06b6d4','#64748b','#0f172a',
];

export default function NewProjectPage() {
  const router = useRouter();
  const [createProject, { isLoading }] = useCreateProjectMutation();

  const [form, setForm] = useState({
    name:        '',
    description: '',
    color:       '#6366f1',
    icon:        '📋',
    isPrivate:   false,
    dueDate:     '',
    tags:        '',
  });
  const [errors,  setErrors]  = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.name.trim())               errs.name = 'Project name is required';
    if (form.name.trim().length > 100)   errs.name = 'Name cannot exceed 100 characters';
    if (form.description.length > 500)   errs.description = 'Max 500 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');

    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        color:       form.color,
        icon:        form.icon,
        isPrivate:   form.isPrivate,
        dueDate:     form.dueDate || undefined,
        tags:        form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const result = await createProject(payload).unwrap();
      router.push(`/projects/${result.data.project._id}`);
    } catch (err) {
      setApiError(err?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">New Project</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Create New Project</h1>
        <p className="text-slate-500 mt-1">Set up a workspace for your team</p>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3
                        rounded-xl text-sm mb-6 flex items-center gap-2">
          ⚠️ {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preview Card */}
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ backgroundColor: form.color }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative flex items-center gap-3">
            <span className="text-4xl">{form.icon}</span>
            <div>
              <p className="text-xl font-bold">{form.name || 'Project Name'}</p>
              <p className="text-white/70 text-sm mt-0.5">
                {form.description || 'Project description...'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Fields */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Basic Information</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              maxLength={100}
              className={`input-field ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            <p className="text-slate-400 text-xs mt-1">{form.name.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this project about?"
              rows={3}
              maxLength={500}
              className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            <p className="text-slate-400 text-xs mt-1">{form.description.length}/500</p>
          </div>

          {/* Due Date + Privacy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="design, frontend, api"
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
            </div>
          </div>

          {/* Privacy */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                form.isPrivate ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.isPrivate ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Private Project</p>
              <p className="text-xs text-slate-400">
                {form.isPrivate ? 'Only invited members can see this' : 'Visible to all team members'}
              </p>
            </div>
          </label>
        </div>

        {/* Icon Selection */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Project Icon</h2>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setForm({ ...form, icon })}
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

        {/* Color Selection */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Project Color</h2>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={`w-9 h-9 rounded-xl transition-all hover:scale-110 ${
                  form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pb-8">
          <Link href="/projects" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white
                                 rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              '🚀 Create Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}