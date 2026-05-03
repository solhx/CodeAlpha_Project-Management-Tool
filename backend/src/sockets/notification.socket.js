import Notification from '../models/Notification.model.js';
import { getIO }    from '../config/socket.js';

export const registerNotificationSocketHandlers = (socket) => {
  // ── Mark notification read via socket ──
  socket.on('notification:mark-read', async ({ notificationId }, callback) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: socket.user._id },
        { isRead: true }
      );
      callback?.({ success: true });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // ── Mark all notifications read via socket ──
  socket.on('notification:mark-all-read', async (callback) => {
    try {
      await Notification.updateMany(
        { recipient: socket.user._id, isRead: false },
        { isRead: true }
      );
      // Confirm back to sender
      socket.emit('notification:all-read');
      callback?.({ success: true });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // ── Get unread notification count ──
  socket.on('notification:get-count', async (callback) => {
    try {
      const count = await Notification.countDocuments({
        recipient: socket.user._id,
        isRead:    false,
      });
      callback?.({ count });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // ── Get recent notifications ──
  socket.on('notification:get-recent', async ({ limit = 10 } = {}, callback) => {
    try {
      const notifications = await Notification.find({
        recipient: socket.user._id,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'name avatar')
        .lean();

      callback?.({ notifications });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });
};

// ── Server-side helpers (called from notificationService) ──
export const emitNotificationToUser = (userId, notification) => {
  getIO()
    .to(`user:${userId}`)
    .emit('notification:new', { notification });
};

export const emitUnreadCountToUser = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead:    false,
    });
    getIO()
      .to(`user:${userId}`)
      .emit('notification:count-update', { count });
  } catch (err) {
    console.error('emitUnreadCount failed:', err.message);
  }
};

export const emitNotificationReadToUser = (userId, notificationId) => {
  getIO()
    .to(`user:${userId}`)
    .emit('notification:read', { notificationId });
};

export const emitAllNotificationsReadToUser = (userId) => {
  getIO()
    .to(`user:${userId}`)
    .emit('notification:all-read');
};