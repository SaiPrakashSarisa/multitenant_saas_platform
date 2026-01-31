import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EcommerceOrderService } from './order.service';
import { EcommerceCartService } from '../cart/cart.service';

const checkoutSchema = z.object({
  shippingName: z.string().min(1).max(255),
  shippingAddressLine1: z.string().min(1).max(255),
  shippingAddressLine2: z.string().max(255).optional(),
  shippingCity: z.string().min(1).max(100),
  shippingState: z.string().min(1).max(100),
  shippingPostalCode: z.string().min(1).max(20),
  shippingCountry: z.string().min(1).max(100),
  shippingPhone: z.string().max(20).optional(),
  billingName: z.string().max(255).optional(),
  billingAddressLine1: z.string().max(255).optional(),
  billingAddressLine2: z.string().max(255).optional(),
  billingCity: z.string().max(100).optional(),
  billingState: z.string().max(100).optional(),
  billingPostalCode: z.string().max(20).optional(),
  billingCountry: z.string().max(100).optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
});

export class EcommerceOrderController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const filters = {
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string,
      };

      const result = await EcommerceOrderService.getAll(tenantId, filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const customerId = req.user?.id;
      if (!tenantId || !customerId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      const result = await EcommerceOrderService.getCustomerOrders(tenantId, customerId, page, limit);
      res.json({ success: true, ...result });
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

      const order = await EcommerceOrderService.getById(tenantId, req.params.id as string);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const validated = checkoutSchema.parse(req.body);
      const customerId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string;

      // Get cart
      const cart = await EcommerceCartService.getCart(tenantId, customerId, sessionId);

      const order = await EcommerceOrderService.checkout(tenantId, customerId, cart.id, validated);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const validated = updateStatusSchema.parse(req.body);
      const order = await EcommerceOrderService.updateStatus(tenantId, req.params.id as string, validated.status);
      res.json({ success: true, data: order });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const order = await EcommerceOrderService.cancelOrder(tenantId, req.params.id as string);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  // Analytics
  static async getSalesSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const summary = await EcommerceOrderService.getSalesSummary(tenantId, startDate, endDate);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  static async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const products = await EcommerceOrderService.getTopProducts(tenantId, limit);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }
}


