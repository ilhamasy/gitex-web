import config from '../../config/index.js';
import { AIProvider } from './ai.provider.js';
import {
  AIProviderError,
  AIAuthenticationError,
  AIRateLimitError,
  AITimeoutError,
  AIGenerationError,
} from './ai.errors.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiProvider extends AIProvider {
  constructor(options = {}) {
    super('gemini');
    this.apiKey = typeof options.apiKey === 'string' ? options.apiKey : (config.gemini?.apiKey || '');
    this.model = options.model || config.gemini.model || 'gemini-1.5-flash';
    this.timeoutMs = options.timeoutMs || config.gemini.timeoutMs || 60000;
  }

  /**
   * Internal helper to execute HTTP requests to the Gemini Developer API.
   */
  async request(endpoint, payload, options = {}) {
    if (!this.apiKey) {
      throw new AIAuthenticationError(
        'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file or server environment.'
      );
    }

    const timeout = options.timeoutMs || this.timeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const url = `${GEMINI_BASE_URL}/${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey, // Secret passed via header, not URL query parameter
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }

        const errorMessage = errorData?.error?.message || response.statusText;
        const errorStatus = errorData?.error?.status || '';

        if (response.status === 401 || response.status === 403 || errorStatus === 'API_KEY_INVALID' || errorStatus === 'PERMISSION_DENIED') {
          throw new AIAuthenticationError(
            `Gemini API authentication failed: ${errorMessage}. Verify your API key at https://aistudio.google.com.`,
            { details: errorData }
          );
        }

        if (response.status === 429 || errorStatus === 'RESOURCE_EXHAUSTED') {
          throw new AIRateLimitError(
            `Gemini API quota exceeded or rate limited: ${errorMessage}. Note: Google AI Pro subscriptions do not grant Developer API quota. Check your quota at Google AI Studio.`,
            { details: errorData }
          );
        }

        throw new AIProviderError(`Gemini API error (${response.status}): ${errorMessage}`, {
          statusCode: response.status,
          details: errorData,
        });
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new AITimeoutError(`Gemini generation request timed out after ${timeout / 1000}s.`);
      }
      if (err instanceof AIProviderError) {
        throw err;
      }
      throw new AIProviderError(`Network error communicating with Gemini API: ${err.message}`, {
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
   * @param {object} options - Options (systemInstruction, responseMimeType, responseSchema, temperature)
   * @returns {Promise<{ content: string, model: string, finishReason: string, raw: any }>}
   */
  async generate(prompt, options = {}) {
    const modelToUse = options.model || this.model;
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const generationConfig = {
      temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
      topP: typeof options.topP === 'number' ? options.topP : 0.95,
      ...(options.responseMimeType && { responseMimeType: options.responseMimeType }),
      ...(options.responseSchema && { responseSchema: options.responseSchema }),
    };

    const payload = {
      contents,
      generationConfig,
      ...(options.systemInstruction && {
        systemInstruction: {
          parts: [{ text: options.systemInstruction }],
        },
      }),
    };

    const endpoint = `models/${modelToUse}:generateContent`;
    const data = await this.request(endpoint, payload, options);

    const candidate = data.candidates?.[0];
    if (!candidate) {
      const blockReason = data.promptFeedback?.blockReason;
      if (blockReason) {
        throw new AIGenerationError(`Gemini blocked the prompt due to: ${blockReason}`, {
          details: data.promptFeedback,
        });
      }
      throw new AIGenerationError('No candidate response returned from Gemini.', {
        details: data,
      });
    }

    if (candidate.finishReason === 'SAFETY') {
      throw new AIGenerationError('Gemini blocked the completion due to safety thresholds.', {
        details: candidate.safetyRatings,
      });
    }

    const textPart = candidate.content?.parts?.[0]?.text;
    if (typeof textPart !== 'string') {
      throw new AIGenerationError('Gemini returned an empty text response.', {
        details: candidate,
      });
    }

    return {
      content: textPart,
      model: modelToUse,
      finishReason: candidate.finishReason || 'STOP',
      raw: data,
    };
  }

  /**
   * Test the connection to the Gemini API with a minimal ping.
   */
  async testConnection() {
    try {
      const res = await this.generate('Ping. Answer with "pong".', {
        model: this.model,
        timeoutMs: 10000,
      });
      return {
        ok: true,
        model: this.model,
        message: 'Gemini API connection verified.',
        sample: res.content.trim(),
      };
    } catch (err) {
      return {
        ok: false,
        model: this.model,
        error: err.message,
        code: err.code || 'UNKNOWN',
      };
    }
  }
}

export default GeminiProvider;

