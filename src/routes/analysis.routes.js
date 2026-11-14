import { Router } from 'express';
import {
  analyzeRepository,
  streamAnalysis,
  renderAnalysis,
  translateAnalysis,
} from '../controllers/analysis.controller.js';

const router = Router();

// Pipeline endpoints
router.post('/api/analyze', analyzeRepository);
router.get('/api/analyze/stream', streamAnalysis);
router.get('/api/analysis/:id/translate', translateAnalysis);
router.get('/api/analysis/:id', renderAnalysis);

// View routes
router.get('/analysis', renderAnalysis);
router.get('/analysis/:id', renderAnalysis);

export default router;

