import { Router } from 'express';
import { AdminAuthController } from './admin.auth.controller';
import { authenticateAdmin } from '../../../middleware/adminAuth';

const router = Router();

/**
 * @route   POST /api/admin/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', AdminAuthController.login);

/**
 * @route   GET /api/admin/auth/me
 * @desc    Get current admin profile
 * @access  Private (Admin)
 */
router.get('/me', authenticateAdmin, AdminAuthController.getProfile);

export default router;
