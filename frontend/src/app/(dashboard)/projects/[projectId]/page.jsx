// frontend/src/app/(dashboard)/projects/[projectId]/page.jsx
'use client';

// ✅ FIX 1: useState imported properly at the top
import { useState } from 'react';
import { useGetProjectByIdQuery } from '@/store/api/projectApi';
// ✅ FIX 2: useCreateBoardMutation now imported
import { useGetBoardsQuery, useCreateBoardMutation } from '@/store/api/boardApi';
import Link    from 'next/link';
import Spinner from '@/components/ui/Spinner';

// ─── Project Page ──────────────────────────────────────────────────────────────
export default function ProjectPage({ params }) {
  const { projectId } = params;
  const { data: projectData, isLoading } = useGetProjectByIdQuery(projectId);
  const { data: boardsData }             = useGetBoardsQuery(projectId);

  const project = projectData?.data?.project;
  const boards  = boardsData?.data?.boards || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{project?.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{project?.name}</h1>
            <p className="text-slate-500 text-sm">{project?.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/members`}
            className="btn-secondary text-sm py-1.5 px-4"
          >
            👥 Members ({project?.members?.length})
          </Link>
          <Link
            href={`/projects/${projectId}/settings`}
            className="btn-secondary text-sm py-1.5 px-4"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Boards',  value: boards.length,                 icon: '📋' },
          { label: 'Members', value: project?.members?.length || 0, icon: '👥' },
          { label: 'Status',  value: project?.status || 'active',   icon: '🔖' },
          { label: 'Due',     value: project?.dueDate
              ? new Date(project.dueDate).toLocaleDateString()
              : 'No deadline',                                       icon: '📅' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-semibold text-slate-800 capitalize">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Boards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Boards</h2>
          <CreateBoardButton projectId={projectId} />
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-slate-500">No boards yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Create a board to start organizing tasks
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link
                key={board._id}
                href={`/projects/${projectId}/boards/${board._id}`}
              >
                <div
                  className="card p-5 hover:shadow-md hover:border-indigo-300
                             transition-all cursor-pointer group"
                  style={{ borderLeftColor: project?.color, borderLeftWidth: 4 }}
                >
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 mb-1">
                    {board.name}
                  </h3>
                  {board.description && (
                    <p className="text-sm text-slate-500 line-clamp-1">
                      {board.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-3">
                    Created by {board.createdBy?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Board Button ───────────────────────────────────────────────────────
function CreateBoardButton({ projectId }) {
  // ✅ FIX 1: useState used AFTER it's imported at the top — no require() needed
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  // ✅ FIX 2: useCreateBoardMutation works because it's now imported at the top
  const [createBoard, { isLoading }] = useCreateBoardMutation();

  // ❌ REMOVED: const { useState } = require('react');
  //    This line declared useState AFTER it was already used on lines above,
  //    causing "Cannot access useState before initialization".
  //    It also used CommonJS require() which is wrong in Next.js App Router.

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createBoard({ name, projectId }).unwrap();
      setName('');
      setShow(false);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="btn-primary text-sm py-1.5 px-4"
      >
        + New Board
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-4">Create New Board</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Board name..."
                className="input-field"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShow(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}