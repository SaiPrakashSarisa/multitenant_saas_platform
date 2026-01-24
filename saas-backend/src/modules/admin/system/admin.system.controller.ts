import { Request, Response, NextFunction } from 'express';
import { AdminSystemService } from './admin.system.service';

export class AdminSystemController {
  /**
   * GET /api/admin/system/health
   */
  static async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminSystemService.getSystemStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/system/logs
   */
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;

      const result = await AdminSystemService.getAuditLogs(page, limit, type);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
