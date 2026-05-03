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
import KanbanColumn from './KanbanColumn';
import TaskCard     from './TaskCard';
import { useMoveTaskMutation } from '@/store/api/taskApi';

const getColumnId = (column) => {
  if (!column) return null;
  if (typeof column === 'string') return column;
  return column._id?.toString() ?? column.toString();
};

export default function KanbanBoard({ board, columns, tasks }) {
  const [activeTask,    setActiveTask   ] = useState(null);
  const [localColumns,  setLocalColumns ] = useState(columns);
  const [localTasks,    setLocalTasks   ] = useState(tasks);
  const [moveTask] = useMoveTaskMutation();

  // ✅ FIX: Sync localColumns when the board refetches (e.g. new column added)
  // Without this, column changes from the server are never reflected locally.
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // ✅ FIX: This is the PRIMARY fix for Issue 3 — "task requires page reload".
  //
  // PROBLEM: useState(tasks) only runs on first render. When createTask fires:
  //   1. RTK Query invalidates the board cache
  //   2. getBoardByIdQuery refetches → BoardPage receives new `tasks` prop
  //   3. KanbanBoard receives new `tasks` prop
  //   4. BUT localTasks is still the OLD useState value — it NEVER syncs!
  //
  // FIX: useEffect watches `tasks` prop and syncs localTasks whenever it changes.
  //
  // GUARD: Skip sync while dragging (activeTask !== null) — if the server responds
  // during a drag, we don't want to overwrite the optimistic column assignment and
  // cause the dragged card to jump back to its original column mid-gesture.
  useEffect(() => {
    if (!activeTask) {
      setLocalTasks(tasks);
    }
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: activeTask intentionally omitted from deps — we only want this to fire
  // when `tasks` changes, not when drag starts/ends.

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

    // Optimistically move task to new column in local state
    setLocalTasks((prev) =>
      prev.map((t) =>
        t._id === active.id ? { ...t, column: overContainer } : t
      )
    );
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null); // ✅ Clears drag guard — next tasks prop change will sync

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
      // ✅ On success, localTasks is already correct (set optimistically in handleDragOver).
      // The board will also refetch via moveTask's onQueryStarted invalidation,
      // and the useEffect above will sync once activeTask is null.
    } catch (err) {
      // ✅ On failure, revert to last known server state
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
          />
        ))}

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} isDragging={true} /> : null}
        </DragOverlay>
      </DndContext>

      <button className="shrink-0 w-72 h-12 rounded-xl border-2 border-dashed
                         border-slate-300 text-slate-400 hover:border-indigo-400
                         hover:text-indigo-500 transition-all duration-200
                         flex items-center justify-center gap-2">
        + Add Column
      </button>
    </div>
  );
}