import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EcommerceCartService } from './cart.service';

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  variantId: z.string().uuid().optional(),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0),
});

export class EcommerceCartController {
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const customerId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string;

      const cart = await EcommerceCartService.getCart(tenantId, customerId, sessionId);
      const totals = await EcommerceCartService.getCartTotal(cart.id);

      res.json({
        success: true,
        data: {
          ...cart,
          ...totals,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const validated = addItemSchema.parse(req.body);
      const customerId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string;

      const cart = await EcommerceCartService.getCart(tenantId, customerId, sessionId);
      const item = await EcommerceCartService.addItem(
        cart.id,
        validated.productId,
        validated.quantity,
        validated.variantId
      );

      res.status(201).json({ success: true, data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async updateItemQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateQuantitySchema.parse(req.body);
      const item = await EcommerceCartService.updateItemQuantity(
        req.params.itemId as string,
        validated.quantity
      );

      res.json({ success: true, data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      await EcommerceCartService.removeItem(req.params.itemId as string);
      res.json({ success: true, message: 'Item removed' });
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const customerId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string;

      const cart = await EcommerceCartService.getCart(tenantId, customerId, sessionId);
      await EcommerceCartService.clearCart(cart.id);

      res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
      next(error);
    }
  }
}


