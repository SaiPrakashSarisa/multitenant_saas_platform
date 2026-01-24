import { Router } from 'express';
import { AdminTenantController } from './admin.tenant.controller';
import { authenticateAdmin } from '../../../middleware/adminAuth';

const router = Router();

// Protect all routes with admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/tenants
 * @desc    List all tenants with filters
 */
router.get('/', AdminTenantController.getAllTenants);

/**
 * @route   GET /api/admin/tenants/:id
 * @desc    Get detailed tenant info
 */
router.get('/:id', AdminTenantController.getTenantById);

/**
 * @route   PUT /api/admin/tenants/:id/suspend
 * @desc    Suspend a tenant
 */
router.put('/:id/suspend', AdminTenantController.suspendTenant);

/**
 * @route   PUT /api/admin/tenants/:id/activate
 * @desc    Activate a suspended tenant
 */
router.put('/:id/activate', AdminTenantController.activateTenant);

export default router;
