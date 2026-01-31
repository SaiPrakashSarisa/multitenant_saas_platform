import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EcommerceCouponService } from './coupon.service';

const createCouponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateCouponSchema = createCouponSchema.partial();

const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderTotal: z.number().positive(),
});

export class EcommerceCouponController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const includeInactive = req.query.includeInactive === 'true';
      const coupons = await EcommerceCouponService.getAll(tenantId, includeInactive);
      res.json({ success: true, data: coupons });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const coupon = await EcommerceCouponService.getById(tenantId, req.params.id as string);
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const validated = createCouponSchema.parse(req.body);
      const data = {
        ...validated,
        startsAt: validated.startsAt ? new Date(validated.startsAt) : undefined,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
      };

      const coupon = await EcommerceCouponService.create(tenantId, data);
      res.status(201).json({ success: true, data: coupon });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const validated = updateCouponSchema.parse(req.body);
      const data = {
        ...validated,
        startsAt: validated.startsAt ? new Date(validated.startsAt) : undefined,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
      };

      const coupon = await EcommerceCouponService.update(tenantId, req.params.id as string, data);
      res.json({ success: true, data: coupon });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      await EcommerceCouponService.delete(tenantId, req.params.id as string);
      res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const validated = validateCouponSchema.parse(req.body);
      const result = await EcommerceCouponService.validate(
        tenantId,
        validated.code,
        validated.orderTotal
      );

      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }
}


