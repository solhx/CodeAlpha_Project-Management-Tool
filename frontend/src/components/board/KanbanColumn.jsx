//frontend/src/components/board/KanbanColumn.jsx
'use client';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard        from './TaskCard';
import { useState }   from 'react';

// ✅ FIX: Import the CORRECT modal for creating tasks
// Before: imported TaskModal (edit-only) and called it CreateTaskModal
// After:  imports the dedicated CreateTaskModal component
import CreateTaskModal from '../task/CreateTaskModal';

const COLUMN_COLORS = {
  'To Do'      : 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-50  text-blue-600',
  'Review'     : 'bg-amber-50 text-amber-600',
  'Done'       : 'bg-green-50 text-green-600',
};

export default function KanbanColumn({ column, tasks }) {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { setNodeRef } = useDroppable({ id: column._id });

  return (
    <div className="shrink-0 w-72 flex flex-col rounded-xl bg-slate-50 
                    border border-slate-200 shadow-sm">

      {/* ── Column Header ── */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            COLUMN_COLORS[column.title] || 'bg-gray-100 text-gray-600'
          }`}>
            {column.title}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {tasks.length}
            {column.taskLimit && ` / ${column.taskLimit}`}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 text-lg leading-none">
          ⋮
        </button>
      </div>

      {/* ── Tasks List ── */}
      <div
        ref={setNodeRef}
        className="flex-1 px-3 pb-3 flex flex-col gap-2 
                   min-h-[200px] overflow-y-auto max-h-[calc(100vh-240px)]"
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>
      </div>

      {/* ── Add Task Button ── */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setShowCreateTask(true)}
          className="w-full text-sm text-slate-400 hover:text-indigo-600 
                     hover:bg-indigo-50 py-2 rounded-lg transition-colors 
                     duration-150 flex items-center gap-1 justify-center"
        >
          <span className="text-lg leading-none">+</span> Add Task
        </button>
      </div>

      {/* ✅ FIX: Now opens CreateTaskModal (not TaskModal)
               CreateTaskModal handles empty form + createTask mutation
               TaskModal handles editing an existing task (opened from TaskCard) */}
      {showCreateTask && (
        <CreateTaskModal
          columnId={column._id}
          boardId={column.board}
          onClose={() => setShowCreateTask(false)}
        />
      )}
    </div>
  );
}