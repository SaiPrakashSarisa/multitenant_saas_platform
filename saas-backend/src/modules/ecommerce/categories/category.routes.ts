import { Router } from 'express';
import { EcommerceCategoryController } from './category.controller';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes
router.get('/', EcommerceCategoryController.getAll);
router.get('/tree', EcommerceCategoryController.getTree);
router.get('/slug/:slug', EcommerceCategoryController.getBySlug);
router.get('/:id', EcommerceCategoryController.getById);

// Write routes (typically admin/owner only)
router.post('/', EcommerceCategoryController.create);
router.put('/reorder', EcommerceCategoryController.reorder);
router.put('/:id', EcommerceCategoryController.update);
router.delete('/:id', EcommerceCategoryController.delete);

export default router;
