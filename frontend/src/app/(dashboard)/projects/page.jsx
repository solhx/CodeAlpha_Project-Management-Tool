// frontend/src/app/(dashboard)/projects/page.jsx
'use client';
import { useState }              from 'react';
import { useGetProjectsQuery }   from '@/store/api/projectApi';
import ProjectCard               from '@/components/project/ProjectCard';
import { ProjectCardSkeleton }   from '@/components/ui/Skeleton';
import Link                      from 'next/link';

const STATUS_FILTERS = ['all', 'active', 'completed', 'archived'];

export default function ProjectsPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  const { data, isLoading } = useGetProjectsQuery({
    page,
    limit: 12,
    ...(status !== 'all' && { status }),
    ...(search.trim()    && { search }),
  });

  const projects   = data?.data?.projects   || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 mt-1">
            {pagination?.total ?? 0} project{pagination?.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary text-sm">
          + New Project
        </Link>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search projects..."
            className="input-field pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                status === s
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-slate-600 font-semibold text-lg">No projects found</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            {search || status !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first project to get started'}
          </p>
          {!search && status === 'all' && (
            <Link href="/projects/new" className="btn-primary text-sm">
              🚀 Create Project
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
              >
                ← Previous
              </button>
              <div className="flex gap-1">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}