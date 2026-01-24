import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { createUserSchema } from '../../utils/validators';
import { z } from 'zod';

// Update user schema
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['admin', 'staff']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Change password schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class UserController {
  /**
   * POST /api/users
   * Create new user in tenant
   */
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Tenant ID not found',
        });
      }

      // Validate request body
      const validatedData = createUserSchema.parse(req.body);

      // Only allow admin and staff roles (owner created during registration)
      if (validatedData.role === 'owner') {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Cannot create owner user through this endpoint',
        });
      }

      const user = await UserService.createUser(req.tenantId, validatedData as any);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users
   * Get all users for tenant
   */
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UserService.getUsersByTenant(req.tenantId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Get specific user
   */
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;

      const user = await UserService.getUserById(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Update user
   */
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);

      const user = await UserService.updateUser(id as string, req.tenantId, validatedData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Deactivate user
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;

      const result = await UserService.deleteUser(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id/change-password
   * Change user password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;

      // Users can only change their own password
      if (id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only change your own password',
        });
      }

      const validatedData = changePasswordSchema.parse(req.body);

      const result = await UserService.changePassword(id as string, validatedData);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
