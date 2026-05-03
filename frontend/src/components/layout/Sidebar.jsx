'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useGetProjectsQuery } from '@/store/api/projectApi';

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/dashboard',     icon: '🏠' },
  { label: 'My Tasks',      href: '/my-tasks',       icon: '✅' },
  { label: 'Calendar',      href: '/calendar',       icon: '📅' },
  { label: 'Notifications', href: '/notifications',  icon: '🔔' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useSelector(selectCurrentUser);
  const { data: projectsData } = useGetProjectsQuery();
  const projects = projectsData?.data?.projects || [];

  return (
    // ✅ FIX 1: Added z-40 — Sidebar must sit ABOVE Navbar (z-30) so it never
    // gets covered when the user scrolls horizontally on the Kanban board.
    // Navbar is `sticky top-0 z-30`; Sidebar is `fixed`, so without an explicit
    // z-index it defaults to z-auto and loses the stacking battle.
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-100 flex flex-col
                      fixed left-0 top-0 z-40">

      {/* Brand */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-700">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center
                        justify-center text-white font-bold text-lg">
          P
        </div>
        <span className="text-xl font-bold text-white tracking-tight">ProFlow</span>
      </div>

      {/* Main Nav */}
      <nav className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${pathname === item.href
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Projects Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Projects
            </span>
            <Link
              href="/projects/new"
              className="text-slate-400 hover:text-white text-lg leading-none"
            >
              +
            </Link>
          </div>

          <div className="space-y-0.5">
            {projects.map((project) => (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                  transition-colors duration-150
                  ${pathname.startsWith(`/projects/${project._id}`)
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <Link
          href="/profile"
          className="flex items-center gap-3 hover:bg-slate-800 rounded-lg p-2 transition-colors"
        >
          <img
            src={
              user?.avatar?.url ||
              `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`
            }
            alt={user?.name}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}