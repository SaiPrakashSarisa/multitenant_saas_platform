import prisma from '../../../config/database';

interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  isActive?: boolean;
  startsAt?: Date;
  expiresAt?: Date;
}

interface UpdateCouponInput extends Partial<CreateCouponInput> {}

export class EcommerceCouponService {
  static async getAll(tenantId: string, includeInactive: boolean = false) {
    const where = includeInactive
      ? { tenantId }
      : { tenantId, isActive: true };

    return prisma.ecommerceCoupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(tenantId: string, id: string) {
    return prisma.ecommerceCoupon.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { orders: true } },
      },
    });
  }

  static async getByCode(tenantId: string, code: string) {
    return prisma.ecommerceCoupon.findFirst({
      where: { tenantId, code: code.toUpperCase() },
    });
  }

  static async create(tenantId: string, data: CreateCouponInput) {
    // Normalize code to uppercase
    const code = data.code.toUpperCase();

    // Check uniqueness
    const existing = await prisma.ecommerceCoupon.findFirst({
      where: { tenantId, code },
    });

    if (existing) {
      throw new Error('Coupon code already exists');
    }

    return prisma.ecommerceCoupon.create({
      data: {
        tenantId,
        ...data,
        code,
      },
    });
  }

  static async update(tenantId: string, id: string, data: UpdateCouponInput) {
    const coupon = await prisma.ecommerceCoupon.findFirst({
      where: { id, tenantId },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // If updating code, normalize and check uniqueness
    if (data.code) {
      const code = data.code.toUpperCase();
      const existing = await prisma.ecommerceCoupon.findFirst({
        where: { tenantId, code, id: { not: id } },
      });

      if (existing) {
        throw new Error('Coupon code already exists');
      }

      data.code = code;
    }

    return prisma.ecommerceCoupon.update({
      where: { id },
      data,
    });
  }

  static async delete(tenantId: string, id: string) {
    const coupon = await prisma.ecommerceCoupon.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { orders: true } } },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    if (coupon._count.orders > 0) {
      // Soft delete by deactivating
      return prisma.ecommerceCoupon.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.ecommerceCoupon.delete({
      where: { id },
    });
  }

  static async validate(tenantId: string, code: string, orderTotal: number) {
    const coupon = await prisma.ecommerceCoupon.findFirst({
      where: {
        tenantId,
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    // Check dates
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return { valid: false, error: 'Coupon not yet active' };
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { valid: false, error: 'Coupon has expired' };
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
      return {
        valid: false,
        error: `Minimum order amount of $${coupon.minOrderAmount} required`,
      };
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.discountType === 'percentage') {
      discountAmount = orderTotal * (Number(coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(Number(coupon.discountValue), orderTotal);
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
    };
  }
}
