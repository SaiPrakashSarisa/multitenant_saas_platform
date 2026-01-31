import { Router } from 'express';
import { EcommerceCartController } from './cart.controller';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// All routes require authentication (can be guest or user)
router.use(authenticate);

router.get('/', EcommerceCartController.getCart);
router.post('/items', EcommerceCartController.addItem);
router.put('/items/:itemId', EcommerceCartController.updateItemQuantity);
router.delete('/items/:itemId', EcommerceCartController.removeItem);
router.delete('/', EcommerceCartController.clearCart);

export default router;
