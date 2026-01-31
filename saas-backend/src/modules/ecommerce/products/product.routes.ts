import { Router } from 'express';
import { EcommerceProductController } from './product.controller';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Special routes
router.get('/featured', EcommerceProductController.getFeatured);
router.get('/low-stock', EcommerceProductController.getLowStock);
router.get('/slug/:slug', EcommerceProductController.getBySlug);

// CRUD routes
router.get('/', EcommerceProductController.getAll);
router.get('/:id', EcommerceProductController.getById);
router.post('/', EcommerceProductController.create);
router.put('/:id', EcommerceProductController.update);
router.delete('/:id', EcommerceProductController.delete);
router.put('/:id/stock', EcommerceProductController.updateStock);

// Image routes
router.post('/:id/images', EcommerceProductController.addImage);
router.delete('/:id/images/:imageId', EcommerceProductController.removeImage);
router.put('/:id/images/:imageId/primary', EcommerceProductController.setImagePrimary);

// Variant routes
router.post('/:id/variants', EcommerceProductController.addVariant);
router.put('/:id/variants/:variantId', EcommerceProductController.updateVariant);
router.delete('/:id/variants/:variantId', EcommerceProductController.deleteVariant);

export default router;
