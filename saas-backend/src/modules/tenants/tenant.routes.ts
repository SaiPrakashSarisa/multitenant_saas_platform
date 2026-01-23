import { Router } from 'express';
import { TenantController } from './tenant.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants (Admin only)
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorize('owner'), TenantController.getAllTenants);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get specific tenant by ID
 * @access  Private
 */
router.get('/:id', authenticate, TenantController.getTenantById);

/**
 * @route   PUT /api/tenants/:id
 * @desc    Update tenant information
 * @access  Private (Owner only)
 */
router.put('/:id', authenticate, authorize('owner'), TenantController.updateTenant);

/**
 * @route   PUT /api/tenants/:id/upgrade
 * @desc    Upgrade tenant plan
 * @access  Private (Owner only)
 */
router.put('/:id/upgrade', authenticate, authorize('owner'), TenantController.upgradePlan);

export default router;
