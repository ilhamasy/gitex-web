/**
 * GitEx — LocalStorage History Management Engine (GITEX-013 & GITEX-014)
 * Source: docs/PRD.md FR-06 & docs/USER-STORIES.md GITEX-013 & GITEX-014
 */

const STORAGE_KEY = 'gitex_history';
const MAX_HISTORY_ITEMS = 25;

// Canonical required 12 section keys
const CANONICAL_SECTION_KEYS = [
  'overview',
  'purpose',
  'features',
  'howItWorks',
  'prerequisites',
  'installation',
  'configuration',
  'usage',
  'techStack',
  'limitations',
  'alternatives',
  'resources',
];

/**
 * Sanitizes and extracts only the allowed persistent record fields.
 * Explicitly strips any Repomix bundles, raw files, secrets, or temporary state.
 */
function sanitizeRecordForStorage(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid analysis record.');
  }

  // Ensure no secrets or API keys can ever be saved
  const forbiddenKeys = ['apiKey', 'GEMINI_API_KEY', 'token', 'authorization', 'secret', 'packedContent'];
  for (const key of forbiddenKeys) {
    if (key in record) {
      delete record[key];
    }
  }

  const id = record.id || `gitex-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const provider = record.provider === 'gitlab' ? 'gitlab' : 'github';
  const fullName = String(record.fullName || `${record.owner || 'unknown'}/${record.name || 'repo'}`).trim();
  const owner = String(record.owner || fullName.split('/')[0] || '').trim();
  const name = String(record.name || fullName.split('/')[1] || '').trim();
  const url = String(record.url || '').trim();
  const revision = String(record.revision || 'unknown').trim();
  const analyzedAt = record.analyzedAt || new Date().toISOString();
  const status = ['completed', 'partial', 'failed', 'generating'].includes(record.status) ? record.status : 'completed';
  const score = typeof record.score === 'number' ? Math.max(0, Math.min(100, record.score)) : 100;
  const description = typeof record.description === 'string' ? record.description : null;
  const language = typeof record.language === 'string' ? record.language : null;
  const stars = typeof record.stars === 'number' ? record.stars : 0;
  const forks = typeof record.forks === 'number' ? record.forks : 0;
  const license = typeof record.license === 'string' ? record.license : null;
  const defaultBranch = typeof record.defaultBranch === 'string' ? record.defaultBranch : 'main';

  // Sanitize 12-section analysis payload
  const rawAnalysis = record.analysis || {};
  const cleanAnalysis = {};

  CANONICAL_SECTION_KEYS.forEach((key) => {
    const section = rawAnalysis[key] || {};
    cleanAnalysis[key] = {
      title: section.title || key,
      ...section,
    };
    if ('packedContent' in cleanAnalysis[key]) delete cleanAnalysis[key].packedContent;
    if ('fileContent' in cleanAnalysis[key]) delete cleanAnalysis[key].fileContent;
  });

  return {
    id,
    provider,
    owner,
    name,
    fullName,
    url,
    revision,
    description,
    language,
    stars,
    forks,
    license,
    defaultBranch,
    analyzedAt,
    status,
    score,
    analysis: cleanAnalysis,
    missingSections: Array.isArray(record.missingSections) ? record.missingSections : [],
    repaired: Boolean(record.repaired),
  };
}

/**
 * Validates a record retrieved from storage to ensure it conforms to schema.
 */
function validateStoredRecord(record) {
  if (!record || typeof record !== 'object') return false;
  if (typeof record.id !== 'string' || !record.id.trim()) return false;
  if (typeof record.fullName !== 'string' || !record.fullName.trim()) return false;
  if (typeof record.url !== 'string' || !record.url.trim()) return false;
  if (!record.analysis || typeof record.analysis !== 'object') return false;

  const hasCanonicalSection = CANONICAL_SECTION_KEYS.some((key) => key in record.analysis);
  if (!hasCanonicalSection) return false;

  return true;
}

/**
 * Safe storage wrapper handling QuotaExceededError and quota pruning.
 */
function safeSetItem(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (err) {
    const isQuotaError =
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014;

    if (!isQuotaError) {
      throw err;
    }
    return false;
  }
}

export const GitExHistory = {
  STORAGE_KEY,
  MAX_ITEMS: MAX_HISTORY_ITEMS,

  getStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    return null;
  },

  getAll() {
    const storage = this.getStorage();
    if (!storage) return [];

    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(validateStoredRecord);
    } catch (err) {
      console.warn('[GitEx History] Corrupted history data detected. Returning empty list.', err);
      return [];
    }
  },

  getById(id) {
    if (!id || typeof id !== 'string') return null;
    const all = this.getAll();
    return all.find((item) => item.id === id) || null;
  },

  getByUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim().toLowerCase();
    const all = this.getAll();
    return all.find((item) => item.url && item.url.toLowerCase() === cleanUrl) || null;
  },

  save(record) {
    const storage = this.getStorage();
    if (!storage) return null;

    const cleanRecord = sanitizeRecordForStorage(record);
    let list = this.getAll();

    // Deduplicate: remove any existing entry with same id OR same repository URL (regardless of revision or temp status)
    const normalizeUrl = (u) => String(u || '').trim().toLowerCase().replace(/\.git$/i, '').replace(/\/+$/, '');
    const cleanNormUrl = normalizeUrl(cleanRecord.url);

    list = list.filter((item) => {
      if (item.id === cleanRecord.id) return false;
      if (cleanNormUrl && normalizeUrl(item.url) === cleanNormUrl) return false;
      return true;
    });

    list.unshift(cleanRecord);

    if (list.length > MAX_HISTORY_ITEMS) {
      list = list.slice(0, MAX_HISTORY_ITEMS);
    }

    let serialized = JSON.stringify(list);
    let success = safeSetItem(storage, STORAGE_KEY, serialized);

    while (!success && list.length > 1) {
      console.warn('[GitEx History] LocalStorage quota reached. Pruning oldest record...');
      list.pop();
      serialized = JSON.stringify(list);
      success = safeSetItem(storage, STORAGE_KEY, serialized);
    }

    if (!success) {
      console.error('[GitEx History] Unable to save record: storage quota completely exhausted.');
      return null;
    }

    return cleanRecord;
  },

  delete(idOrUrl) {
    const storage = this.getStorage();
    if (!storage || !idOrUrl) return false;

    const target = String(idOrUrl).trim().toLowerCase();
    const list = this.getAll().filter((item) => {
      if (item.id === idOrUrl) return false;
      if (item.url && item.url.trim().toLowerCase() === target) return false;
      if (item.fullName && item.fullName.trim().toLowerCase() === target) return false;
      return true;
    });

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      console.warn('[GitEx History] Failed to save updated history after deletion:', err);
      return false;
    }
  },

  deleteByUrl(url) {
    return this.delete(url);
  },

  clear() {
    const storage = this.getStorage();
    if (!storage) return false;

    try {
      storage.removeItem(STORAGE_KEY);
      return true;
    } catch (err) {
      console.warn('[GitEx History] Failed to clear history from storage:', err);
      return false;
    }
  },

  isEmpty() {
    return this.getAll().length === 0;
  },

  sanitizeRecord: sanitizeRecordForStorage,
  validateRecord: validateStoredRecord,
};

// Also attach to global window in browser environments
if (typeof window !== 'undefined') {
  window.GitExHistory = GitExHistory;
}

export default GitExHistory;
