// backend/src/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../services/email.service.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/v1/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(201).json(
    new ApiResponse(201, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
    }, 'Registration successful')
  );
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  user.lastActive = Date.now();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
    }, 'Login successful')
  );
});

// POST /api/v1/auth/refresh-token
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token missing');

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(200, { accessToken }, 'Token refreshed')
  );
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.clearCookie('refreshToken');
  return res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {}, 'If that email exists, a reset link was sent.')
    );
  }

  const resetToken   = crypto.randomBytes(32).toString('hex');
  const hashedToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  user.passwordResetToken   = hashedToken;
  user.passwordResetExpires = resetExpires;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to:           user.email,
    templateName: 'passwordReset',
    templateData: { resetUrl },
  });

  return res.status(200).json(
    new ApiResponse(200, {}, 'Password reset email sent')
  );
});

// PATCH /api/v1/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token }       = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, 'Token is invalid or has expired');

  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken         = undefined;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, 'Password reset successful. Please log in.')
  );
});