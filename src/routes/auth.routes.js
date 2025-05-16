import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator, updateUserValidator } from '../middleware/validators/auth.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { loginAttemptLimiter } from '../middleware/rateLimit.db.js';

const router = Router();

// Rutas públicas
router.post('/login', loginValidator, loginAttemptLimiter, login);

export default router; 