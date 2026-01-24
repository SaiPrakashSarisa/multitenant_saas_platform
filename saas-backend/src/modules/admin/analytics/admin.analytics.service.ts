import prisma from '../../../config/database';

export class AdminAnalyticsService {
  /**
   * Get main dashboard overview stats
   */
  static async getOverviewStats() {
    const [
      totalTenants,
      newTenantsThisMonth,
      totalUsers,
      totalRevenue
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.user.count(),
      // Calculate revenue based on active paid plans (simplified estimation)
      prisma.tenant.findMany({
        where: { status: 'active' },
        include: { plan: true }
      }).then(tenants => 
        tenants.reduce((acc, t) => acc + Number(t.plan.price), 0)
      )
    ]);

    return {
      totalTenants,
      newTenantsThisMonth, 
      totalUsers,
      mrr: totalRevenue, // Monthly Recurring Revenue
      activeTenants: await prisma.tenant.count({ where: { status: 'active' } }),
      trialTenants: await prisma.tenant.count({ where: { status: 'trial' } }),
    };
  }

  /**
   * Get tenant growth trend (last 6 months)
   */
  static async getTenantGrowth() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month

    const tenants = await prisma.tenant.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true }
    });

    // Group by month
    const growth: Record<string, number> = {};
    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const key = d.toISOString().slice(0, 7); // YYYY-MM
        growth[key] = 0;
        months.push(key);
    }

    tenants.forEach(t => {
      const month = t.createdAt.toISOString().slice(0, 7);
      if (growth[month] !== undefined) {
        growth[month]++;
      }
    });

    return Object.entries(growth).map(([month, count]) => ({ month, count }));
  }

  /**
   * Get plan distribution
   */
  static async getPlanDistribution() {
    const plans = await prisma.plan.findMany({
      select: { displayName: true, _count: { select: { tenants: true } } }
    });

    return plans.map(p => ({
      plan: p.displayName,
      count: p._count.tenants
    }));
  }
}
