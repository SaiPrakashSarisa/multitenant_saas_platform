import prisma from '../../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-this';
const ADMIN_JWT_EXPIRES_IN = '1d';

export class AdminAuthService {
  /**
   * Admin Login
   */
  static async login(email: string, password: string) {
    const admin = await prisma.platformAdmin.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate Admin Token
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin', // Distinguish from tenant tokens
      },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES_IN as any }
    );

    // Log login action
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'login',
        targetType: 'system',
        details: { method: 'email_password' },
      },
    });

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    };
  }

  /**
   * Get Admin Profile
   */
  static async getProfile(adminId: string) {
    const admin = await prisma.platformAdmin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  }
}
