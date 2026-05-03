import Comment   from '../models/Comment.model.js';
import { getIO } from '../config/socket.js';

export const registerCommentSocketHandlers = (socket) => {
  // ── Typing in comment box ──
  socket.on('typing:start', ({ taskId }) => {
    if (!taskId) return;
    socket.to(`task:${taskId}`).emit('typing:start', {
      user: {
        _id:    socket.user._id,
        name:   socket.user.name,
        avatar: socket.user.avatar,
      },
      taskId,
    });
  });

  socket.on('typing:stop', ({ taskId }) => {
    if (!taskId) return;
    socket.to(`task:${taskId}`).emit('typing:stop', {
      userId: socket.user._id,
      taskId,
    });
  });

  // ── Client requests latest comments for a task ──
  socket.on('comment:get-latest', async ({ taskId, limit = 10 }, callback) => {
    try {
      const comments = await Comment.find({ task: taskId, parentComment: null })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author', 'name avatar')
        .lean();

      callback?.({ comments: comments.reverse() });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // ── Broadcast new comment to task room ──
  socket.on('comment:broadcast', ({ taskId, comment }) => {
    if (!taskId || !comment) return;
    socket.to(`task:${taskId}`).emit('comment:new', { comment });
  });

  // ── Broadcast comment edit ──
  socket.on('comment:broadcast-update', ({ taskId, comment }) => {
    if (!taskId || !comment) return;
    socket.to(`task:${taskId}`).emit('comment:updated', { comment });
  });

  // ── Broadcast comment deletion ──
  socket.on('comment:broadcast-delete', ({ taskId, commentId }) => {
    if (!taskId || !commentId) return;
    socket.to(`task:${taskId}`).emit('comment:deleted', { commentId });
  });

  // ── Broadcast reaction toggle ──
  socket.on('comment:broadcast-reaction', ({ taskId, commentId, reactions }) => {
    if (!taskId) return;
    socket.to(`task:${taskId}`).emit('comment:reaction', {
      commentId,
      reactions,
    });
  });
};

// ── Server-side helpers (called from controllers) ──
export const emitCommentNew = (taskId, comment) =>
  getIO().to(`task:${taskId}`).emit('comment:new', { comment });

export const emitCommentUpdated = (taskId, comment) =>
  getIO().to(`task:${taskId}`).emit('comment:updated', { comment });

export const emitCommentDeleted = (taskId, commentId) =>
  getIO().to(`task:${taskId}`).emit('comment:deleted', { commentId });

export const emitCommentReaction = (taskId, commentId, reactions) =>
  getIO().to(`task:${taskId}`).emit('comment:reaction', { commentId, reactions });