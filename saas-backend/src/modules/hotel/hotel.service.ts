import prisma from '../../config/database';

export interface CreateTableInput {
  tableNumber: string;
  capacity?: number;
  floor?: string;
  section?: string;
}

export interface UpdateTableInput {
  tableNumber?: string;
  capacity?: number;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  floor?: string;
  section?: string;
}

export interface CreateReservationInput {
  tableId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  reservationTime: Date;
  partySize: number;
  specialRequests?: string;
}

export interface UpdateReservationInput {
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  reservationTime?: Date;
  partySize?: number;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
}

export class HotelService {
  /**
   * Create a new table
   */
  static async createTable(tenantId: string, data: CreateTableInput) {
    // Check table limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true, _count: { select: { hotelTables: true } } },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const planFeatures = tenant.plan.features as any;
    const maxTables = tenant.customLimits
      ? (tenant.customLimits as any).maxTables
      : planFeatures.maxTables;

    if (maxTables !== -1 && tenant._count.hotelTables >= maxTables) {
      throw new Error(
        `Table limit reached. Your ${tenant.plan.displayName} allows ${maxTables} tables. Please upgrade your plan.`
      );
    }

    // Check if table number already exists
    const existing = await prisma.hotelTable.findFirst({
      where: { tenantId, tableNumber: data.tableNumber },
    });

    if (existing) {
      throw new Error('Table number already exists');
    }

    return await prisma.hotelTable.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  /**
   * Get all tables
   */
  static async getTables(
    tenantId: string,
    filters?: {
      status?: string;
      floor?: string;
      section?: string;
    }
  ) {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.floor) {
      where.floor = filters.floor;
    }
    if (filters?.section) {
      where.section = filters.section;
    }

    const tables = await prisma.hotelTable.findMany({
      where,
      include: {
        reservations: {
          where: {
            status: { in: ['pending', 'confirmed'] },
            reservationTime: {
              gte: new Date(),
            },
          },
          take: 1,
          orderBy: { reservationTime: 'asc' },
        },
      },
      orderBy: { tableNumber: 'asc' },
    });

    return tables.map((table) => ({
      ...table,
      nextReservation: table.reservations[0] || null,
      reservations: undefined,
    }));
  }

  /**
   * Get table by ID
   */
  static async getTableById(tableId: string, tenantId: string) {
    const table = await prisma.hotelTable.findFirst({
      where: { id: tableId, tenantId },
      include: {
        reservations: {
          orderBy: { reservationTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    return table;
  }

  /**
   * Update table
   */
  static async updateTable(tableId: string, tenantId: string, data: UpdateTableInput) {
    const table = await prisma.hotelTable.findFirst({
      where: { id: tableId, tenantId },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // Check table number uniqueness if changing
    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
      const existing = await prisma.hotelTable.findFirst({
        where: { tenantId, tableNumber: data.tableNumber },
      });

      if (existing) {
        throw new Error('Table number already exists');
      }
    }

    return await prisma.hotelTable.update({
      where: { id: tableId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete table
   */
  static async deleteTable(tableId: string, tenantId: string) {
    const table = await prisma.hotelTable.findFirst({
      where: { id: tableId, tenantId },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table has active reservations
    const activeReservations = await prisma.reservation.count({
      where: {
        tableId,
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (activeReservations > 0) {
      throw new Error('Cannot delete table with active reservations');
    }

    await prisma.hotelTable.delete({
      where: { id: tableId },
    });

    return { message: 'Table deleted successfully' };
  }

  /**
   * Create reservation
   */
  static async createReservation(tenantId: string, data: CreateReservationInput) {
    // Verify table exists and belongs to tenant
    const table = await prisma.hotelTable.findFirst({
      where: { id: data.tableId, tenantId },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table is available at the requested time (no overlapping reservations)
    const reservationTime = new Date(data.reservationTime);
    const oneHourBefore = new Date(reservationTime.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(reservationTime.getTime() + 60 * 60 * 1000);

    const overlapping = await prisma.reservation.findFirst({
      where: {
        tableId: data.tableId,
        status: { in: ['pending', 'confirmed'] },
        reservationTime: {
          gte: oneHourBefore,
          lte: oneHourAfter,
        },
      },
    });

    if (overlapping) {
      throw new Error('Table already has a reservation around this time');
    }

    return await prisma.reservation.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        table: true,
      },
    });
  }

  /**
   * Get reservations
   */
  static async getReservations(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      date?: Date;
      tableId?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tableId) {
      where.tableId = filters.tableId;
    }

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.reservationTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        include: {
          table: {
            select: {
              id: true,
              tableNumber: true,
              capacity: true,
              floor: true,
              section: true,
            },
          },
        },
        orderBy: { reservationTime: 'asc' },
      }),
      prisma.reservation.count({ where }),
    ]);

    return {
      reservations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get reservation by ID
   */
  static async getReservationById(reservationId: string, tenantId: string) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, tenantId },
      include: {
        table: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    return reservation;
  }

  /**
   * Update reservation
   */
  static async updateReservation(
    reservationId: string,
    tenantId: string,
    data: UpdateReservationInput
  ) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, tenantId },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    return await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        table: true,
      },
    });
  }

  /**
   * Cancel reservation
   */
  static async cancelReservation(reservationId: string, tenantId: string) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, tenantId },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    return { message: 'Reservation cancelled successfully' };
  }

  /**
   * Get hotel statistics
   */
  static async getHotelStats(tenantId: string) {
    const [
      totalTables,
      availableTables,
      occupiedTables,
      totalReservations,
      todayReservations,
    ] = await Promise.all([
      prisma.hotelTable.count({ where: { tenantId } }),
      prisma.hotelTable.count({
        where: { tenantId, status: 'available' },
      }),
      prisma.hotelTable.count({
        where: { tenantId, status: 'occupied' },
      }),
      prisma.reservation.count({ where: { tenantId } }),
      prisma.reservation.count({
        where: {
          tenantId,
          reservationTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables: totalTables - availableTables - occupiedTables,
      totalReservations,
      todayReservations,
      occupancyRate: totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0,
    };
  }
}
