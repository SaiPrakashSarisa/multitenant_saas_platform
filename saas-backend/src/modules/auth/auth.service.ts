import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { generateToken } from '../../utils/jwt';

export interface RegisterInput {
  tenantName: string;
  slug: string;
  businessType: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new tenant with owner user
   * Automatically assigns Free Trial plan for 2 months
   */
  static async register(data: RegisterInput) {
    const { tenantName, slug, businessType, email, password, firstName, lastName } = data;

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new Error('Tenant slug already exists');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Get the Free Trial plan
    const trialPlan = await prisma.plan.findUnique({
      where: { name: 'trial' },
    });

    if (!trialPlan) {
      throw new Error('Trial plan not found. Please run seed script.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate trial end date (60 days from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 60);

    // Create tenant and owner user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug,
          businessType,
          planId: trialPlan.id,
          status: 'trial',
          trialStartDate,
          trialEndDate,
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          role: 'owner',
          firstName,
          lastName,
        },
      });

      // Enable all modules for the new tenant
      const modules = await tx.module.findMany();
      await tx.tenantModule.createMany({
        data: modules.map(module => ({
          tenantId: tenant.id,
          moduleId: module.id,
          isEnabled: true,
        })),
      });

      return { tenant, user };
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role,
    });

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        businessType: result.tenant.businessType,
        status: result.tenant.status,
        trialEndDate: result.tenant.trialEndDate,
      },
    };
  }

  /**
   * Login existing user
   */
  static async login(data: LoginInput) {
    const { email, password } = data;

    // Find user with tenant info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if tenant is suspended
    if (user.tenant.status === 'suspended') {
      throw new Error('Your account has been suspended. Please contact support.');
    }

    // Check if trial has expired
    if (user.tenant.status === 'trial' && user.tenant.trialEndDate) {
      const now = new Date();
      if (now > user.tenant.trialEndDate) {
        // Update status to expired
        await prisma.tenant.update({
          where: { id: user.tenantId },
          data: { status: 'expired' },
        });
        throw new Error('Your trial has expired. Please upgrade to continue.');
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        businessType: user.tenant.businessType,
        status: user.tenant.status,
        plan: user.tenant.plan.displayName,
        trialEndDate: user.tenant.trialEndDate,
      },
    };
  }

  /**
   * Get current user info with permissions
   */
  static async getCurrentUser(userId: string, tenantId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            plan: true,
            tenantModules: {
              where: { isEnabled: true },
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        tenantId,
        role: user.role,
      },
      include: {
        permission: true,
      },
    });

    // If no specific permissions set, assign default permissions based on role
    let permissions: string[] = rolePermissions.map(rp => rp.permission.name);

    // Default permissions for owner role
    if (user.role === 'owner' && permissions.length === 0) {
      const allPermissions = await prisma.permission.findMany();
      permissions = allPermissions.map(p => p.name);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        businessType: user.tenant.businessType,
        status: user.tenant.status,
        plan: user.tenant.plan,
        trialEndDate: user.tenant.trialEndDate,
      },
      enabledModules: user.tenant.tenantModules.map(tm => ({
        id: tm.module.id,
        name: tm.module.name,
        displayName: tm.module.displayName,
      })),
      permissions,
    };
  }
}
