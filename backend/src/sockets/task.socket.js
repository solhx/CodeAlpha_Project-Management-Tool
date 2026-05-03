//backend/src/sockets/task.socket.js
import Task         from '../models/Task.model.js';
import ActivityLog  from '../models/ActivityLog.model.js';
import { getIO }    from '../config/socket.js';

export const registerTaskSocketHandlers = (socket) => {
  // ── Client requests a live task update ──
  socket.on('task:request-update', async ({ taskId }, callback) => {
    try {
      const task = await Task.findById(taskId)
        .populate('assignees',  'name avatar')
        .populate('createdBy',  'name avatar')
        .populate('column',     'title')
        .lean();

      if (!task) {
        return callback?.({ error: 'Task not found' });
      }
      callback?.({ task });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // ── Broadcast task update to board room ──
  socket.on('task:broadcast-update', ({ boardId, task }) => {
    if (!boardId || !task) return;
    socket.to(`board:${boardId}`).emit('task:updated', { task });
  });

  // ── Broadcast task move ──
  socket.on('task:broadcast-move', ({ boardId, taskId, targetColumnId, order }) => {
    if (!boardId) return;
    socket.to(`board:${boardId}`).emit('task:moved', {
      taskId,
      targetColumnId,
      order,
      movedBy: {
        _id:  socket.user._id,
        name: socket.user.name,
      },
    });
  });

  // ── Subscribe to a specific task's updates ──
  socket.on('task:subscribe', (taskId) => {
    if (taskId) socket.join(`task:${taskId}`);
  });

  socket.on('task:unsubscribe', (taskId) => {
    if (taskId) socket.leave(`task:${taskId}`);
  });

  // ── Emit task activity log entry ──
  socket.on('task:log-activity', async ({ taskId, action, detail, projectId }) => {
    try {
      await ActivityLog.create({
        actor:  socket.user._id,
        action,
        target: { type: 'Task', id: taskId },
        project: projectId,
        detail,
      });
    } catch (err) {
      console.error('Activity log failed:', err.message);
    }
  });
};

// ── Server-side helpers (called from controllers) ──
export const emitTaskCreated = (boardId, task) =>
  getIO().to(`board:${boardId}`).emit('task:created', { task });

export const emitTaskUpdated = (boardId, task) =>
  getIO().to(`board:${boardId}`).emit('task:updated', { task });

export const emitTaskDeleted = (boardId, taskId) =>
  getIO().to(`board:${boardId}`).emit('task:deleted', { taskId });

export const emitTaskMoved = (boardId, payload) =>
  getIO().to(`board:${boardId}`).emit('task:moved', payload);