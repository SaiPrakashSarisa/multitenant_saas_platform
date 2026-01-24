import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { updateTenantSchema } from '../../utils/validators';

export class TenantController {
  /**
   * GET /api/tenants
   * Get all tenants with pagination
   */
  static async getAllTenants(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await TenantService.getAllTenants(page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tenants/:id
   * Get specific tenant
   */
  static async getTenantById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Ensure user can only access their own tenant (unless admin)
      if (req.user?.role !== 'owner' && req.user?.tenantId !== id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only access your own tenant',
        });
      }

      const tenant = await TenantService.getTenantById(id as string);

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tenants/:id
   * Update tenant
   */
  static async updateTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Ensure user can only update their own tenant
      if (req.user?.tenantId !== id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only update your own tenant',
        });
      }

      const validatedData = updateTenantSchema.parse(req.body);
      const tenant = await TenantService.updateTenant(id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Tenant updated successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tenants/:id/upgrade
   * Upgrade tenant plan
   */
  static async upgradePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { planId } = req.body;

      // Ensure user can only upgrade their own tenant
      if (req.user?.tenantId !== id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only upgrade your own tenant',
        });
      }

      if (!planId) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'planId is required',
        });
      }

      const tenant = await TenantService.upgradePlan(id as string, { planId });

      res.status(200).json({
        success: true,
        message: 'Plan upgraded successfully! Welcome to your new plan.',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
}
