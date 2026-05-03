// frontend/src/hooks/useDragDrop.js
import { useState, useCallback } from 'react';
import { useMoveTaskMutation }   from '@/store/api/taskApi';
import { useDispatch }           from 'react-redux';
import { moveTaskLocally }       from '@/store/slices/boardSlice';

export const useDragDrop = (tasks, setTasks) => {
  const [activeId,    setActiveId]    = useState(null);
  const [activeTask,  setActiveTask]  = useState(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const [moveTask]                    = useMoveTaskMutation();
  const dispatch                      = useDispatch();

  const findContainer = useCallback((id) => {
    const task = tasks.find((t) => t._id === id);
    return task?.column || id;
  }, [tasks]);

  const handleDragStart = useCallback(({ active }) => {
    const task = tasks.find((t) => t._id === active.id);
    setActiveId(active.id);
    setActiveTask(task || null);
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  }, [tasks]);

  const handleDragOver = useCallback(({ active, over }) => {
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer   = findContainer(over.id);

    if (activeContainer === overContainer) return;

    // Optimistic update
    setTasks?.((prev) =>
      prev.map((t) =>
        t._id === active.id ? { ...t, column: overContainer } : t
      )
    );
  }, [findContainer, setTasks]);

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setIsDragging(false);
    setActiveId(null);
    setActiveTask(null);
    document.body.style.cursor = '';

    if (!over || active.id === over.id) return;

    const targetColumn    = findContainer(over.id);
    const tasksInTarget   = tasks.filter((t) => t.column === targetColumn);
    const overIndex       = tasksInTarget.findIndex((t) => t._id === over.id);
    const newOrder        = overIndex >= 0 ? overIndex : tasksInTarget.length;

    // Dispatch local update for instant UI
    dispatch(moveTaskLocally({
      taskId:        active.id,
      targetColumnId: targetColumn,
      order:         newOrder,
    }));

    try {
      await moveTask({
        taskId:        active.id,
        targetColumnId: targetColumn,
        order:         newOrder,
      }).unwrap();
    } catch (err) {
      console.error('Move task failed, reverting...', err);
      // Revert — invalidate to refetch
      setTasks?.(tasks);
    }
  }, [findContainer, tasks, dispatch, moveTask, setTasks]);

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setActiveId(null);
    setActiveTask(null);
    document.body.style.cursor = '';
  }, []);

  return {
    activeId,
    activeTask,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};