import prisma from '../../config/database';

export interface CreateProductInput {
  name: string;
  sku?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  category?: string;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  lowStockThreshold?: number;
  category?: string;
  imageUrl?: string;
}

export interface StockAdjustmentInput {
  quantity: number;
  movementType: 'purchase' | 'sale' | 'adjustment' | 'return';
  notes?: string;
}

export class InventoryService {
  /**
   * Create a new product
   */
  static async createProduct(tenantId: string, userId: string, data: CreateProductInput) {
    // Check product limit based on plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true, _count: { select: { products: true } } },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const planFeatures = tenant.plan.features as any;
    const maxProducts = tenant.customLimits
      ? (tenant.customLimits as any).maxProducts
      : planFeatures.maxProducts;

    if (maxProducts !== -1 && tenant._count.products >= maxProducts) {
      throw new Error(
        `Product limit reached. Your ${tenant.plan.displayName} allows ${maxProducts} products. Please upgrade your plan.`
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });

    // Create initial stock movement if quantity provided
    if (data.stockQuantity && data.stockQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          quantity: data.stockQuantity,
          movementType: 'adjustment',
          notes: 'Initial stock',
          createdBy: userId,
        },
      });
    }

    return product;
  }

  /**
   * Get all products for a tenant
   */
  static async getProducts(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      category?: string;
      lowStock?: boolean;
      search?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.lowStock) {
      where.stockQuantity = {
        lte: prisma.product.fields.lowStockThreshold,
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Mark low stock products
    const productsWithStatus = products.map((product) => ({
      ...product,
      isLowStock: product.stockQuantity <= product.lowStockThreshold,
    }));

    return {
      products: productsWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      ...product,
      isLowStock: product.stockQuantity <= product.lowStockThreshold,
    };
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, tenantId: string, data: UpdateProductInput) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Adjust stock (add or remove)
   */
  static async adjustStock(
    productId: string,
    tenantId: string,
    userId: string,
    data: StockAdjustmentInput
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Calculate new stock quantity
    const newQuantity = product.stockQuantity + data.quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock. Cannot reduce below zero.');
    }

    // Update product and create stock movement in transaction
    const result = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: {
          stockQuantity: newQuantity,
          updatedAt: new Date(),
        },
      }),
      prisma.stockMovement.create({
        data: {
          tenantId,
          productId,
          quantity: data.quantity,
          movementType: data.movementType,
          notes: data.notes,
          createdBy: userId,
        },
      }),
    ]);

    return {
      product: result[0],
      movement: result[1],
    };
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(tenantId: string) {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        stockQuantity: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });

    return products;
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats(tenantId: string) {
    const [totalProducts, lowStockCount, totalValue, categoryCounts] = await Promise.all([
      prisma.product.count({ where: { tenantId } }),
      prisma.product.count({
        where: {
          tenantId,
          stockQuantity: {
            lte: prisma.product.fields.lowStockThreshold,
          },
        },
      }),
      prisma.product.aggregate({
        where: { tenantId },
        _sum: {
          stockQuantity: true,
        },
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    return {
      totalProducts,
      lowStockCount,
      totalStockUnits: totalValue._sum.stockQuantity || 0,
      categoryCounts: categoryCounts.map((c) => ({
        category: c.category || 'Uncategorized',
        count: c._count,
      })),
    };
  }

  /**
   * Get stock movement history
   */
  static async getStockHistory(
    tenantId: string,
    productId?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (productId) {
      where.productId = productId;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
