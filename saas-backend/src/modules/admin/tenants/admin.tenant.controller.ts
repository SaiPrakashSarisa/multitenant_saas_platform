import { Request, Response, NextFunction } from 'express';
import { AdminTenantService } from './admin.tenant.service';

export class AdminTenantController {
  /**
   * GET /api/admin/tenants
   */
  static async getAllTenants(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await AdminTenantService.getAllTenants(page, limit, search, status);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/tenants/:id
   */
  static async getTenantById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tenant = await AdminTenantService.getTenantById(id as string);

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/tenants/:id/suspend
   */
  static async suspendTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // @ts-ignore
      const adminId = req.admin.adminId;

      const tenant = await AdminTenantService.suspendTenant(id as string, adminId, reason);

      res.status(200).json({
        success: true,
        message: 'Tenant suspended successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/tenants/:id/activate
   */
  static async activateTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // @ts-ignore
      const adminId = req.admin.adminId;

      const tenant = await AdminTenantService.activateTenant(id as string, adminId);

      res.status(200).json({
        success: true,
        message: 'Tenant activated successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
}
