import { Request, Response, NextFunction } from 'express';
import { AdminPlanService } from './admin.plans.service';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(2),
  displayName: z.string().min(2),
  price: z.number().min(0),
  billingCycle: z.enum(['monthly', 'yearly']),
  features: z.record(z.string(), z.any()).optional(),
});

export class AdminPlanController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPlanSchema.parse(req.body);
      const plan = await AdminPlanService.createPlan(data);
      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await AdminPlanService.getAllPlans();
      res.status(200).json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await AdminPlanService.updatePlan(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await AdminPlanService.deletePlan(req.params.id as string);
      res.status(200).json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
