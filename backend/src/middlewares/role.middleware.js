//src/middlewares/role.middleware.js
import Project from '../models/Project.model.js';
import { ApiError }    from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── Role Hierarchy ─────────────────────────────────────────────────────────────
const HIERARCHY = { owner: 4, admin: 3, member: 2, viewer: 1 };

// ── SYSTEM ROLE GUARD ──────────────────────────────────────────────────────────
// Checks req.user.role (global role: 'admin' | 'user')
// Usage: requireRole('admin')
export const requireRole = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }
    next();
  };

// ── PROJECT ROLE GUARD ─────────────────────────────────────────────────────────
// Checks the user's role within a specific project using hierarchy.
// Usage: requireProjectRole('admin')        → admin OR owner can pass
//        requireProjectRole('member')       → member, admin, or owner can pass
//        requireProjectRole('admin','owner') → same as requireProjectRole('admin')
export const requireProjectRole = (...projectRoles) =>
  asyncHandler(async (req, res, next) => {
    const projectId =
      req.params.id        ||
      req.params.projectId ||
      req.body.projectId   ||
      req.query.projectId;

    if (!projectId) {
      throw new ApiError(400, 'Project ID is required');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Owner always has full access
    const isOwner =
      project.owner.toString() === req.user._id.toString();

    const member = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    const userRole = isOwner ? 'owner' : member?.role;

    if (!userRole) {
      throw new ApiError(403, 'You are not a member of this project');
    }

    // Resolve the minimum hierarchy level required
    const minRequired = Math.min(
      ...projectRoles.map((r) => HIERARCHY[r] || 0)
    );

    if ((HIERARCHY[userRole] || 0) < minRequired) {
      throw new ApiError(
        403,
        `Insufficient project permissions. Required: ${projectRoles.join(' or ')}`
      );
    }

    // Attach to request for downstream use
    req.project     = project;
    req.projectRole = userRole;
    next();
  });

// ── OWNERSHIP GUARD ────────────────────────────────────────────────────────────
// Ensures the requesting user created/owns the resource.
// System admins bypass this check.
// Usage: requireOwnership(Task) or requireOwnership(Comment, 'commentId')
export const requireOwnership = (Model, idParam = 'id') =>
  asyncHandler(async (req, res, next) => {
    const resourceId = req.params[idParam];
    const resource   = await Model.findById(resourceId);

    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }

    const ownerId =
      resource.createdBy?.toString() ||
      resource.author?.toString()    ||
      resource.owner?.toString();

    const isOwner = ownerId === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'You do not own this resource');
    }

    req.resource = resource;
    next();
  });

// ── ADMIN ONLY GUARD ───────────────────────────────────────────────────────────
// Shorthand for system-level admin operations.
export const adminOnly = (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin access only');
  }
  next();
};

// ── PROJECT MEMBERSHIP CHECK ───────────────────────────────────────────────────
// Passes for any member regardless of role (owner, admin, member, viewer).
// Silently skips if no projectId is available in the request context.
export const requireProjectMembership = asyncHandler(
  async (req, res, next) => {
    const projectId =
      req.params.projectId ||
      req.body.projectId   ||
      req.query.projectId;

    // No project context — skip (used on routes where project is optional)
    if (!projectId) return next();

    const project = await Project.findById(projectId).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      throw new ApiError(403, 'You are not a member of this project');
    }

    next();
  }
);