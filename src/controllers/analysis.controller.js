import fs from 'node:fs';
import path from 'node:path';
import { PipelineService, PIPELINE_STAGES } from '../services/pipeline/pipeline.service.js';
import { MarkdownService } from '../services/render/markdown.service.js';
import { SECTION_KEYS, SECTION_TITLES } from '../models/analysis.schema.js';
import { logger } from '../utils/logger.js';

// In-memory cache for recent analysis runs (id -> record)
const analysisCache = new Map();
const MAX_CACHE_SIZE = 50;
const CACHE_DIR = path.resolve(process.cwd(), '.data', 'analyses');

try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (err) {
  logger.warn(`[Cache] Could not initialize disk cache directory: ${err.message}`);
}

function cacheRecord(record) {
  if (!record || !record.id) return;
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = analysisCache.keys().next().value;
    analysisCache.delete(oldestKey);
  }
  analysisCache.set(record.id, record);

  try {
    const filePath = path.join(CACHE_DIR, `${record.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(record), 'utf8');
  } catch (err) {
    logger.warn(`[Cache] Failed to persist analysis to disk: ${err.message}`);
  }
}

export const getCachedRecord = (id) => {
  if (!id) return null;
  if (analysisCache.has(id)) {
    return analysisCache.get(id);
  }
  try {
    const filePath = path.join(CACHE_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      analysisCache.set(id, data);
      return data;
    }
  } catch (err) {
    logger.warn(`[Cache] Failed to read analysis from disk: ${err.message}`);
  }
  return null;
};

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

  // Send keepalive ping every 5s so connection never drops during LLM generation
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {}
  }, 5000);

  const cleanup = () => {
    clearInterval(heartbeat);
  };

  req.on('close', cleanup);

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
    cleanup();
    setTimeout(() => res.end(), 200);
  } catch (err) {
    logger.error(`[SSE Analysis Error] ${err.message}`);
    sendEvent('pipeline-error', {
      stage: PIPELINE_STAGES.FAILED,
      message: err.message || 'Analysis failed.',
      recoverable: true,
    });
    cleanup();
    setTimeout(() => res.end(), 200);
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

