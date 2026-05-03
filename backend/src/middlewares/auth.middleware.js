// backend/src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw new ApiError(401, 'Authentication required');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new ApiError(401, 'User no longer exists');
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Token is invalid or expired');
  }
});

// Role-based access
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };

// Project-level role check
export const requireProjectRole = (...projectRoles) =>
  asyncHandler(async (req, res, next) => {
    const Project = (await import('../models/Project.model.js')).default;
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    const project = await Project.findById(projectId);

    if (!project) throw new ApiError(404, 'Project not found');

    const member = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isOwner && (!member || !projectRoles.includes(member.role))) {
      throw new ApiError(403, 'Insufficient project permissions');
    }

    req.project = project;
    req.projectRole = isOwner ? 'owner' : member.role;
    next();
  });