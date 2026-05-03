// backend/src/controllers/notification.controller.js
import Notification from '../models/Notification.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/v1/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [notifications, total, unread] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('sender', 'name avatar'),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unread,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// PATCH /api/v1/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  return res.status(200).json(new ApiResponse(200, { notification }));
});

// PATCH /api/v1/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

// DELETE /api/v1/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });
  return res.status(200).json(new ApiResponse(200, {}, 'Notification deleted'));
});

// GET /api/v1/notifications/count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });
  return res.status(200).json(new ApiResponse(200, { count }));
});