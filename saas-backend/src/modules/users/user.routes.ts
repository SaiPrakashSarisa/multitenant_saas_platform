import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   POST /api/users
 * @desc    Create new user in tenant
 * @access  Private (Owner, Admin)
 */
router.post('/', authorize('owner', 'admin'), UserController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users in tenant
 * @access  Private (Owner, Admin)
 */
router.get('/', authorize('owner', 'admin'), UserController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get specific user
 * @access  Private (Owner, Admin)
 */
router.get('/:id', authorize('owner', 'admin'), UserController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Owner, Admin)
 */
router.put('/:id', authorize('owner', 'admin'), UserController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user
 * @access  Private (Owner, Admin)
 */
router.delete('/:id', authorize('owner', 'admin'), UserController.deleteUser);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private (Own account only)
 */
router.put('/:id/change-password', UserController.changePassword);

export default router;
