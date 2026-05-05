// backend/src/controllers/task.controller.js
import Task        from '../models/Task.model.js';
import Column      from '../models/Column.model.js';
import Comment     from '../models/Comment.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse }         from '../utils/ApiResponse.js';
import { ApiError }            from '../utils/ApiError.js';
import { asyncHandler }        from '../utils/asyncHandler.js';
import { getIO }               from '../config/socket.js';

// ── GET /api/v1/tasks ──────────────────────────────────────────────────────────
export const getTasks = asyncHandler(async (req, res) => {
  const {
    boardId, columnId, assignee, priority,
    search, page = 1, limit = 50,
  } = req.query;

  const filter = { isArchived: false };
  if (boardId)  filter.board     = boardId;
  if (columnId) filter.column    = columnId;
  if (assignee) filter.assignees = assignee;
  if (priority) filter.priority  = priority;
  if (search)   filter.$text     = { $search: search };

  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ order: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('assignees', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('column',    'title'),
    Task.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      tasks,
      pagination: {
        total,
        page : Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// ── POST /api/v1/tasks ─────────────────────────────────────────────────────────
export const createTask = asyncHandler(async (req, res) => {
  const {
    title, description, boardId, columnId, projectId,
    assignees, priority, dueDate, labels,
  } = req.body;

  const lastTask = await Task.findOne({ column: columnId }).sort({ order: -1 });
  const order    = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    title, description, priority, dueDate, labels,
    board    : boardId,
    column   : columnId,
    project  : projectId,
    assignees: assignees || [],
    createdBy: req.user._id,
    order,
  });

  await task.populate([
    { path: 'assignees', select: 'name avatar email' },
    { path: 'createdBy', select: 'name avatar' },
  ]);

  // ── Activity log ──
  await ActivityLog.create({
    actor  : req.user._id,
    action : 'created_task',
    target : { type: 'Task', id: task._id },
    project: projectId,
    detail : `Created task "${task.title}"`,
  });

  // ── Notify assignees ──
  if (assignees?.length) {
    await notificationService.notifyTaskAssignment(task, req.user, assignees);
  }

  // ── Real-time broadcast ──
  getIO().to(`board:${boardId}`).emit('task:created', { task });

  return res.status(201).json(new ApiResponse(201, { task }, 'Task created'));
});

// ── GET /api/v1/tasks/my-tasks ─────────────────────────────────────────────────
export const getMyTasks = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {
    assignees  : req.user._id,
    isArchived : false,
  };
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('project',   'name color icon')
      .populate('board',     'name')
      .populate('column',    'title')
      .populate('assignees', 'name avatar'),
    Task.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      tasks,
      pagination: {
        total,
        page : Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// ── GET /api/v1/tasks/:id ──────────────────────────────────────────────────────
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignees', 'name avatar email')
    .populate('createdBy', 'name avatar')
    .populate('column',    'title color')
    .populate('board',     'name')
    .populate('project',   'name color icon')
    .populate('watchers',  'name avatar');

  if (!task) throw new ApiError(404, 'Task not found');

  return res.status(200).json(new ApiResponse(200, { task }));
});

// ── PUT /api/v1/tasks/:id ──────────────────────────────────────────────────────
export const updateTask = asyncHandler(async (req, res) => {
  const { id }  = req.params;
  const updates = req.body;

  // Prevent mutation of protected fields
  const forbiddenFields = ['_id', 'createdBy', 'board', 'project'];
  forbiddenFields.forEach((f) => delete updates[f]);

  const task = await Task.findByIdAndUpdate(id, updates, {
    new           : true,
    runValidators : true,
  }).populate('assignees createdBy', 'name avatar email');

  if (!task) throw new ApiError(404, 'Task not found');

  // ── Activity log ──
  await ActivityLog.create({
    actor  : req.user._id,
    action : 'updated_task',
    target : { type: 'Task', id: task._id },
    project: task.project,
    detail : `Updated task "${task.title}"`,
  });

  // ── Notify new assignees ──
  if (updates.assignees) {
    await notificationService.notifyTaskAssignment(task, req.user, updates.assignees);
  }

  // ── Real-time broadcast ──
  getIO().to(`board:${task.board}`).emit('task:updated', { task });

  return res.status(200).json(new ApiResponse(200, { task }, 'Task updated'));
});

// ── DELETE /api/v1/tasks/:id ───────────────────────────────────────────────────
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  // ── Cascade delete all comments on this task ──
  await Comment.deleteMany({ task: req.params.id });

  // ── Activity log (before delete so data is available) ──
  await ActivityLog.create({
    actor  : req.user._id,
    action : 'deleted_task',
    target : { type: 'Task', id: task._id },
    project: task.project,
    detail : `Deleted task "${task.title}"`,
  });

  await Task.findByIdAndDelete(req.params.id);

  // ── Real-time broadcast ──
  getIO().to(`board:${task.board}`).emit('task:deleted', {
    taskId : req.params.id,
    boardId: task.board.toString(),
  });

  return res.status(200).json(new ApiResponse(200, {}, 'Task deleted'));
});

// ── PATCH /api/v1/tasks/:id/move ──────────────────────────────────────────────
export const moveTask = asyncHandler(async (req, res) => {
  const { id }                    = req.params;
  const { targetColumnId, order } = req.body;

  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, 'Task not found');

  const sourceColumnId = task.column.toString();
  task.column = targetColumnId;
  task.order  = order;

  // ── Auto-update status based on column title ──
  const targetColumn = await Column.findById(targetColumnId);
  const statusMap    = {
    'To Do'      : 'todo',
    'In Progress': 'in_progress',
    'Review'     : 'review',
    'Done'       : 'done',
  };
  if (targetColumn?.title && statusMap[targetColumn.title]) {
    task.status = statusMap[targetColumn.title];
  }

  await task.save();

  // ── Activity log ──
  await ActivityLog.create({
    actor  : req.user._id,
    action : 'moved_task',
    target : { type: 'Task', id: task._id },
    project: task.project,
    detail : `Moved task "${task.title}"`,
    meta   : { from: sourceColumnId, to: targetColumnId },
  });

  // ── Real-time broadcast ──
  getIO().to(`board:${task.board}`).emit('task:moved', {
    taskId        : id,
    targetColumnId,
    order,
    boardId       : task.board.toString(),
    movedBy       : req.user._id,
  });

  return res.status(200).json(new ApiResponse(200, { task }, 'Task moved'));
});

// ── PATCH /api/v1/tasks/:id/assign ────────────────────────────────────────────
export const assignTask = asyncHandler(async (req, res) => {
  const { assignees, add, remove } = req.body;

  // ── Support two modes ──
  // Mode 1: { assignees: [...] }          → full replace (used by TaskAssignee)
  // Mode 2: { add: [...], remove: [...] } → surgical update (safer for concurrency)
  let update;

  if (assignees !== undefined) {
    update = { $set: { assignees } };
  } else {
    update = {};
    if (add?.length)    update.$addToSet = { assignees: { $each: add } };
    if (remove?.length) update.$pull     = { assignees: { $in: remove } };
  }

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, runValidators: true }
  ).populate('assignees', 'name avatar email');

  if (!task) throw new ApiError(404, 'Task not found');

  // ── Notify newly added assignees ──
  const notifyIds = assignees || add || [];
  if (notifyIds.length) {
    await notificationService.notifyTaskAssignment(task, req.user, notifyIds);
  }

  // ── Activity log ──
  await ActivityLog.create({
    actor  : req.user._id,
    action : 'assigned_task',
    target : { type: 'Task', id: task._id },
    project: task.project,
    detail : `Updated assignees on "${task.title}"`,
  });

  // ── Real-time broadcast ──
  getIO().to(`board:${task.board}`).emit('task:updated', { task });

  return res.status(200).json(new ApiResponse(200, { task }, 'Task assigned'));
});

// ── PATCH /api/v1/tasks/:id/checklist ─────────────────────────────────────────
export const updateChecklist = asyncHandler(async (req, res) => {
  const { checklist } = req.body;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { checklist },
    { new: true }
  );

  if (!task) throw new ApiError(404, 'Task not found');

  // ── Real-time broadcast (lightweight — only send checklist delta) ──
  getIO().to(`board:${task.board}`).emit('task:updated', {
    task: { _id: task._id, checklist: task.checklist },
  });

  return res.status(200).json(new ApiResponse(200, { checklist: task.checklist }));
});