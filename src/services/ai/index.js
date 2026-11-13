import config from '../../config/index.js';
import { GeminiProvider } from './gemini.provider.js';
import { AIProvider } from './ai.provider.js';

export * from './ai.provider.js';
export * from './gemini.provider.js';
export * from './ai.errors.js';

/**
 * Returns the configured default AI provider instance.
 */
export function getDefaultAIProvider() {
  return new GeminiProvider({
    apiKey: config.gemini.apiKey,
    model: config.gemini.model,
    timeoutMs: config.gemini.timeoutMs,
  });
}

export default {
  AIProvider,
  GeminiProvider,
  getDefaultAIProvider,
};
