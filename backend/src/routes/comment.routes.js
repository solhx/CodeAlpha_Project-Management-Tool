// backend/src/routes/comment.routes.js
import express from 'express';
import {
  getComments, createComment, updateComment,
  deleteComment, toggleReaction,
} from '../controllers/comment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getComments)
  .post(createComment);

router.route('/:id')
  .put(updateComment)
  .delete(deleteComment);

router.post('/:id/reactions', toggleReaction);

export default router;
