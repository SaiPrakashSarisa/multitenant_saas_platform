import bcrypt from 'bcryptjs';
import prisma from '../../config/database';

export interface CreateUserInput {
  email: string;
  password: string;
  role: 'admin' | 'staff';
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserInput {
  email?: string;
  role?: 'admin' | 'staff';
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  /**
   * Create a new user within a tenant
   * Only owner/admin can create users
   */
  static async createUser(tenantId: string, data: CreateUserInput) {
    const { email, password, role, firstName, lastName } = data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Get tenant to check limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check user limit based on plan
    const planFeatures = tenant.plan.features as any;
    const maxUsers = tenant.customLimits 
      ? (tenant.customLimits as any).maxUsers 
      : planFeatures.maxUsers;

    if (maxUsers !== -1 && tenant._count.users >= maxUsers) {
      throw new Error(`User limit reached. Your ${tenant.plan.displayName} allows ${maxUsers} users. Please upgrade your plan.`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        role,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Get all users for a tenant
   */
  static async getUsersByTenant(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({
        where: { tenantId },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single user by ID
   */
  static async getUserById(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId, // Ensure user belongs to the tenant
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, tenantId: string, data: UpdateUserInput) {
    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prevent owner from being modified
    if (existingUser.role === 'owner') {
      throw new Error('Cannot modify owner user');
    }

    // If email is being changed, check if new email exists
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Delete/deactivate user
   */
  static async deleteUser(userId: string, tenantId: string) {
    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prevent owner from being deleted
    if (existingUser.role === 'owner') {
      throw new Error('Cannot delete owner user');
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return { message: 'User deactivated successfully' };
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, data: ChangePasswordInput) {
    const { currentPassword, newPassword } = data;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    return { message: 'Password changed successfully' };
  }
}
