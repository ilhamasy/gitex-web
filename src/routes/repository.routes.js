import { Router } from 'express';
import { validateUrl, getRepositoryMetadata } from '../controllers/repository.controller.js';

const router = Router();

router.post('/api/repository/validate', validateUrl);
router.post('/api/repository/metadata', getRepositoryMetadata);

export default router;
