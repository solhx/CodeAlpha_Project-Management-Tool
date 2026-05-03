// backend/src/routes/project.routes.js
import express from 'express';
import {
  getProjects, getProjectById, createProject,
  updateProject, deleteProject, inviteMember,
  updateMemberRole, removeMember, getProjectActivity,
} from '../controllers/project.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/invite',               inviteMember);
router.patch('/:id/members/:userId',     updateMemberRole);
router.delete('/:id/members/:userId',    removeMember);
router.get('/:id/activity',             getProjectActivity);

export default router;
