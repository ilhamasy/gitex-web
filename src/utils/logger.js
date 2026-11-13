/**
 * Safe logger that redacts API keys, tokens, and credentials.
 */

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z-_]{30,45}/g,                    // Google API Key
  /ghp_[0-9A-Za-z]{30,50}/g,                      // GitHub Personal Access Token
  /github_pat_[0-9A-Za-z_]{70,95}/g,              // GitHub Fine-grained PAT
  /glpat-[0-9A-Za-z_-]{15,35}/g,                  // GitLab Personal Access Token
  /Bearer\s+[A-Za-z0-9-_.]+/gi,                   // Bearer tokens
  /key=[A-Za-z0-9-_]+/gi,                         // Query param keys
  /token=[A-Za-z0-9-_]+/gi,                       // Query param tokens
  /password=[^&\s]+/gi,                           // Password fields
];

export function sanitizeSecrets(text) {
  if (typeof text !== 'string') return text;
  let sanitized = text;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export const logger = {
  sanitize: sanitizeSecrets,
  info: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(sanitizeSecrets(String(msg)), ...args.map(a => typeof a === 'string' ? sanitizeSecrets(a) : a));
    }
  },
  warn: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(sanitizeSecrets(String(msg)), ...args.map(a => typeof a === 'string' ? sanitizeSecrets(a) : a));
    }
  },
  error: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(sanitizeSecrets(String(msg)), ...args.map(a => typeof a === 'string' ? sanitizeSecrets(a) : a));
    }
  },
};

export default logger;
