import prisma from '../../../config/database';
import os from 'os';

export class AdminSystemService {
  /**
   * Get System Health & Performance Stats
   */
  static async getSystemStats() {
    // Check Database Connection
    let dbStatus = 'disconnected';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }

    // Memory Usage
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalMemory = os.totalmem() / 1024 / 1024;
    
    // Uptime
    const uptime = process.uptime();

    return {
      status: 'operational',
      uptime: Math.floor(uptime), // Seconds
      timestamp: new Date(),
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        memoryUsageMB: Math.round(usedMemory),
        totalMemoryMB: Math.round(totalMemory),
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      },
    };
  }

  /**
   * Get Audit Logs
   */
  static async getAuditLogs(page: number = 1, limit: number = 20, type?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (type) {
      where.targetType = type;
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
