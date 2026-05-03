// frontend/src/app/(dashboard)/dashboard/page.jsx
'use client';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetMyTasksQuery } from '@/store/api/taskApi';
import ProjectCard from '@/components/project/ProjectCard';
import Link from 'next/link';

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser);
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: tasksData, isLoading: tasksLoading } = useGetMyTasksQuery();

  const projects = projectsData?.data?.projects || [];
  const tasks = tasksData?.data?.tasks || [];

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  );
  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={projects.length} icon="📁" color="bg-indigo-50" />
        <StatCard label="Active Tasks" value={tasks.filter(t => t.status !== 'done').length} icon="✅" color="bg-blue-50" />
        <StatCard label="Due Today" value={todayTasks.length} icon="📅" color="bg-amber-50" />
        <StatCard label="Overdue" value={overdueTasks.length} icon="⚠️" color="bg-red-50" />
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">My Projects</h2>
          <Link
            href="/projects/new"
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg 
                       hover:bg-indigo-700 transition-colors font-medium"
          >
            + New Project
          </Link>
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500 font-medium">No projects yet</p>
            <Link href="/projects/new" className="text-indigo-600 text-sm mt-1 inline-block hover:underline">
              Create your first project →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">My Recent Tasks</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {tasks.length === 0 ? (
            <p className="text-center py-10 text-slate-400">No tasks assigned to you</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Task</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Project</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Priority</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Due Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.slice(0, 8).map((task) => (
                  <TaskRow key={task._id} task={task} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const priorityColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
    none: 'bg-gray-100 text-gray-500',
  };
  const statusColors = {
    todo: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
  };
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
      <td className="px-4 py-3 font-medium text-slate-800">{task.title}</td>
      <td className="px-4 py-3 text-slate-500">{task.project?.name}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </td>
      <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </td>
    </tr>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}