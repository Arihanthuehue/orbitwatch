import { Router } from 'express';
import { login, getCurrentUser, getDemoAccounts } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJWT, getCurrentUser);
router.get('/demo-accounts', getDemoAccounts);

export default router;
