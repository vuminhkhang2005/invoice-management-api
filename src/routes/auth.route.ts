import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AuthController();

// 1. Get pre-signed demo tokens for each role
router.get('/demo-accounts', controller.getDemoAccounts);

// 2. Login to get JWT Bearer token
router.post('/login', controller.login);

// 3. Get current authenticated user profile
router.get('/me', authenticate(true), controller.getProfile);

export default router;
