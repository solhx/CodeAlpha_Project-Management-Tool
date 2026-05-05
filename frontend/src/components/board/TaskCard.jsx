//src/components/board/TaskCard.jsx
'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS }         from '@dnd-kit/utilities';
import { useState }    from 'react';
import TaskModal       from '../task/TaskModal';

const PRIORITY_CONFIG = {
  critical: { color: 'text-red-600   bg-red-50',    label: '🔴 Critical' },
  high:     { color: 'text-orange-600 bg-orange-50', label: '🟠 High'     },
  medium:   { color: 'text-yellow-600 bg-yellow-50', label: '🟡 Medium'   },
  low:      { color: 'text-green-600  bg-green-50',  label: '🟢 Low'      },
  none:     { color: 'text-gray-400   bg-gray-50',   label: 'None'        },
};

export default function TaskCard({ task, isDragging }) {
  const [showDetail, setShowDetail] = useState(false);

  const {
    attributes, listeners, setNodeRef,
    transform, transition,
    isDragging: isSortableDragging, // ← the ghost left behind in the column
  } = useSortable({ id: task._id });

  const style = {
    transform : CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'done';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => !isDragging && !isSortableDragging && setShowDetail(true)}
        className={`
          bg-white rounded-lg border p-3
          transition-all duration-150 group select-none
          ${isSortableDragging
            // ✅ Ghost card left in column while dragging — invisible placeholder
            ? 'opacity-0 border-dashed border-slate-300 shadow-none'
            : isDragging
              // ✅ The floating DragOverlay card — elevated & rotated
              ? 'border-indigo-400 shadow-2xl rotate-2 scale-105 cursor-grabbing opacity-100'
              // ✅ Normal resting state
              : 'border-slate-200 hover:border-indigo-300 hover:shadow-md shadow-sm cursor-grab'
          }
        `}
      >
        {/* Cover Color Bar */}
        {task.coverColor && (
          <div
            className="h-2 rounded-sm mb-2 -mx-3 -mt-3"
            style={{ backgroundColor: task.coverColor }}
          />
        )}

        {/* Labels */}
        {task.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map((label, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: label.color + '30',
                  color: label.color,
                }}
              >
                {label.text}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">
          {task.title}
        </p>

        {/* Priority Badge */}
        {task.priority && task.priority !== 'none' && (
          <span className={`
            text-xs px-1.5 py-0.5 rounded font-medium
            ${PRIORITY_CONFIG[task.priority]?.color}
          `}>
            {PRIORITY_CONFIG[task.priority]?.label}
          </span>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {/* Left: meta icons */}
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            {task.commentCount > 0 && (
              <span className="flex items-center gap-0.5">
                💬 {task.commentCount}
              </span>
            )}
            {task.checklist?.length > 0 && (
              <span className="flex items-center gap-0.5">
                ✅{' '}
                {task.checklist.filter((c) => c.isCompleted).length}
                /{task.checklist.length}
              </span>
            )}
            {task.attachments?.length > 0 && (
              <span>📎 {task.attachments.length}</span>
            )}
          </div>

          {/* Right: due date + assignees */}
          <div className="flex items-center gap-1">
            {task.dueDate && (
              <span className={`text-xs ${
                isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400'
              }`}>
                📅{' '}
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day  : 'numeric',
                })}
              </span>
            )}
            <div className="flex -space-x-1">
              {task.assignees?.slice(0, 3).map((user) => (
                <img
                  key={user._id}
                  src={
                    user.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=24`
                  }
                  alt={user.name}
                  title={user.name}
                  className="w-6 h-6 rounded-full border-2 border-white"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <TaskModal task={task} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}