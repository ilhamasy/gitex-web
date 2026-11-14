import config from '../../config/index.js';
import { GeminiProvider } from './gemini.provider.js';
import { ClaudeProvider } from './claude.provider.js';
import { AIProvider } from './ai.provider.js';

export * from './ai.provider.js';
export * from './gemini.provider.js';
export * from './claude.provider.js';
export * from './ai.errors.js';
export * from './analysis.service.js';

/**
 * Returns the configured default AI provider instance based on environment settings.
 * Supports Anthropic Claude (custom base URL / proxy) and Google Gemini.
 */
export function getDefaultAIProvider() {
  const providerType = (config.aiProvider || '').toLowerCase();

  // Prefer Anthropic if explicitly selected or if Anthropic API key is provided while Gemini is omitted
  if (providerType === 'anthropic' || providerType === 'claude' || (!config.gemini.apiKey && config.anthropic.apiKey)) {
    return new ClaudeProvider({
      apiKey: config.anthropic.apiKey,
      baseUrl: config.anthropic.baseUrl,
      model: config.anthropic.model,
      timeoutMs: config.anthropic.timeoutMs,
    });
  }

  return new GeminiProvider({
    apiKey: config.gemini.apiKey,
    model: config.gemini.model,
    timeoutMs: config.gemini.timeoutMs,
  });
}

export default {
  AIProvider,
  GeminiProvider,
  ClaudeProvider,
  getDefaultAIProvider,
};
