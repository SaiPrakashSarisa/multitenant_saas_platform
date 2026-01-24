import prisma from '../../../config/database';

export class AdminTenantService {
  /**
   * Get all tenants (Admin View)
   */
  static async getAllTenants(page: number = 1, limit: number = 20, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { users: { some: { email: { contains: search, mode: 'insensitive' }, role: 'owner' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          plan: {
            select: { name: true, displayName: true },
          },
          _count: {
            select: {
              users: true,
              products: true,
              hotelTables: true,
              expenses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      tenants: tenants.map((t) => ({
        ...t,
        userCount: t._count.users,
        productCount: t._count.products,
        tableCount: t._count.hotelTables,
        expenseCount: t._count.expenses,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Tenant Details
   */
  static async getTenantById(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        tenantModules: {
          include: { module: true },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant;
  }

  /**
   * Suspend Tenant
   */
  static async suspendTenant(tenantId: string, adminId: string, reason?: string) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'suspended' },
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'suspend_tenant',
        targetType: 'tenant',
        targetId: tenantId,
        details: { reason },
      },
    });

    return tenant;
  }

  /**
   * Activate Tenant
   */
  static async activateTenant(tenantId: string, adminId: string) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'active' }, // Or check subscription logic to determine correct status
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'activate_tenant',
        targetType: 'tenant',
        targetId: tenantId,
      },
    });

    return tenant;
  }
}
