// backend/src/routes/task.routes.js
import express from 'express';
import {
  getTasks, createTask, getTaskById,
  updateTask, deleteTask, moveTask,
  assignTask, updateChecklist,
} from '../controllers/task.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import { getMyTasks } from '../controllers/task.controller.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
router.use(protect);

router.get('/my-tasks',           getMyTasks);
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/move',         moveTask);
router.patch('/:id/assign',       assignTask);
router.patch('/:id/checklist',    updateChecklist);

export default router;