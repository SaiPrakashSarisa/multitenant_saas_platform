import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from './admin.auth.service';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AdminAuthController {
  /**
   * POST /api/admin/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AdminAuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/auth/me
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore - admin attached by middleware
      if (!req.admin) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // @ts-ignore
      const admin = await AdminAuthService.getProfile(req.admin.adminId);

      res.status(200).json({
        success: true,
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }
}
