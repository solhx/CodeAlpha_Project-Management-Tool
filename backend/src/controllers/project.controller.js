// backend/src/controllers/project.controller.js
import Project     from '../models/Project.model.js';
import Board       from '../models/Board.model.js';
import Column      from '../models/Column.model.js';
import Task        from '../models/Task.model.js';
import User        from '../models/User.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse }  from '../utils/ApiResponse.js';
import { ApiError }     from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];

// GET /api/v1/projects
export const getProjects = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const skip = (page - 1) * limit;

  

  const accessCondition = {
    $or: [
      { owner            : req.user._id },
      { 'members.user'   : req.user._id },
    ],
  };

  // Build the final filter
  let filter;

  if (search && search.trim().length >= 2) {
    // ✅ Use regex search — works immediately without index warmup,
    // case-insensitive, partial match (so "web" matches "website project")
    const searchRegex = { $regex: search.trim(), $options: 'i' };

    filter = {
      $and: [
        accessCondition,
        {
          $or: [
            { name        : searchRegex },
            { description : searchRegex },
            { tags        : searchRegex },
          ],
        },
      ],
    };
  } else {
    // No search — just access condition
    filter = accessCondition;
  }

  // Status filter (works with both search and non-search)
  if (status) filter.status = status;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('owner',          'name avatar')
      .populate('members.user',   'name avatar email'),
    Project.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      projects,
      pagination: {
        total,
        page  : Number(page),
        limit : Number(limit),
        pages : Math.ceil(total / limit),
      },
    })
  );
});

// GET /api/v1/projects/:id
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner',          'name email avatar')
    .populate('members.user',   'name email avatar');

  if (!project) throw new ApiError(404, 'Project not found');

  // Optional: check membership before returning
  const isOwner = project.owner._id.toString() === req.user._id.toString();
  const isMember = project.members.some(
    (m) => m.user._id.toString() === req.user._id.toString()
  );

  if (!isOwner && !isMember && project.isPrivate) {
    throw new ApiError(403, 'You do not have access to this project');
  }

  return res.status(200).json(new ApiResponse(200, { project }));
});
// POST /api/v1/projects
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, color, icon, isPrivate, dueDate, tags } = req.body;

  const project = await Project.create({
    name, description, color, icon, isPrivate, dueDate, tags,
    owner   : req.user._id,
    members : [{ user: req.user._id, role: 'owner' }],
  });

  // Create default board with default columns
  const board = await Board.create({
    name      : 'Main Board',
    project   : project._id,
    createdBy : req.user._id,
  });

  const columnDocs = await Column.insertMany(
    DEFAULT_COLUMNS.map((title, index) => ({
      title,
      board : board._id,
      order : index,
    }))
  );

  await ActivityLog.create({
    actor   : req.user._id,
    action  : 'created_project',
    target  : { type: 'Project', id: project._id },
    project : project._id,
    detail  : `Created project "${project.name}"`,
  });

  await project.populate('owner', 'name avatar');

  return res.status(201).json(
    new ApiResponse(201, { project, board, columns: columnDocs }, 'Project created')
  );
});

// PUT /api/v1/projects/:id
export const updateProject = asyncHandler(async (req, res) => {
  const forbiddenFields = ['owner', 'members', '_id'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new            : true,
    runValidators  : true,
  })
    .populate('owner',        'name avatar')
    .populate('members.user', 'name avatar email');

  if (!project) throw new ApiError(404, 'Project not found');

  return res.status(200).json(new ApiResponse(200, { project }, 'Project updated'));
});

// DELETE /api/v1/projects/:id
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the project owner can delete it');
  }

  // Cascade delete: boards → columns → tasks
  const boards    = await Board.find({ project: req.params.id });
  const boardIds  = boards.map((b) => b._id);

  await Promise.all([
    Task.deleteMany({ board: { $in: boardIds } }),
    Column.deleteMany({ board: { $in: boardIds } }),
    Board.deleteMany({ project: req.params.id }),
    Project.findByIdAndDelete(req.params.id),
  ]);

  return res.status(200).json(new ApiResponse(200, {}, 'Project deleted'));
});

// POST /api/v1/projects/:id/invite
export const inviteMember = asyncHandler(async (req, res) => {
  const { email, role = 'member' } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  const userToInvite = await User.findOne({ email });
  if (!userToInvite) throw new ApiError(404, 'User not found with this email');

  const alreadyMember = project.members.some(
    (m) => m.user.toString() === userToInvite._id.toString()
  );
  if (alreadyMember) throw new ApiError(409, 'User is already a member');

  project.members.push({ user: userToInvite._id, role });
  await project.save();

  await notificationService.notifyProjectInvite(userToInvite._id, req.user, project);

  await ActivityLog.create({
    actor   : req.user._id,
    action  : 'invited_member',
    target  : { type: 'Project', id: project._id },
    project : project._id,
    detail  : `Invited ${userToInvite.name} to the project`,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, `${userToInvite.name} added to project`)
  );
});

// PATCH /api/v1/projects/:id/members/:userId
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  const member = project.members.find(
    (m) => m.user.toString() === req.params.userId
  );
  if (!member) throw new ApiError(404, 'Member not found in this project');

  member.role = role;
  await project.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Member role updated'));
});

// DELETE /api/v1/projects/:id/members/:userId
export const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.owner.toString() === req.params.userId) {
    throw new ApiError(400, 'Cannot remove project owner');
  }

  project.members = project.members.filter(
    (m) => m.user.toString() !== req.params.userId
  );
  await project.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Member removed'));
});

// GET /api/v1/projects/:id/activity
export const getProjectActivity = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find({ project: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('actor', 'name avatar'),
    ActivityLog.countDocuments({ project: req.params.id }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      logs,
      pagination: { total, page: Number(page), limit: Number(limit) },
    })
  );
});