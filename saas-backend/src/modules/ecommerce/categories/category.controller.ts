import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EcommerceCategoryService } from './category.service';

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

const reorderSchema = z.object({
  categories: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
});

export class EcommerceCategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const categories = await EcommerceCategoryService.getAll(tenantId);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const tree = await EcommerceCategoryService.getTree(tenantId);
      res.json({ success: true, data: tree });
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

      const category = await EcommerceCategoryService.getById(tenantId, req.params.id as string);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ success: true, data: category });
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

      const category = await EcommerceCategoryService.getBySlug(tenantId, req.params.slug as string);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ success: true, data: category });
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

      const validated = createCategorySchema.parse(req.body);
      const category = await EcommerceCategoryService.create(tenantId, validated);
      res.status(201).json({ success: true, data: category });
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

      const validated = updateCategorySchema.parse(req.body);
      const category = await EcommerceCategoryService.update(tenantId, req.params.id as string, validated);
      res.json({ success: true, data: category });
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

      await EcommerceCategoryService.delete(tenantId, req.params.id as string);
      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }

      const validated = reorderSchema.parse(req.body);
      await EcommerceCategoryService.reorder(tenantId, validated.categories);
      res.json({ success: true, message: 'Categories reordered' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  }
}


