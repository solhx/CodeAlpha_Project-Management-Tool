// backend/src/routes/auth.routes.js
import express from 'express';
import {
  register, login, logout,
  refreshToken, forgotPassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = express.Router();

router.post('/register',      validateRegister, validate, register);
router.post('/login',         validateLogin,    validate, login);
router.post('/logout',        protect,                    logout);
router.post('/refresh-token',                             refreshToken);
router.post('/forgot-password',                           forgotPassword);

export default router;