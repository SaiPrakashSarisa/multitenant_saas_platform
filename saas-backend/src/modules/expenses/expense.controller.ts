import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from './expense.service';
import { z } from 'zod';

const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  date: z.string().transform((val) => new Date(val)),
  receiptUrl: z.string().url().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

export class ExpenseController {
  static async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId || !req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const validatedData = createExpenseSchema.parse(req.body);
      const expense = await ExpenseService.createExpense(req.tenantId, req.user.userId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await ExpenseService.getExpenses(req.tenantId, page, limit, {
        category,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExpenseById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const expense = await ExpenseService.getExpenseById(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const validatedData = updateExpenseSchema.parse(req.body);
      const expense = await ExpenseService.updateExpense(id as string, req.tenantId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await ExpenseService.deleteExpense(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const summary = await ExpenseService.getExpenseSummary(req.tenantId, startDate, endDate);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const categories = await ExpenseService.getCategories(req.tenantId);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}
