// frontend/src/app/(dashboard)/projects/[projectId]/settings/page.jsx
'use client';
import { useState, useEffect } from 'react';
import {
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '@/store/api/projectApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#06b6d4','#64748b','#0f172a',
];
const ICON_OPTIONS = ['📋','🚀','💡','🎯','🔥','⚡','🌟','🛠️','📊','🎨','🔬','📱'];

export default function ProjectSettingsPage({ params }) {
  const { projectId } = params;
  const { user, hasProjectRole } = useAuth();
  const router = useRouter();

  const { data }                           = useGetProjectByIdQuery(projectId);
  const [updateProject, { isLoading }]     = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const project = data?.data?.project;

  const [form,       setForm]       = useState(null);
  const [message,    setMessage]    = useState('');
  const [isSuccess,  setIsSuccess]  = useState(false);
  const [deleteInput,setDeleteInput] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name:        project.name        || '',
        description: project.description || '',
        color:       project.color       || '#6366f1',
        icon:        project.icon        || '📋',
        isPrivate:   project.isPrivate   || false,
        status:      project.status      || 'active',
        dueDate:     project.dueDate
          ? new Date(project.dueDate).toISOString().split('T')[0]
          : '',
        tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
      });
    }
  }, [project]);

  const canEdit   = hasProjectRole(project, 'owner', 'admin');
  const isOwner   = project?.owner?._id === user?._id ||
                    project?.owner === user?._id;

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await updateProject({
        id:          projectId,
        name:        form.name,
        description: form.description,
        color:       form.color,
        icon:        form.icon,
        isPrivate:   form.isPrivate,
        status:      form.status,
        dueDate:     form.dueDate || undefined,
        tags:        form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }).unwrap();
      setMessage('✅ Project settings saved');
      setIsSuccess(true);
    } catch (err) {
      setMessage('❌ ' + (err?.data?.message || 'Update failed'));
      setIsSuccess(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== project?.name) return;
    try {
      await deleteProject(projectId).unwrap();
      router.push('/dashboard');
    } catch (err) {
      setMessage('❌ ' + (err?.data?.message || 'Delete failed'));
    }
  };

  if (!form) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Project Settings</h1>
        <p className="text-slate-500 mt-1">Manage settings for "{project?.name}"</p>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${
          isSuccess
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* General Settings */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">
          General
        </h2>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!canEdit}
            className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            disabled={!canEdit}
            className="input-field resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              disabled={!canEdit}
              className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              disabled={!canEdit}
              className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="design, frontend"
            disabled={!canEdit}
            className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => canEdit && setForm({ ...form, icon })}
                disabled={!canEdit}
                className={`w-9 h-9 text-xl rounded-xl transition-all ${
                  form.icon === icon
                    ? 'ring-2 ring-indigo-600 ring-offset-1 bg-indigo-50'
                    : 'bg-slate-100 hover:bg-slate-200'
                } disabled:cursor-not-allowed`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => canEdit && setForm({ ...form, color })}
                disabled={!canEdit}
                className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                  form.color === color ? 'ring-2 ring-offset-1 ring-slate-500 scale-110' : ''
                } disabled:cursor-not-allowed`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Privacy Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => canEdit && setForm({ ...form, isPrivate: !form.isPrivate })}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              form.isPrivate ? 'bg-indigo-600' : 'bg-slate-300'
            } ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow 
                         transition-transform ${
                           form.isPrivate ? 'translate-x-5' : 'translate-x-0.5'
                         }`}
            />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {form.isPrivate ? '🔒 Private Project' : '🌐 Public Project'}
          </span>
        </label>

        {canEdit && (
          <button type="submit" disabled={isLoading} className="btn-primary text-sm">
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </form>

      {/* Danger Zone */}
      {isOwner && (
        <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50/30">
          <h2 className="font-semibold text-red-700 mb-1">⚠️ Danger Zone</h2>
          <p className="text-sm text-slate-500 mb-4">
            Deleting this project will permanently remove all boards, tasks, and data. This action is irreversible.
          </p>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="btn-danger text-sm py-2 px-4"
            >
              Delete Project
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Type <strong className="text-red-600">"{project?.name}"</strong> to confirm:
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={project?.name}
                className="input-field border-red-300 focus:ring-red-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteInput !== project?.name || isDeleting}
                  className="btn-danger text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
                </button>
                <button
                  onClick={() => { setShowDelete(false); setDeleteInput(''); }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}