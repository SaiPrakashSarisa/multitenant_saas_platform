import { z } from 'zod';

// Tenant Registration Schema
export const registerSchema = z.object({
  tenantName: z.string().min(2, 'Tenant name must be at least 2 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  businessType: z.enum(['inventory', 'hotel', 'landing', 'expense'], {
    errorMap: () => ({ message: 'Invalid business type' }),
  }),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// User Creation Schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'admin', 'staff']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Tenant Update Schema
export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(['trial', 'active', 'suspended', 'expired']).optional(),
  planId: z.string().uuid().optional(),
  customLimits: z.record(z.any()).optional(),
});
