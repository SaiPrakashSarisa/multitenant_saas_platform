import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';

interface CreateProductInput {
  categoryId?: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  weight?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

interface UpdateProductInput extends Partial<CreateProductInput> {}

interface ProductFilters {
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class EcommerceProductService {
  static async getAll(tenantId: string, filters: ProductFilters = {}, pagination: PaginationOptions) {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.EcommerceProductWhereInput = {
      tenantId,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
      ...(filters.inStock && { stockQuantity: { gt: 0 } }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { description: { contains: filters.search, mode: 'insensitive' as const } },
          { sku: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.ecommerceProduct.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
          variants: true,
          _count: {
            select: { orderItems: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.ecommerceProduct.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(tenantId: string, id: string) {
    return prisma.ecommerceProduct.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: true,
      },
    });
  }

  static async getBySlug(tenantId: string, slug: string) {
    return prisma.ecommerceProduct.findFirst({
      where: { tenantId, slug },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: true,
      },
    });
  }

  static async getFeatured(tenantId: string, limit: number = 10) {
    return prisma.ecommerceProduct.findMany({
      where: {
        tenantId,
        isFeatured: true,
        isActive: true,
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: limit,
    });
  }

  static async getLowStock(tenantId: string) {
    return prisma.ecommerceProduct.findMany({
      where: {
        tenantId,
        stockQuantity: {
          lte: prisma.ecommerceProduct.fields.lowStockThreshold,
        },
      },
      include: {
        category: true,
      },
      orderBy: { stockQuantity: 'asc' },
    });
  }

  static async create(tenantId: string, data: CreateProductInput) {
    // Check slug uniqueness
    const existing = await prisma.ecommerceProduct.findFirst({
      where: { tenantId, slug: data.slug },
    });
    if (existing) {
      throw new Error('Product with this slug already exists');
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.ecommerceCategory.findFirst({
        where: { id: data.categoryId, tenantId },
      });
      if (!category) {
        throw new Error('Category not found');
      }
    }

    return prisma.ecommerceProduct.create({
      data: {
        tenantId,
        ...data,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        weight: data.weight,
      },
      include: {
        category: true,
      },
    });
  }

  static async update(tenantId: string, id: string, data: UpdateProductInput) {
    const product = await prisma.ecommerceProduct.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== product.slug) {
      const existing = await prisma.ecommerceProduct.findFirst({
        where: { tenantId, slug: data.slug, id: { not: id } },
      });
      if (existing) {
        throw new Error('Product with this slug already exists');
      }
    }

    return prisma.ecommerceProduct.update({
      where: { id },
      data,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
  }

  static async delete(tenantId: string, id: string) {
    const product = await prisma.ecommerceProduct.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return prisma.ecommerceProduct.delete({
      where: { id },
    });
  }

  static async updateStock(tenantId: string, id: string, quantity: number) {
    const product = await prisma.ecommerceProduct.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return prisma.ecommerceProduct.update({
      where: { id },
      data: { stockQuantity: quantity },
    });
  }

  // Image management
  static async addImage(productId: string, url: string, altText?: string, isPrimary: boolean = false) {
    // If setting as primary, unset other primary images
    if (isPrimary) {
      await prisma.ecommerceProductImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    const maxSortOrder = await prisma.ecommerceProductImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return prisma.ecommerceProductImage.create({
      data: {
        productId,
        url,
        altText,
        isPrimary,
        sortOrder: (maxSortOrder?.sortOrder ?? 0) + 1,
      },
    });
  }

  static async removeImage(productId: string, imageId: string) {
    return prisma.ecommerceProductImage.delete({
      where: { id: imageId, productId },
    });
  }

  static async setImagePrimary(productId: string, imageId: string) {
    await prisma.ecommerceProductImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    return prisma.ecommerceProductImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  // Variant management
  static async addVariant(productId: string, data: {
    name: string;
    sku?: string;
    price?: number;
    stockQuantity?: number;
    attributes?: Record<string, string>;
  }) {
    return prisma.ecommerceProductVariant.create({
      data: {
        productId,
        ...data,
      },
    });
  }

  static async updateVariant(productId: string, variantId: string, data: {
    name?: string;
    sku?: string;
    price?: number;
    stockQuantity?: number;
    attributes?: Record<string, string>;
  }) {
    return prisma.ecommerceProductVariant.update({
      where: { id: variantId, productId },
      data,
    });
  }

  static async deleteVariant(productId: string, variantId: string) {
    return prisma.ecommerceProductVariant.delete({
      where: { id: variantId, productId },
    });
  }
}
