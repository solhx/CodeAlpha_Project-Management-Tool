'use client';

import { useState, useMemo } from 'react';
import { useGetMyTasksQuery } from '@/store/api/taskApi';

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEK_DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PRIORITY_DOT = {
  critical : 'bg-red-500',
  high     : 'bg-orange-500',
  medium   : 'bg-yellow-500',
  low      : 'bg-green-500',
  none     : 'bg-slate-400',
};
const PRIORITY_PILL = {
  critical : 'bg-red-500 text-white',
  high     : 'bg-orange-500 text-white',
  medium   : 'bg-yellow-400 text-white',
  low      : 'bg-green-500 text-white',
  none     : 'bg-slate-400 text-white',
};
const STATUS_PILL = {
  todo        : 'bg-slate-100 text-slate-600',
  in_progress : 'bg-blue-100 text-blue-700',
  review      : 'bg-amber-100 text-amber-700',
  done        : 'bg-green-100 text-green-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildCalendarGrid(year, month) {
  const firstWeekDay  = new Date(year, month, 1).getDay();
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const daysInPrev    = new Date(year, month, 0).getDate();

  const cells = [];

  // Trailing days from previous month
  for (let i = firstWeekDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false, date: new Date(year, month - 1, daysInPrev - i) });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  }
  // Leading days of next month (fill to 42 cells = 6 rows)
  for (let d = 1; cells.length < 42; d++) {
    cells.push({ day: d, current: false, date: new Date(year, month + 1, d) });
  }
  return cells;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CalendarCell({ cell, isToday, isSelected, dayTasks, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        min-h-[90px] p-1.5 border-b border-r border-slate-100 cursor-pointer
        transition-colors hover:bg-indigo-50
        ${!cell.current ? 'bg-slate-50/70' : 'bg-white'}
        ${isSelected   ? 'ring-2 ring-inset ring-indigo-400 bg-indigo-50' : ''}
      `}
    >
      {/* Day number */}
      <div className={`
        w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 mx-auto
        ${isToday  ? 'bg-indigo-600 text-white shadow-sm' :
          cell.current ? 'text-slate-700' : 'text-slate-300'}
      `}>
        {cell.day}
      </div>

      {/* Task pills */}
      <div className="space-y-0.5">
        {dayTasks.slice(0, 2).map((task) => (
          <div
            key={task._id}
            title={task.title}
            className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${PRIORITY_PILL[task.priority] || 'bg-indigo-500 text-white'}`}
          >
            {task.title}
          </div>
        ))}
        {dayTasks.length > 2 && (
          <div className="text-xs text-slate-400 px-1">
            +{dayTasks.length - 2} more
          </div>
        )}
      </div>
    </div>
  );
}

function SidePanel({ selectedDay, selectedTasks, tasks, month, year, today }) {
  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < today && t.status !== 'done'
  ).length;

  const thisMonthCount = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Selected Day Header */}
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800 text-sm">
          {selectedDay
            ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : 'Select a day to see tasks'}
        </h3>
        {selectedDay && (
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedTasks.length === 0
              ? 'No tasks due'
              : `${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} due`}
          </p>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!selectedDay ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <span className="text-3xl mb-2">📅</span>
            <p className="text-sm">Click on any day</p>
          </div>
        ) : selectedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <span className="text-3xl mb-2">✨</span>
            <p className="text-sm">No tasks due this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedTasks.map((task) => (
              <div
                key={task._id}
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                    {task.project?.name && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">📁 {task.project.name}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_PILL[task.status] || 'bg-slate-100 text-slate-600'}`}>
                        {task.status?.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_PILL[task.priority] || 'bg-slate-400 text-white'}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {MONTH_NAMES[month]} Summary
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Total tasks</span>
            <span className="font-bold text-slate-800">{tasks.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Due this month</span>
            <span className="font-bold text-slate-800">{thisMonthCount}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-red-500">Overdue</span>
            <span className={`font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {overdueCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);

  const [viewDate, setViewDate]     = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today);

  // Fetch ALL tasks with a high limit so all due dates are visible
  const { data: tasksData, isLoading } = useGetMyTasksQuery({ page: 1, limit: 200 });
  const tasks = tasksData?.data?.tasks || [];

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build date → tasks map
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = new Date(task.dueDate).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  const calendarCells  = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const selectedTasks  = tasksByDate[selectedDay?.toDateString()] || [];

  const goToPrevMonth  = () => setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth  = () => setViewDate(new Date(year, month + 1, 1));
  const goToToday      = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  };

  return (
    <div className="space-y-6 h-full">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📅 Calendar</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your tasks by due date</p>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg
                     hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
        >
          Today
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Calendar Grid ── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         hover:bg-slate-100 text-slate-600 text-xl transition-colors"
            >
              ‹
            </button>
            <h2 className="text-base font-semibold text-slate-800">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         hover:bg-slate-100 text-slate-600 text-xl transition-colors"
            >
              ›
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, idx) => (
                <CalendarCell
                  key={idx}
                  cell={cell}
                  isToday={cell.date.toDateString() === today.toDateString()}
                  isSelected={selectedDay?.toDateString() === cell.date.toDateString()}
                  dayTasks={tasksByDate[cell.date.toDateString()] || []}
                  onClick={() => setSelectedDay(cell.date)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Side Panel ── */}
        <SidePanel
          selectedDay={selectedDay}
          selectedTasks={selectedTasks}
          tasks={tasks}
          month={month}
          year={year}
          today={today}
        />
      </div>
    </div>
  );
}