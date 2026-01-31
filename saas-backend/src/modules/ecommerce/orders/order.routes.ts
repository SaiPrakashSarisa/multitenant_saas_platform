import { Router } from 'express';
import { EcommerceOrderController } from './order.controller';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.get('/my-orders', EcommerceOrderController.getMyOrders);
router.post('/checkout', EcommerceOrderController.checkout);

// Analytics routes
router.get('/analytics/sales', EcommerceOrderController.getSalesSummary);
router.get('/analytics/top-products', EcommerceOrderController.getTopProducts);

// Admin/general routes
router.get('/', EcommerceOrderController.getAll);
router.get('/:id', EcommerceOrderController.getById);
router.put('/:id/status', EcommerceOrderController.updateStatus);
router.post('/:id/cancel', EcommerceOrderController.cancelOrder);

export default router;
