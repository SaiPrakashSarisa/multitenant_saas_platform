import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { z } from 'zod';

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).default(10),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const updateProductSchema = createProductSchema.partial();

const adjustStockSchema = z.object({
  quantity: z.number().int(),
  movementType: z.enum(['purchase', 'sale', 'adjustment', 'return']),
  notes: z.string().optional(),
});

export class InventoryController {
  /**
   * POST /api/inventory/products
   * Create new product
   */
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId || !req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const validatedData = createProductSchema.parse(req.body);
      const product = await InventoryService.createProduct(
        req.tenantId,
        req.user.userId,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/products
   * Get all products
   */
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const lowStock = req.query.lowStock === 'true';
      const search = req.query.search as string;

      const result = await InventoryService.getProducts(req.tenantId, page, limit, {
        category,
        lowStock,
        search,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/products/:id
   * Get product by ID
   */
  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const product = await InventoryService.getProductById(id, req.tenantId);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/inventory/products/:id
   * Update product
   */
  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const validatedData = updateProductSchema.parse(req.body);
      const product = await InventoryService.updateProduct(id, req.tenantId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/inventory/products/:id
   * Delete product
   */
  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await InventoryService.deleteProduct(id, req.tenantId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/inventory/products/:id/stock
   * Adjust stock quantity
   */
  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId || !req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const validatedData = adjustStockSchema.parse(req.body);
      const result = await InventoryService.adjustStock(
        id,
        req.tenantId,
        req.user.userId,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/low-stock
   * Get low stock products
   */
  static async getLowStockProducts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const products = await InventoryService.getLowStockProducts(req.tenantId);

      res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/stats
   * Get inventory statistics
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const stats = await InventoryService.getInventoryStats(req.tenantId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/stock-history
   * Get stock movement history
   */
  static async getStockHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const productId = req.query.productId as string;

      const result = await InventoryService.getStockHistory(req.tenantId, productId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
