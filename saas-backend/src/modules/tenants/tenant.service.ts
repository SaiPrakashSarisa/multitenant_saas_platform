import prisma from '../../config/database';

export interface UpdateTenantInput {
  name?: string;
  status?: string;
  customLimits?: Record<string, any>;
}

export interface UpgradePlanInput {
  planId: string;
}

export class TenantService {
  /**
   * Get all tenants (for admin purposes)
   */
  static async getAllTenants(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        include: {
          plan: true,
          _count: {
            select: {
              users: true,
              products: true,
              hotelTables: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tenant.count(),
    ]);

    return {
      tenants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single tenant by ID
   */
  static async getTenantById(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        tenantModules: {
          where: { isEnabled: true },
          include: {
            module: true,
          },
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
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Calculate days remaining in trial
    let daysRemaining = null;
    if (tenant.status === 'trial' && tenant.trialEndDate) {
      const now = new Date();
      const diff = tenant.trialEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      ...tenant,
      daysRemaining,
    };
  }

  /**
   * Update tenant information
   */
  static async updateTenant(tenantId: string, data: UpdateTenantInput) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    return tenant;
  }

  /**
   * Upgrade tenant plan
   */
  static async upgradePlan(tenantId: string, data: UpgradePlanInput) {
    const { planId } = data;

    // Verify plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Get current tenant
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!currentTenant) {
      throw new Error('Tenant not found');
    }

    // Update tenant plan
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId,
        status: 'active',
        trialConverted: currentTenant.status === 'trial',
        updatedAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    return updatedTenant;
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantId: string) {
    const [
      userCount,
      productCount,
      tableCount,
      expenseCount,
      currentMonthExpenses,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.hotelTable.count({ where: { tenantId } }),
      prisma.expense.count({ where: { tenantId } }),
      prisma.expense.aggregate({
        where: {
          tenantId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      users: userCount,
      products: productCount,
      tables: tableCount,
      expenses: expenseCount,
      currentMonthExpenseTotal: currentMonthExpenses._sum.amount || 0,
    };
  }
}
