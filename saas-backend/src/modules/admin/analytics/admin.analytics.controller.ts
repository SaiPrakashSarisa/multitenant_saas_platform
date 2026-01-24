import { Request, Response, NextFunction } from 'express';
import { AdminAnalyticsService } from './admin.analytics.service';

export class AdminAnalyticsController {
  /**
   * GET /api/admin/analytics/overview
   */
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminAnalyticsService.getOverviewStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/analytics/growth
   */
  static async getGrowth(req: Request, res: Response, next: NextFunction) {
    try {
      const growth = await AdminAnalyticsService.getTenantGrowth();
      res.status(200).json({ success: true, data: growth });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/analytics/plans
   */
  static async getPlanDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const distribution = await AdminAnalyticsService.getPlanDistribution();
      res.status(200).json({ success: true, data: distribution });
    } catch (error) {
      next(error);
    }
  }
}
