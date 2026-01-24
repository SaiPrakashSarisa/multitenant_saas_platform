import prisma from '../../config/database';

export interface CreateExpenseInput {
  category: string;
  amount: number;
  description?: string;
  date: Date;
  receiptUrl?: string;
}

export interface UpdateExpenseInput {
  category?: string;
  amount?: number;
  description?: string;
  date?: Date;
  receiptUrl?: string;
}

export class ExpenseService {
  /**
   * Create new expense
   */
  static async createExpense(tenantId: string, userId: string, data: CreateExpenseInput) {
    return await prisma.expense.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get expenses
   */
  static async getExpenses(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      category?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get expense by ID
   */
  static async getExpenseById(expenseId: string, tenantId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return expense;
  }

  /**
   * Update expense
   */
  static async updateExpense(expenseId: string, tenantId: string, data: UpdateExpenseInput) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete expense
   */
  static async deleteExpense(expenseId: string, tenantId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return { message: 'Expense deleted successfully' };
  }

  /**
   * Get expense summary
   */
  static async getExpenseSummary(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [totalExpenses, categoryBreakdown, monthlyExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      // Get last 6 months
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as month,
          SUM(amount) as total
        FROM expenses
        WHERE tenant_id = ${tenantId}
          AND date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month DESC
      `,
    ]);

    return {
      totalAmount: totalExpenses._sum.amount || 0,
      totalCount: totalExpenses._count,
      byCategory: categoryBreakdown.map((c) => ({
        category: c.category,
        total: c._sum.amount || 0,
        count: c._count,
      })),
      monthlyTrend: monthlyExpenses,
    };
  }

  /**
   * Get expense categories
   */
  static async getCategories(tenantId: string) {
    const categories = await prisma.expense.findMany({
      where: { tenantId },
      distinct: ['category'],
      select: { category: true },
    });

    return categories.map((c) => c.category);
  }
}
