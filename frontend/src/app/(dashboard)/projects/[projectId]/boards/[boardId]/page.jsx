// frontend/src/app/(dashboard)/projects/[projectId]/boards/[boardId]/page.jsx
'use client';
import { useEffect } from 'react';
import { useGetBoardByIdQuery } from '@/store/api/boardApi';
import { useSocket } from '@/hooks/useSocket';
import KanbanBoard from '@/components/board/KanbanBoard';
import Spinner from '@/components/ui/Spinner';

export default function BoardPage({ params }) {
  const { boardId } = params;
  const { joinBoard, leaveBoard } = useSocket();
  const { data, isLoading, error } = useGetBoardByIdQuery(boardId);

  useEffect(() => {
    joinBoard(boardId);
    return () => leaveBoard(boardId);
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-2">❌</p>
          <p className="text-slate-500">Failed to load board</p>
        </div>
      </div>
    );
  }

  const { board, columns, tasks } = data?.data || {};

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Board Header */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white"
        style={{ backgroundColor: board?.background || '#f8fafc' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800">{board?.name}</h1>
          <span className="text-sm text-slate-400">{tasks?.length || 0} tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm py-1.5 px-3">
            🔍 Filter
          </button>
          <button className="btn-secondary text-sm py-1.5 px-3">
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard
          board={board}
          columns={columns || []}
          tasks={tasks || []}
        />
      </div>
    </div>
  );
}