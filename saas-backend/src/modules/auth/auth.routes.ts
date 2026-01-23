import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new tenant with owner user
 * @access  Public
 */
router.post('/register', AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info with permissions
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;
