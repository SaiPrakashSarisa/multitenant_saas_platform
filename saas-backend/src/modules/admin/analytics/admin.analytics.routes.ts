import { Router } from 'express';
import { AdminAnalyticsController } from './admin.analytics.controller';
import { authenticateAdmin } from '../../../middleware/adminAuth';

const router = Router();

// Protect all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get dashboard overview stats
 */
router.get('/overview', AdminAnalyticsController.getOverview);

/**
 * @route   GET /api/admin/analytics/growth
 * @desc    Get tenant growth trend
 */
router.get('/growth', AdminAnalyticsController.getGrowth);

/**
 * @route   GET /api/admin/analytics/plans
 * @desc    Get plan distribution
 */
router.get('/plans', AdminAnalyticsController.getPlanDistribution);

export default router;
