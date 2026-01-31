import prisma from '../../../config/database';

interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export class EcommerceCategoryService {
  static async getAll(tenantId: string) {
    return prisma.ecommerceCategory.findMany({
      where: { tenantId },
      include: {
        children: {
          include: {
            children: true, // Support up to 3 levels deep
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  static async getTree(tenantId: string) {
    // Get only root categories (no parent) with their children
    return prisma.ecommerceCategory.findMany({
      where: {
        tenantId,
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  static async getById(tenantId: string, id: string) {
    return prisma.ecommerceCategory.findFirst({
      where: { id, tenantId },
      include: {
        children: true,
        parent: true,
        products: {
          take: 10,
          where: { isActive: true },
        },
      },
    });
  }

  static async getBySlug(tenantId: string, slug: string) {
    return prisma.ecommerceCategory.findFirst({
      where: { tenantId, slug },
      include: {
        children: true,
        products: {
          where: { isActive: true },
        },
      },
    });
  }

  static async create(tenantId: string, data: CreateCategoryInput) {
    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await prisma.ecommerceCategory.findFirst({
        where: { id: data.parentId, tenantId },
      });
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    // Check slug uniqueness within tenant
    const existing = await prisma.ecommerceCategory.findFirst({
      where: { tenantId, slug: data.slug },
    });
    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    return prisma.ecommerceCategory.create({
      data: {
        tenantId,
        ...data,
      },
      include: {
        parent: true,
      },
    });
  }

  static async update(tenantId: string, id: string, data: UpdateCategoryInput) {
    const category = await prisma.ecommerceCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.ecommerceCategory.findFirst({
        where: { tenantId, slug: data.slug, id: { not: id } },
      });
      if (existing) {
        throw new Error('Category with this slug already exists');
      }
    }

    // Prevent circular reference
    if (data.parentId === id) {
      throw new Error('Category cannot be its own parent');
    }

    return prisma.ecommerceCategory.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  static async delete(tenantId: string, id: string) {
    const category = await prisma.ecommerceCategory.findFirst({
      where: { id, tenantId },
      include: { children: true, products: true },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    if (category.products.length > 0) {
      throw new Error('Cannot delete category with products');
    }

    return prisma.ecommerceCategory.delete({
      where: { id },
    });
  }

  static async reorder(tenantId: string, categoryOrders: { id: string; sortOrder: number }[]) {
    const updates = categoryOrders.map(({ id, sortOrder }) =>
      prisma.ecommerceCategory.updateMany({
        where: { id, tenantId },
        data: { sortOrder },
      })
    );

    await prisma.$transaction(updates);
    return { success: true };
  }
}
