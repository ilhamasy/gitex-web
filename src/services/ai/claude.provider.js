import { AIProvider } from './ai.provider.js';
import {
  AIProviderError,
  AIAuthenticationError,
  AIRateLimitError,
  AITimeoutError,
  AIGenerationError,
} from './ai.errors.js';
import config from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export class ClaudeProvider extends AIProvider {
  /**
   * Constructs an Anthropic Claude provider instance.
   *
   * @param {object} options
   * @param {string} [options.apiKey] - Anthropic API key
   * @param {string} [options.baseUrl] - Base URL (e.g. proxy or https://api.anthropic.com)
   * @param {string} [options.model] - Model name (e.g. claude-3-5-sonnet-20241022)
   * @param {number} [options.timeoutMs] - Request timeout in milliseconds
   */
  constructor(options = {}) {
    super('anthropic');
    this.apiKey = typeof options.apiKey === 'string' ? options.apiKey : (config.anthropic?.apiKey || '');
    this.baseUrl = (options.baseUrl || config.anthropic?.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
    this.model = options.model || config.anthropic?.model || 'claude-3-5-sonnet-20241022';
    this.timeoutMs = options.timeoutMs || config.anthropic?.timeoutMs || 90000;
  }

  /**
   * Internal HTTP request wrapper for Anthropic Messages API
   */
  async request(endpoint, payload, options = {}) {
    if (!this.apiKey) {
      throw new AIAuthenticationError('Anthropic API key is not configured.', {
        provider: 'anthropic',
      });
    }

    const controller = new AbortController();
    const timeout = options.timeoutMs || this.timeoutMs;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: { message: responseText } };
      }

      if (!response.ok) {
        const errorMsg = data.error?.message || responseText || `HTTP ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          throw new AIAuthenticationError(
            `Anthropic API authentication failed (${errorMsg}). Please check your ANTHROPIC_API_KEY.`,
            { provider: 'anthropic', statusCode: response.status, details: data }
          );
        }

        if (response.status === 429) {
          throw new AIRateLimitError(
            `Anthropic API rate limit or quota exceeded: ${errorMsg}`,
            { provider: 'anthropic', statusCode: 429, details: data }
          );
        }

        throw new AIProviderError(`Anthropic API error (${response.status}): ${errorMsg}`, {
          provider: 'anthropic',
          statusCode: response.status,
          details: data,
        });
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new AITimeoutError(`Anthropic generation request timed out after ${timeout / 1000}s.`, {
          provider: 'anthropic',
        });
      }
      if (err instanceof AIProviderError) {
        throw err;
      }
      throw new AIProviderError(`Network error communicating with Anthropic API: ${err.message}`, {
        provider: 'anthropic',
        details: err,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate text or structured content from a prompt.
   *
   * @param {string} prompt - Main prompt text
   * @param {object} options - Options (systemInstruction, temperature, maxTokens, model)
   * @returns {Promise<{ content: string, model: string, finishReason: string, raw: any }>}
   */
  async generate(prompt, options = {}) {
    const modelToUse = options.model || this.model;

    const payload = {
      model: modelToUse,
      max_tokens: options.maxTokens || 8192,
      temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      ...(options.systemInstruction && { system: options.systemInstruction }),
    };

    const data = await this.request('/v1/messages', payload, options);

    const textContent = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!textContent) {
      throw new AIGenerationError('No text content returned from Anthropic Claude model.', {
        provider: 'anthropic',
        details: data,
      });
    }

    return {
      content: textContent,
      model: data.model || modelToUse,
      finishReason: data.stop_reason || 'end_turn',
      raw: data,
    };
  }

  /**
   * Verify Anthropic connectivity and API key validity with a lightweight test call.
   */
  async testConnection() {
    if (!this.apiKey) {
      return { ok: false, message: 'Anthropic API key is not configured.' };
    }
    try {
      await this.generate('ping', { maxTokens: 5 });
      return { ok: true, message: 'Connected to Anthropic API successfully.' };
    } catch (err) {
      logger.warn(`[ClaudeProvider] Connection test failed: ${err.message}`);
      return { ok: false, message: err.message };
    }
  }
}

export default ClaudeProvider;
