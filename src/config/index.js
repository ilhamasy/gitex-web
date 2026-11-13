import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 60000,
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  gitlab: {
    token: process.env.GITLAB_TOKEN || '',
  },
  ingestion: {
    maxTreeEntries: parseInt(process.env.MAX_TREE_ENTRIES, 10) || 1000,
    maxRelevantFiles: parseInt(process.env.MAX_RELEVANT_FILES, 10) || 50,
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 100 * 1024, // 100KB
  },
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

export default config;

