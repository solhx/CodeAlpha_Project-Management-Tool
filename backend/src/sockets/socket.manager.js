import { getIO } from '../config/socket.js';
import { registerTaskSocketHandlers }         from './task.socket.js';
import { registerCommentSocketHandlers }      from './comment.socket.js';
import { registerNotificationSocketHandlers } from './notification.socket.js';

// ── Active users map: userId → Set of socketIds ──
const activeUsers = new Map();

export const registerSocketHandlers = (socket) => {
  const userId = socket.user._id.toString();

  // ── Track active user ──
  if (!activeUsers.has(userId)) {
    activeUsers.set(userId, new Set());
  }
  activeUsers.get(userId).add(socket.id);

  // ── Register domain handlers ──
  registerTaskSocketHandlers(socket);
  registerCommentSocketHandlers(socket);
  registerNotificationSocketHandlers(socket);

  // ── Room joins ──
  socket.on('join:project', (projectId) => {
    if (!projectId) return;
    socket.join(`project:${projectId}`);

    socket.to(`project:${projectId}`).emit('member:online', {
      user: {
        _id:    socket.user._id,
        name:   socket.user.name,
        avatar: socket.user.avatar,
      },
    });
  });

  socket.on('leave:project', (projectId) => {
    if (!projectId) return;
    socket.leave(`project:${projectId}`);
    socket.to(`project:${projectId}`).emit('member:offline', {
      userId: socket.user._id,
    });
  });

  socket.on('join:board',  (boardId) => boardId && socket.join(`board:${boardId}`));
  socket.on('leave:board', (boardId) => boardId && socket.leave(`board:${boardId}`));
  socket.on('join:task',   (taskId)  => taskId  && socket.join(`task:${taskId}`));
  socket.on('leave:task',  (taskId)  => taskId  && socket.leave(`task:${taskId}`));

  // ── Get online members in a project ──
  socket.on('project:online-members', (projectId, callback) => {
    if (typeof callback !== 'function') return;
    const room    = getIO().sockets.adapter.rooms.get(`project:${projectId}`);
    const members = room ? [...room] : [];
    callback({ count: members.length, socketIds: members });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    // Remove socket from active users
    activeUsers.get(userId)?.delete(socket.id);
    if (activeUsers.get(userId)?.size === 0) {
      activeUsers.delete(userId);
    }

    // Notify all project rooms
    socket.rooms.forEach((room) => {
      if (room.startsWith('project:')) {
        socket.to(room).emit('member:offline', {
          userId: socket.user._id,
        });
      }
    });
  });

  // ── Error ──
  socket.on('error', (err) => {
    console.error(`[Socket Error] ${socket.user.name}:`, err.message);
  });
};

// ── Utility: Check if a user is online ──
export const isUserOnline = (userId) =>
  activeUsers.has(userId.toString()) &&
  activeUsers.get(userId.toString()).size > 0;

// ── Utility: Get all online user IDs ──
export const getOnlineUserIds = () => [...activeUsers.keys()];

// ── Utility: Get online count ──
export const getOnlineCount = () => activeUsers.size;