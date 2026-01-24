import { Router } from 'express';
import { AdminPlanController } from './admin.plans.controller';
import { authenticateAdmin } from '../../../middleware/adminAuth';

const router = Router();

router.use(authenticateAdmin);

router.post('/', AdminPlanController.create);
router.get('/', AdminPlanController.getAll);
router.put('/:id', AdminPlanController.update);
router.delete('/:id', AdminPlanController.delete);

export default router;
