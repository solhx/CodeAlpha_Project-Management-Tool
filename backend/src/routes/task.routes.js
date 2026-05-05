// backend/src/routes/task.routes.js
import express from 'express';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
  assignTask,
  updateChecklist,
  getMyTasks,
} from '../controllers/task.controller.js';
import { protect }  from '../middlewares/auth.middleware.js';
import { requireProjectMembership } from '../middlewares/role.middleware.js';

const router = express.Router();

// ── All task routes require authentication ─────────────────────────────────────
router.use(protect);

// ── Special routes (must come BEFORE /:id to avoid param collision) ───────────
router.get('/my-tasks', getMyTasks);

// ── Collection routes ──────────────────────────────────────────────────────────
router.route('/')
  .get(requireProjectMembership, getTasks)
  .post(requireProjectMembership, createTask);

// ── Single task routes ─────────────────────────────────────────────────────────
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// ── Task action routes ─────────────────────────────────────────────────────────
router.patch('/:id/move',      moveTask);
router.patch('/:id/assign',    assignTask);
router.patch('/:id/checklist', updateChecklist);

export default router;