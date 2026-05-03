// backend/src/routes/board.routes.js
import express from 'express';
import {
  getBoards, getBoardById, createBoard,
  updateBoard, deleteBoard,
  createColumn, updateColumn, deleteColumn, reorderColumns,
} from '../controllers/board.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getBoards)
  .post(createBoard);

router.route('/:id')
  .get(getBoardById)
  .put(updateBoard)
  .delete(deleteBoard);

router.post('/:boardId/columns',                   createColumn);
router.put('/:boardId/columns/:columnId',          updateColumn);
router.delete('/:boardId/columns/:columnId',       deleteColumn);
router.patch('/:boardId/columns/reorder',          reorderColumns);

export default router;