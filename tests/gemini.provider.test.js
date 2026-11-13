import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GeminiProvider } from '../src/services/ai/gemini.provider.js';
import { AIProvider } from '../src/services/ai/ai.provider.js';
import {
  AIAuthenticationError,
  AIRateLimitError,
  AITimeoutError,
  AIGenerationError,
} from '../src/services/ai/ai.errors.js';

describe('GeminiProvider — GITEX-008', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('masks sensitive API keys safely', () => {
    assert.equal(AIProvider.maskKey(null), '[NOT_SET]');
    assert.equal(AIProvider.maskKey(''), '[NOT_SET]');
    assert.equal(AIProvider.maskKey('short'), '****');
    assert.equal(AIProvider.maskKey('AIzaSyD-1234567890-AbCdEfGhIj'), 'AIza...GhIj');
  });

  it('fails with AIAuthenticationError if API key is not configured', async () => {
    const provider = new GeminiProvider({ apiKey: '' });

    await assert.rejects(
      async () => {
        await provider.generate('Hello');
      },
      (err) => {
        assert.ok(err instanceof AIAuthenticationError);
        assert.equal(err.statusCode, 401);
        assert.ok(err.message.includes('not configured'));
        return true;
      }
    );
  });

  it('sends API key via x-goog-api-key header and generates content on 200', async () => {
    let capturedHeaders = {};
    let capturedUrl = '';
    let capturedBody = null;

    global.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedHeaders = options.headers || {};
      capturedBody = JSON.parse(options.body);

      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{\n  "overview": "Test overview"\n}' }],
              },
              finishReason: 'STOP',
            },
          ],
        }),
      };
    };

    const provider = new GeminiProvider({
      apiKey: 'test-secret-key-12345',
      model: 'gemini-1.5-flash',
    });

    const result = await provider.generate('Analyze this repo', {
      responseMimeType: 'application/json',
      systemInstruction: 'You are GitEx analyzer.',
    });

    // Verify key was sent in header, NOT in URL
    assert.equal(capturedHeaders['x-goog-api-key'], 'test-secret-key-12345');
    assert.equal(capturedUrl.includes('test-secret-key-12345'), false);
    assert.ok(capturedUrl.includes('models/gemini-1.5-flash:generateContent'));

    // Verify payload configuration
    assert.equal(capturedBody.generationConfig.responseMimeType, 'application/json');
    assert.equal(capturedBody.systemInstruction.parts[0].text, 'You are GitEx analyzer.');

    // Verify response parsing
    assert.equal(result.model, 'gemini-1.5-flash');
    assert.equal(result.finishReason, 'STOP');
    assert.ok(result.content.includes('Test overview'));
  });

  it('handles 401 / 403 API_KEY_INVALID error', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({
        error: {
          code: 403,
          message: 'API key not valid. Please pass a valid API key.',
          status: 'API_KEY_INVALID',
        },
      }),
    });

    const provider = new GeminiProvider({ apiKey: 'bad-key' });

    await assert.rejects(
      async () => {
        await provider.generate('Hello');
      },
      (err) => {
        assert.ok(err instanceof AIAuthenticationError);
        assert.equal(err.statusCode, 401);
        assert.ok(err.message.includes('API key not valid'));
        return true;
      }
    );
  });

  it('handles 429 RESOURCE_EXHAUSTED quota error with Developer API guidance', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({
        error: {
          code: 429,
          message: 'Resource has been exhausted (e.g. check quota).',
          status: 'RESOURCE_EXHAUSTED',
        },
      }),
    });

    const provider = new GeminiProvider({ apiKey: 'quota-exhausted-key' });

    await assert.rejects(
      async () => {
        await provider.generate('Hello');
      },
      (err) => {
        assert.ok(err instanceof AIRateLimitError);
        assert.equal(err.statusCode, 429);
        assert.ok(err.message.includes('Google AI Pro'));
        return true;
      }
    );
  });

  it('handles request timeout on AbortError', async () => {
    global.fetch = async (_url, options) => {
      // Simulate timeout
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };

    const provider = new GeminiProvider({ apiKey: 'valid-key', timeoutMs: 1 });

    await assert.rejects(
      async () => {
        await provider.generate('Hello');
      },
      (err) => {
        assert.ok(err instanceof AITimeoutError);
        assert.equal(err.statusCode, 504);
        assert.ok(err.message.includes('timed out'));
        return true;
      }
    );
  });

  it('handles safety block finishReason gracefully', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            finishReason: 'SAFETY',
            safetyRatings: [{ category: 'HARM_CATEGORY_DANGEROUS', probability: 'HIGH' }],
          },
        ],
      }),
    });

    const provider = new GeminiProvider({ apiKey: 'valid-key' });

    await assert.rejects(
      async () => {
        await provider.generate('Question');
      },
      (err) => {
        assert.ok(err instanceof AIGenerationError);
        assert.ok(err.message.includes('safety'));
        return true;
      }
    );
  });

  it('testConnection returns ok: true when ping succeeds', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: { parts: [{ text: 'pong' }] },
            finishReason: 'STOP',
          },
        ],
      }),
    });

    const provider = new GeminiProvider({ apiKey: 'valid-key' });
    const status = await provider.testConnection();

    assert.equal(status.ok, true);
    assert.equal(status.sample, 'pong');
  });

  it('testConnection returns ok: false with error message when failed', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: { message: 'Invalid API key' },
      }),
    });

    const provider = new GeminiProvider({ apiKey: 'invalid' });
    const status = await provider.testConnection();

    assert.equal(status.ok, false);
    assert.ok(status.error.includes('Invalid API key'));
  });
});
