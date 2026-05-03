// backend/src/validators/task.validator.js
import { body } from 'express-validator';

export const validateCreateTask = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1–200 characters'),
  body('boardId')
    .notEmpty().withMessage('boardId is required')
    .isMongoId().withMessage('Invalid boardId'),
  body('columnId')
    .notEmpty().withMessage('columnId is required')
    .isMongoId().withMessage('Invalid columnId'),
  body('projectId')
    .notEmpty().withMessage('projectId is required')
    .isMongoId().withMessage('Invalid projectId'),
  body('priority')
    .optional()
    .isIn(['critical', 'high', 'medium', 'low', 'none'])
    .withMessage('Invalid priority'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
];
