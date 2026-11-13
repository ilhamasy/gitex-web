import { Router } from 'express';
import { validateUrl } from '../controllers/repository.controller.js';

const router = Router();

router.post('/api/repository/validate', validateUrl);

export default router;
