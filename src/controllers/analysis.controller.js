import { PipelineService, PIPELINE_STAGES } from '../services/pipeline/pipeline.service.js';
import { MarkdownService } from '../services/render/markdown.service.js';
import { SECTION_KEYS, SECTION_TITLES } from '../models/analysis.schema.js';
import { logger } from '../utils/logger.js';

// In-memory cache for recent analysis runs (id -> record)
const analysisCache = new Map();
const MAX_CACHE_SIZE = 50;

function cacheRecord(record) {
  if (!record || !record.id) return;
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = analysisCache.keys().next().value;
    analysisCache.delete(oldestKey);
  }
  analysisCache.set(record.id, record);
}

export const getCachedRecord = (id) => analysisCache.get(id) || null;

/**
 * Standard non-streaming repository analysis endpoint
 * POST /api/analyze
 */
export const analyzeRepository = async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Repository URL is required.',
      stage: PIPELINE_STAGES.VALIDATING,
    });
  }

  try {
    const record = await PipelineService.run(url.trim());
    cacheRecord(record);

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Analysis pipeline encountered an error.',
      stage: PIPELINE_STAGES.FAILED,
    });
  }
};

/**
 * Server-Sent Events (SSE) streaming analysis endpoint
 * GET /api/analyze/stream?url=...
 */
export const streamAnalysis = async (req, res) => {
  const rawUrl = req.query.url;

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Repository URL query parameter is required.',
    });
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const record = await PipelineService.run(rawUrl.trim(), {
      onStageChange: (stage, message) => {
        sendEvent('stage', { stage, message, timestamp: new Date().toISOString() });
      },
    });

    cacheRecord(record);
    sendEvent('complete', { record });
    res.end();
  } catch (err) {
    logger.error(`[SSE Analysis Error] ${err.message}`);
    sendEvent('error', {
      stage: PIPELINE_STAGES.FAILED,
      message: err.message || 'Analysis failed.',
      recoverable: true,
    });
    res.end();
  }
};

/**
 * Renders the Analysis Viewer page or serves JSON
 * GET /analysis/:id or GET /analysis
 */
export const renderAnalysis = (req, res) => {
  const id = req.params.id || req.query.id;
  const isApi = req.path.startsWith('/api') || req.headers.accept?.includes('application/json');

  let record = id ? getCachedRecord(id) : null;

  if (isApi) {
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Analysis record not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: record,
    });
  }

  // Render view
  res.render('analysis', {
    title: record ? `${record.fullName} — GitEx Analysis` : 'Repository Analysis — GitEx',
    record,
    recordId: id || null,
    sectionKeys: SECTION_KEYS,
    sectionTitles: SECTION_TITLES,
    markdownService: MarkdownService,
  });
};

export default {
  analyzeRepository,
  streamAnalysis,
  renderAnalysis,
  getCachedRecord,
};

