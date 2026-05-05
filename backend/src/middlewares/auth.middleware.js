// backend/src/middlewares/auth.middleware.js
import jwt  from 'jsonwebtoken';
import User from '../models/User.model.js';
import { ApiError }    from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── JWT Protect ────────────────────────────────────────────────────────────────
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw new ApiError(401, 'Authentication required');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) throw new ApiError(401, 'User no longer exists');
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Token is invalid or expired');
  }
});

// ── System Role Guard ──────────────────────────────────────────────────────────
// Usage: authorize('admin') or authorize('admin', 'moderator')
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };

