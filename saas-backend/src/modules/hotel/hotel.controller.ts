import { Request, Response, NextFunction } from 'express';
import { HotelService } from './hotel.service';
import { z } from 'zod';

// Validation schemas
const createTableSchema = z.object({
  tableNumber: z.string().min(1, 'Table number is required'),
  capacity: z.number().int().min(1).optional(),
  floor: z.string().optional(),
  section: z.string().optional(),
});

const updateTableSchema = createTableSchema.partial().extend({
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional(),
});

const createReservationSchema = z.object({
  tableId: z.string().uuid('Invalid table ID'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  reservationTime: z.string().transform((val) => new Date(val)),
  partySize: z.number().int().min(1, 'Party size must be at least 1'),
  specialRequests: z.string().optional(),
});

const updateReservationSchema = createReservationSchema.partial().extend({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no-show']).optional(),
});

export class HotelController {
  // ===== TABLE MANAGEMENT =====

  static async createTable(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const validatedData = createTableSchema.parse(req.body);
      const table = await HotelService.createTable(req.tenantId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Table created successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const status = req.query.status as string;
      const floor = req.query.floor as string;
      const section = req.query.section as string;

      const tables = await HotelService.getTables(req.tenantId, { status, floor, section });

      res.status(200).json({
        success: true,
        count: tables.length,
        data: tables,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTableById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const table = await HotelService.getTableById(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTable(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const validatedData = updateTableSchema.parse(req.body);
      const table = await HotelService.updateTable(id as string, req.tenantId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Table updated successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTable(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await HotelService.deleteTable(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== RESERVATION MANAGEMENT =====

  static async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const validatedData = createReservationSchema.parse(req.body);
      const reservation = await HotelService.createReservation(req.tenantId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReservations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const tableId = req.query.tableId as string;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;

      const result = await HotelService.getReservations(req.tenantId, page, limit, {
        status,
        tableId,
        date,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReservationById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const reservation = await HotelService.getReservationById(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateReservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const validatedData = updateReservationSchema.parse(req.body);
      const reservation = await HotelService.updateReservation(id as string, req.tenantId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Reservation updated successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await HotelService.cancelReservation(id as string, req.tenantId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const stats = await HotelService.getHotelStats(req.tenantId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
