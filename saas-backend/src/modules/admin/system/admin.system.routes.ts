import { Router } from 'express';
import { AdminSystemController } from './admin.system.controller';
import { authenticateAdmin } from '../../../middleware/adminAuth';

const router = Router();

// Protect all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health and performance stats
 */
router.get('/health', AdminSystemController.getHealth);

/**
 * @route   GET /api/admin/system/logs
 * @desc    Get admin audit logs
 */
router.get('/logs', AdminSystemController.getAuditLogs);

export default router;
