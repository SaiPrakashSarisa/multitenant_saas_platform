import { Router } from 'express';
import { EcommerceCouponController } from './coupon.controller';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer route for validating coupons
router.post('/validate', EcommerceCouponController.validate);

// Admin CRUD routes
router.get('/', EcommerceCouponController.getAll);
router.get('/:id', EcommerceCouponController.getById);
router.post('/', EcommerceCouponController.create);
router.put('/:id', EcommerceCouponController.update);
router.delete('/:id', EcommerceCouponController.delete);

export default router;
