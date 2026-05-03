// backend/src/routes/user.routes.js
import express from 'express';
import {
  getMe, updateMe, updateAvatar,
  changePassword, searchUsers,
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.use(protect);
router.get('/me',              getMe);
router.patch('/me',            updateMe);
router.patch('/me/avatar',     upload.single('avatar'), updateAvatar);
router.patch('/me/password',   changePassword);
router.get('/search',          searchUsers);

export default router;
