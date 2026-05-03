// backend/src/controllers/comment.controller.js
import Comment from '../models/Comment.model.js';
import Task from '../models/Task.model.js';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIO } from '../config/socket.js';

// GET /api/v1/comments?taskId=
export const getComments = asyncHandler(async (req, res) => {
  const { taskId, page = 1, limit = 50 } = req.query;
  if (!taskId) throw new ApiError(400, 'taskId is required');

  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    Comment.find({ task: taskId, parentComment: null })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'name avatar email')
      .populate({
        path: 'parentComment',
        populate: { path: 'author', select: 'name avatar' },
      }),
    Comment.countDocuments({ task: taskId }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      comments,
      pagination: { total, page: Number(page), limit: Number(limit) },
    })
  );
});

// POST /api/v1/comments
export const createComment = asyncHandler(async (req, res) => {
  const { taskId, content, parentComment, mentions } = req.body;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  const comment = await Comment.create({
    content,
    task: taskId,
    author: req.user._id,
    parentComment: parentComment || null,
    mentions: mentions || [],
  });

  await comment.populate('author', 'name avatar');

  // Real-time broadcast
  getIO().to(`task:${taskId}`).emit('comment:new', { comment });

  // Notifications
  await notificationService.notifyComment(comment, task, req.user);

  // Notify mentions
  if (mentions?.length) {
    await Promise.all(
      mentions.map((userId) =>
        notificationService.notifyMention(userId, req.user, task)
      )
    );
  }

  return res.status(201).json(new ApiResponse(201, { comment }, 'Comment added'));
});

// PUT /api/v1/comments/:id
export const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findOne({
    _id: req.params.id,
    author: req.user._id,
  });
  if (!comment) throw new ApiError(404, 'Comment not found or unauthorized');

  comment.content = content;
  comment.isEdited = true;
  await comment.save();
  await comment.populate('author', 'name avatar');

  getIO().to(`task:${comment.task}`).emit('comment:updated', { comment });

  return res.status(200).json(new ApiResponse(200, { comment }));
});

// DELETE /api/v1/comments/:id
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.params.id,
    author: req.user._id,
  });
  if (!comment) throw new ApiError(404, 'Comment not found or unauthorized');

  const taskId = comment.task;
  await Comment.findByIdAndDelete(req.params.id);

  getIO().to(`task:${taskId}`).emit('comment:deleted', { commentId: req.params.id });

  return res.status(200).json(new ApiResponse(200, {}, 'Comment deleted'));
});

// POST /api/v1/comments/:id/reactions
export const toggleReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const reactionIndex = comment.reactions.findIndex((r) => r.emoji === emoji);

  if (reactionIndex === -1) {
    comment.reactions.push({ emoji, users: [req.user._id] });
  } else {
    const userIndex = comment.reactions[reactionIndex].users
      .findIndex((u) => u.toString() === req.user._id.toString());

    if (userIndex === -1) {
      comment.reactions[reactionIndex].users.push(req.user._id);
    } else {
      comment.reactions[reactionIndex].users.splice(userIndex, 1);
      if (comment.reactions[reactionIndex].users.length === 0) {
        comment.reactions.splice(reactionIndex, 1);
      }
    }
  }

  await comment.save();
  getIO().to(`task:${comment.task}`).emit('comment:reaction', {
    commentId: comment._id,
    reactions: comment.reactions,
  });

  return res.status(200).json(new ApiResponse(200, { reactions: comment.reactions }));
});