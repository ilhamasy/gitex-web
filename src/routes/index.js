import { Router } from 'express';
import homeRoutes from './home.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/', homeRoutes);
router.use('/', healthRoutes);

export default router;

