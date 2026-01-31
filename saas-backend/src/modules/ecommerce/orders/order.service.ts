import prisma from '../../../config/database';
import { EcommerceCartService } from '../cart/cart.service';
import { Prisma } from '@prisma/client';

interface CheckoutInput {
  shippingName: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone?: string;
  billingName?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  notes?: string;
  couponCode?: string;
}

interface OrderFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  search?: string;
}

export class EcommerceOrderService {
  static async getAll(
    tenantId: string,
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.EcommerceOrderWhereInput = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
      ...(filters.search && {
        OR: [
          { orderNumber: { contains: filters.search, mode: 'insensitive' as const } },
          { shippingName: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.ecommerceOrder.findMany({
        where,
        include: {
          customer: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: { select: { items: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ecommerceOrder.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(tenantId: string, id: string) {
    return prisma.ecommerceOrder.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: true,
          },
        },
        payments: true,
        coupon: true,
      },
    });
  }

  static async getByOrderNumber(tenantId: string, orderNumber: string) {
    return prisma.ecommerceOrder.findFirst({
      where: { tenantId, orderNumber },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  static async getCustomerOrders(tenantId: string, customerId: string, page: number = 1, limit: number = 10) {
    return this.getAll(tenantId, { customerId }, page, limit);
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  static async checkout(tenantId: string, customerId: string | undefined, cartId: string, data: CheckoutInput) {
    // Get cart with items
    const cart = await prisma.ecommerceCart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems: Prisma.EcommerceOrderItemCreateManyOrderInput[] = [];

    for (const item of cart.items) {
      const itemTotal = Number(item.unitPrice) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant?.name,
        sku: item.variant?.sku || item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
      });
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const coupon = await prisma.ecommerceCoupon.findFirst({
        where: {
          tenantId,
          code: data.couponCode,
          isActive: true,
          OR: [
            { startsAt: null },
            { startsAt: { lte: new Date() } },
          ],
        },
      });

      if (coupon) {
        const isExpired = coupon.expiresAt && coupon.expiresAt < new Date();
        const isMaxUsed = coupon.maxUses && coupon.usesCount >= coupon.maxUses;
        const meetsMinimum = !coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount);

        if (!isExpired && !isMaxUsed && meetsMinimum) {
          if (coupon.discountType === 'percentage') {
            discountAmount = subtotal * (Number(coupon.discountValue) / 100);
          } else {
            discountAmount = Math.min(Number(coupon.discountValue), subtotal);
          }
          couponId = coupon.id;
        }
      }
    }

    const taxAmount = 0; // Could calculate based on location
    const shippingAmount = 0; // Could calculate based on weight/location
    const total = subtotal + taxAmount + shippingAmount - discountAmount;

    // Create order
    const order = await prisma.ecommerceOrder.create({
      data: {
        tenantId,
        customerId,
        orderNumber: this.generateOrderNumber(),
        status: 'pending',
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        total,
        couponId,
        shippingName: data.shippingName,
        shippingAddressLine1: data.shippingAddressLine1,
        shippingAddressLine2: data.shippingAddressLine2,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry,
        shippingPhone: data.shippingPhone,
        billingName: data.billingName || data.shippingName,
        billingAddressLine1: data.billingAddressLine1 || data.shippingAddressLine1,
        billingAddressLine2: data.billingAddressLine2 || data.shippingAddressLine2,
        billingCity: data.billingCity || data.shippingCity,
        billingState: data.billingState || data.shippingState,
        billingPostalCode: data.billingPostalCode || data.shippingPostalCode,
        billingCountry: data.billingCountry || data.shippingCountry,
        notes: data.notes,
        items: {
          createMany: {
            data: orderItems,
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Update coupon usage
    if (couponId) {
      await prisma.ecommerceCoupon.update({
        where: { id: couponId },
        data: { usesCount: { increment: 1 } },
      });
    }

    // Reduce stock quantities
    for (const item of cart.items) {
      if (item.variantId) {
        await prisma.ecommerceProductVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      } else {
        await prisma.ecommerceProduct.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }
    }

    // Mark cart as converted
    await prisma.ecommerceCart.update({
      where: { id: cartId },
      data: { status: 'converted' },
    });

    return order;
  }

  static async updateStatus(tenantId: string, id: string, status: string) {
    const order = await prisma.ecommerceOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const updateData: Prisma.EcommerceOrderUpdateInput = { status };

    if (status === 'shipped') {
      updateData.shippedAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    return prisma.ecommerceOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });
  }

  static async cancelOrder(tenantId: string, id: string) {
    const order = await prisma.ecommerceOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      throw new Error('Cannot cancel shipped or delivered orders');
    }

    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        await prisma.ecommerceProductVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      } else if (item.productId) {
        await prisma.ecommerceProduct.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }

    return prisma.ecommerceOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  // Analytics
  static async getSalesSummary(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.EcommerceOrderWhereInput = {
      tenantId,
      status: { notIn: ['cancelled', 'refunded'] },
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const orders = await prisma.ecommerceOrder.findMany({
      where,
      select: {
        total: true,
        status: true,
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount = orders.length;

    return {
      totalRevenue,
      orderCount,
      averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
    };
  }

  static async getTopProducts(tenantId: string, limit: number = 10) {
    const items = await prisma.ecommerceOrderItem.findMany({
      where: {
        order: {
          tenantId,
          status: { notIn: ['cancelled', 'refunded'] },
        },
      },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        totalPrice: true,
      },
    });

    // Aggregate by product
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const item of items) {
      if (!item.productId) continue;
      const existing = productMap.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.totalPrice);
      productMap.set(item.productId, existing);
    }

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}
