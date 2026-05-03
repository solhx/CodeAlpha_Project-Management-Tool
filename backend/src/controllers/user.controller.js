// backend/src/controllers/user.controller.js
import User from '../models/User.model.js';
import { uploadAvatar, deleteFile } from '../services/upload.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import fs from 'fs';

// GET /api/v1/users/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return res.status(200).json(new ApiResponse(200, { user }));
});

// PATCH /api/v1/users/me
export const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'bio'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

// PATCH /api/v1/users/me/avatar
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const user = await User.findById(req.user._id);

  // Delete old avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteFile(user.avatar.publicId);
  }

  const uploaded = await uploadAvatar(req.file.path);

  // Clean up temp file
  fs.unlinkSync(req.file.path);

  user.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, { avatar: user.avatar }, 'Avatar updated'));
});

// PATCH /api/v1/users/me/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});

// GET /api/v1/users/search?q=
export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    throw new ApiError(400, 'Search query must be at least 2 characters');
  }

  const users = await User.find({
    $or: [
      { name:  { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user._id },
  })
    .select('name email avatar')
    .limit(10);

  return res.status(200).json(new ApiResponse(200, { users }));
});