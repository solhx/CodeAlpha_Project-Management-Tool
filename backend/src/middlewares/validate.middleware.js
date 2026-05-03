
// backend/src/middlewares/validate.middleware.js
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    throw new ApiError(422, messages, errors.array());
  }
  next();
};