import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EcommerceProductService } from './product.service';

const createProductSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().max(100).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  weight: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

const addImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(255).optional(),
  isPrimary: z.boolean().optional(),
});

const variantSchema = z.object({
  name: z.string().min(1).max(100),
  sku: z.string().max(100).optional(),
  price: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
});

export class EcommerceProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const filters = {
        categoryId: req.query.categoryId as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isFeatured: req.query.isFeatured === 'true' ? true : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStock: req.query.inStock === 'true' ? true : undefined,
        search: req.query.search as string,
      };

      const result = await EcommerceProductService.getAll(tenantId, filters, { page, limit, sortBy, sortOrder });
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

      const product = await EcommerceProductService.getById(tenantId, req.params.id as string);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const product = await EcommerceProductService.getBySlug(tenantId, req.params.slug as string);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const products = await EcommerceProductService.getFeatured(tenantId, limit);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  static async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const products = await EcommerceProductService.getLowStock(tenantId);
      res.json({ success: true, data: products });
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

      const validated = createProductSchema.parse(req.body);
      const product = await EcommerceProductService.create(tenantId, validated);
      res.status(201).json({ success: true, data: product });
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

      const validated = updateProductSchema.parse(req.body);
      const product = await EcommerceProductService.update(tenantId, req.params.id as string, validated);
      res.json({ success: true, data: product });
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

      await EcommerceProductService.delete(tenantId, req.params.id as string);
      res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }

      const product = await EcommerceProductService.updateStock(tenantId, req.params.id as string, quantity);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  // Image management
  static async addImage(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = addImageSchema.parse(req.body);
      const image = await EcommerceProductService.addImage(
        req.params.id as string,
        validated.url,
        validated.altText,
        validated.isPrimary
      );
      res.status(201).json({ success: true, data: image });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async removeImage(req: Request, res: Response, next: NextFunction) {
    try {
      await EcommerceProductService.removeImage(req.params.id as string, req.params.imageId as string);
      res.json({ success: true, message: 'Image removed' });
    } catch (error) {
      next(error);
    }
  }

  static async setImagePrimary(req: Request, res: Response, next: NextFunction) {
    try {
      const image = await EcommerceProductService.setImagePrimary(req.params.id as string, req.params.imageId as string);
      res.json({ success: true, data: image });
    } catch (error) {
      next(error);
    }
  }

  // Variant management
  static async addVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = variantSchema.parse(req.body);
      const variant = await EcommerceProductService.addVariant(req.params.id as string, validated);
      res.status(201).json({ success: true, data: variant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = variantSchema.partial().parse(req.body);
      const variant = await EcommerceProductService.updateVariant(req.params.id as string, req.params.variantId as string, validated);
      res.json({ success: true, data: variant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }

  static async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      await EcommerceProductService.deleteVariant(req.params.id as string, req.params.variantId as string);
      res.json({ success: true, message: 'Variant deleted' });
    } catch (error) {
      next(error);
    }
  }
}


