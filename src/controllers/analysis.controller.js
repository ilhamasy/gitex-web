import fs from 'node:fs';
import path from 'node:path';
import { PipelineService, PIPELINE_STAGES } from '../services/pipeline/pipeline.service.js';
import { MarkdownService } from '../services/render/markdown.service.js';
import { SECTION_KEYS, SECTION_TITLES, SECTION_TITLES_ID } from '../models/analysis.schema.js';
import { TranslationService } from '../services/ai/translation.service.js';
import { logger } from '../utils/logger.js';

// In-memory cache for recent analysis runs (id -> record)
const analysisCache = new Map();
const MAX_CACHE_SIZE = 50;
const CACHE_DIR = process.env.VERCEL
  ? path.resolve('/tmp', 'gitex-analyses')
  : path.resolve(process.cwd(), '.data', 'analyses');

try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (err) {
  logger.warn(`[Cache] Could not initialize disk cache directory: ${err.message}`);
}

export function cacheRecord(record) {
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
    // Purge any existing cached records matching this URL to guarantee a fresh analysis run
    const cleanUrl = url.trim().toLowerCase();
    for (const [key, cached] of analysisCache.entries()) {
      if (cached.url && cached.url.trim().toLowerCase() === cleanUrl) {
        analysisCache.delete(key);
      }
    }

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

  // Setup SSE headers with proxy buffering disabled for Vercel/Nginx
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Content-Encoding', 'none');
  res.flushHeaders?.();

  // Send keepalive ping every 1.5s so connection never drops during LLM generation
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
      res.flush?.();
    } catch {}
  }, 1500);

  const cleanup = () => {
    clearInterval(heartbeat);
  };

  req.on('close', cleanup);

  const sendEvent = (event, data) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.flush?.();
    } catch {}
  };

  try {
    // Purge any existing cached records matching this URL to guarantee a fresh analysis run
    const cleanUrl = rawUrl.trim().toLowerCase();
    for (const [key, cached] of analysisCache.entries()) {
      if (cached.url && cached.url.trim().toLowerCase() === cleanUrl) {
        analysisCache.delete(key);
      }
    }

    const record = await PipelineService.run(rawUrl.trim(), {
      onStageChange: (stage, message) => {
        sendEvent('stage', { stage, message, timestamp: new Date().toISOString() });
      },
    });

    cacheRecord(record);
    sendEvent('complete', { record });
    cleanup();
    setTimeout(() => {
      try { res.end(); } catch {}
    }, 400);
  } catch (err) {
    logger.error(`[SSE Analysis Error] ${err.message}`);
    sendEvent('pipeline-error', {
      stage: PIPELINE_STAGES.FAILED,
      message: err.message || 'Analysis failed.',
      recoverable: true,
    });
    cleanup();
    setTimeout(() => {
      try { res.end(); } catch {}
    }, 400);
  }
};

/**
 * Renders the Analysis Viewer page or serves JSON
 * GET /analysis/:id or GET /analysis
 */
function isStaleTitleOnlyTranslation(record, targetLang) {
  if (targetLang !== 'id' || !record) return false;
  const originalSummary = record.analysis?.overview?.summary;
  const translatedSummary = record.translations?.id?.overview?.summary;
  return Boolean(originalSummary && translatedSummary && originalSummary === translatedSummary);
}

export const renderAnalysis = (req, res) => {
  const id = req.params.id || req.query.id;
  const isApi = req.path.startsWith('/api') || req.headers.accept?.includes('application/json');

  let record = id ? getCachedRecord(id) : null;
  if (!record && req.query.url) {
    const cleanUrl = req.query.url.trim().toLowerCase();
    for (const cached of analysisCache.values()) {
      if (cached.url && cached.url.trim().toLowerCase() === cleanUrl) {
        record = cached;
        break;
      }
    }
  }

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

  const lang = (req.query.lang || 'en').toLowerCase();
  const currentLang = (lang === 'id') ? 'id' : 'en';

  let displayRecord = record;
  if (record && record.analysis && currentLang === 'id') {
    const isStale = isStaleTitleOnlyTranslation(record, 'id');
    const translatedAnalysis = (record.translations && record.translations.id && !isStale)
      ? record.translations.id
      : TranslationService.fallbackTranslate(record.analysis, 'id');
    displayRecord = {
      ...record,
      analysis: translatedAnalysis,
    };
  }

  // Render view
  res.render('analysis', {
    title: record ? `${record.fullName} — GitEx Analysis` : 'Repository Analysis — GitEx',
    record: displayRecord,
    originalRecord: record,
    recordId: id || null,
    currentLang,
    sectionKeys: SECTION_KEYS,
    sectionTitles: currentLang === 'id' ? SECTION_TITLES_ID : SECTION_TITLES,
    sectionTitlesEn: SECTION_TITLES,
    sectionTitlesId: SECTION_TITLES_ID,
    markdownService: MarkdownService,
  });
};

/**
 * Translates an analysis record to the target language (e.g. 'id')
 * GET /api/analysis/:id/translate?lang=id
 */
export const translateAnalysis = async (req, res) => {
  const id = req.params.id || req.query.id;
  const targetLang = (req.query.lang || 'id').toLowerCase();

  const record = getCachedRecord(id);
  if (!record || !record.analysis) {
    return res.status(404).json({
      success: false,
      error: 'Analysis record not found.',
    });
  }

  if (targetLang === 'en') {
    return res.status(200).json({
      success: true,
      lang: 'en',
      analysis: record.analysis,
    });
  }

  const isStale = isStaleTitleOnlyTranslation(record, targetLang);
  if (record.translations && record.translations[targetLang] && !isStale && req.query.fresh !== 'true') {
    return res.status(200).json({
      success: true,
      lang: targetLang,
      analysis: record.translations[targetLang],
    });
  }

  try {
    const translated = await TranslationService.translate(record.analysis, targetLang);
    if (!record.translations) record.translations = {};
    record.translations[targetLang] = translated;
    cacheRecord(record);

    return res.status(200).json({
      success: true,
      lang: targetLang,
      analysis: translated,
    });
  } catch (err) {
    logger.warn(`[Translate Analysis] Translation error: ${err.message}`);
    const fallback = TranslationService.fallbackTranslate(record.analysis, targetLang);
    return res.status(200).json({
      success: true,
      lang: targetLang,
      analysis: fallback,
      fallback: true,
    });
  }
};

/**
 * Deletes an analysis record from memory cache and disk storage
 * DELETE /api/analysis/:id
 */
export const deleteAnalysisRecord = (req, res) => {
  const id = req.params.id || req.query.id;
  const targetUrl = req.query.url;

  let deletedCount = 0;

  if (id && id !== 'all') {
    if (analysisCache.has(id)) {
      analysisCache.delete(id);
      deletedCount++;
    }
    try {
      const filePath = path.join(CACHE_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    } catch (err) {
      logger.warn(`[Cache] Error deleting cache file for ${id}: ${err.message}`);
    }
  }

  // If URL is provided or id === 'all', purge matching
  if (targetUrl || id === 'all') {
    const cleanUrl = targetUrl ? targetUrl.trim().toLowerCase() : null;

    // Purge memory cache
    for (const [key, record] of analysisCache.entries()) {
      if (id === 'all' || (cleanUrl && record.url && record.url.trim().toLowerCase() === cleanUrl)) {
        analysisCache.delete(key);
        deletedCount++;
      }
    }

    // Purge disk cache
    try {
      if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          const filePath = path.join(CACHE_DIR, file);
          if (id === 'all') {
            fs.unlinkSync(filePath);
            deletedCount++;
          } else if (cleanUrl) {
            try {
              const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              if (content.url && content.url.trim().toLowerCase() === cleanUrl) {
                fs.unlinkSync(filePath);
                deletedCount++;
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      logger.warn(`[Cache] Error scanning disk cache for purge: ${err.message}`);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Analysis deleted successfully from cache and storage.',
    deletedCount,
  });
};

export default {
  analyzeRepository,
  streamAnalysis,
  renderAnalysis,
  translateAnalysis,
  deleteAnalysisRecord,
  getCachedRecord,
  cacheRecord,
};

