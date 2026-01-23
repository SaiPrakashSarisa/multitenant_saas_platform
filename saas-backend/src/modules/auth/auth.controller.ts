import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from '../../utils/validators';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new tenant with owner user
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      const result = await AuthService.register(validatedData);

      res.status(201).json({
        success: true,
        message: 'Registration successful! Your 2-month free trial has started.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login existing user
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      const result = await AuthService.login(validatedData);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info (Protected route)
   */
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await AuthService.getCurrentUser(req.user.userId, req.user.tenantId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
