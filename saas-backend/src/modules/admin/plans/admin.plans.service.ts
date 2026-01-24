import prisma from '../../../config/database';

export class AdminPlanService {
  /**
   * Create a new plan
   */
  static async createPlan(data: any) {
    // Check if name exists
    const existing = await prisma.plan.findFirst({
      where: { name: data.name },
    });
    if (existing) {
      throw new Error('Plan with this name already exists');
    }

    return prisma.plan.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        price: data.price,
        billingCycle: data.billingCycle,
        features: data.features, // JSON object
      },
    });
  }

  /**
   * Get all plans
   */
  static async getAllPlans() {
    return prisma.plan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { tenants: true },
        },
      },
    });
  }

  /**
   * Update a plan
   */
  static async updatePlan(id: string, data: any) {
    return prisma.plan.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a plan (only if no tenants are using it)
   */
  static async deletePlan(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { tenants: true } } },
    });

    if (!plan) throw new Error('Plan not found');
    if (plan._count.tenants > 0) {
      throw new Error('Cannot delete plan with active tenants');
    }

    return prisma.plan.delete({ where: { id } });
  }
}
