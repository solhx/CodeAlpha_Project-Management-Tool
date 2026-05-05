//frontend/src/components/board/KanbanBoard.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, DragOverlay, closestCorners,
  KeyboardSensor, PointerSensor,
  useSensor, useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn    from './KanbanColumn';
import TaskCard        from './TaskCard';
import AddColumnModal  from './AddColumnModal'; // ✅ ADDED
import { useMoveTaskMutation } from '@/store/api/taskApi';

const getColumnId = (column) => {
  if (!column) return null;
  if (typeof column === 'string') return column;
  return column._id?.toString() ?? column.toString();
};

export default function KanbanBoard({ board, columns, tasks }) {
  const [activeTask,     setActiveTask    ] = useState(null);
  const [localColumns,   setLocalColumns  ] = useState(columns);
  const [localTasks,     setLocalTasks    ] = useState(tasks);
  const [showAddColumn,  setShowAddColumn ] = useState(false); // ✅ ADDED

  const [moveTask] = useMoveTaskMutation();

  // Sync localColumns when board refetches
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Sync localTasks when board refetches — skip during active drag
  useEffect(() => {
    if (!activeTask) {
      setLocalTasks(tasks);
    }
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = useCallback((id) => {
    if (localColumns.find((col) => col._id === id)) return id;
    const task = localTasks.find((t) => t._id === id);
    return task ? getColumnId(task.column) : null;
  }, [localColumns, localTasks]);

  const handleDragStart = ({ active }) => {
    setActiveTask(localTasks.find((t) => t._id === active.id) || null);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeContainer = findContainer(active.id);
    const overContainer   = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setLocalTasks((prev) =>
      prev.map((t) =>
        t._id === active.id ? { ...t, column: overContainer } : t
      )
    );
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer   = findContainer(over.id);
    if (!activeContainer || !overContainer) return;

    const tasksInTarget = localTasks.filter(
      (t) => getColumnId(t.column) === overContainer
    );
    const overIndex = tasksInTarget.findIndex((t) => t._id === over.id);
    const newOrder  = overIndex >= 0 ? overIndex : tasksInTarget.length;

    try {
      await moveTask({
        taskId        : active.id,
        targetColumnId: overContainer,
        order         : newOrder,
      }).unwrap();
    } catch (err) {
      setLocalTasks(tasks);
      console.error('Failed to move task:', err);
    }
  };

  const dropAnimation = {
    duration  : 200,
    easing    : 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0' } },
    }),
  };

  // Extract projectId from the board object for passing to columns
  const projectId = board?.project?._id || board?.project; // ✅ ADDED

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {localColumns.map((column) => (
          <KanbanColumn
            key={column._id}
            column={column}
            tasks={localTasks.filter(
              (t) => getColumnId(t.column) === column._id
            )}
            projectId={projectId} // ✅ ADDED — needed for CreateTaskModal assignees
          />
        ))}

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} isDragging={true} /> : null}
        </DragOverlay>
      </DndContext>

      {/* ✅ Add Column Button — now functional */}
      <button
        onClick={() => setShowAddColumn(true)}
        className="shrink-0 w-72 h-12 rounded-xl border-2 border-dashed
                   border-slate-300 text-slate-400 hover:border-indigo-400
                   hover:text-indigo-500 transition-all duration-200
                   flex items-center justify-center gap-2 self-start"
      >
        + Add Column
      </button>

      {/* ✅ Add Column Modal */}
      {showAddColumn && (
        <AddColumnModal
          boardId={board._id}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
}