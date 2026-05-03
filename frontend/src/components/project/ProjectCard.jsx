// frontend/src/components/project/ProjectCard.jsx
'use client';
import Link from 'next/link';

const STATUS_BADGES = {
  active:    'bg-green-100 text-green-700',
  archived:  'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
};

export default function ProjectCard({ project }) {
  return (
    <Link href={`/projects/${project._id}`}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md 
                      hover:border-indigo-300 transition-all duration-200 overflow-hidden group cursor-pointer">
        {/* Color Bar */}
        <div className="h-2" style={{ backgroundColor: project.color }} />

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{project.icon}</span>
              <div>
                <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {project.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGES[project.status]}`}>
                  {project.status}
                </span>
              </div>
            </div>
            {project.isPrivate && <span className="text-slate-400 text-sm">🔒</span>}
          </div>

          {project.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{project.description}</p>
          )}

          <div className="flex items-center justify-between">
            {/* Members */}
            <div className="flex -space-x-1.5">
              {project.members?.slice(0, 4).map((m) => (
                <img
                  key={m.user._id || m.user}
                  src={m.user?.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${m.user?.name || 'U'}&size=28&background=random`}
                  className="w-7 h-7 rounded-full border-2 border-white"
                  alt="member"
                />
              ))}
              {project.members?.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 
                                flex items-center justify-center text-xs text-slate-600 font-medium">
                  +{project.members.length - 4}
                </div>
              )}
            </div>

            {/* Due Date */}
            {project.dueDate && (
              <span className="text-xs text-slate-400">
                📅 {new Date(project.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}