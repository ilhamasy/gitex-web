import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ClaudeProvider } from '../src/services/ai/claude.provider.js';
import { getDefaultAIProvider } from '../src/services/ai/index.js';
import {
  AIAuthenticationError,
  AIRateLimitError,
  AITimeoutError,
  AIGenerationError,
} from '../src/services/ai/ai.errors.js';

describe('ClaudeProvider — Multi-Provider AI Support', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fails with AIAuthenticationError if API key is not configured', async () => {
    const provider = new ClaudeProvider({ apiKey: '' });

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

  it('sends x-api-key and anthropic-version headers and returns content on 200', async () => {
    let capturedUrl = '';
    let capturedHeaders = {};
    let capturedBody = null;

    global.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedHeaders = options.headers || {};
      capturedBody = JSON.parse(options.body);

      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 'msg_12345',
            model: 'claude-3-5-sonnet-20241022',
            role: 'assistant',
            content: [{ type: 'text', text: '{"summary":"Repository summary"}' }],
            stop_reason: 'end_turn',
          }),
      };
    };

    const provider = new ClaudeProvider({
      apiKey: 'test-claude-key',
      baseUrl: 'https://custom-claude-proxy.com',
      model: 'claude-3-5-sonnet-20241022',
    });

    const result = await provider.generate('Analyze this code', {
      systemInstruction: 'You are an expert engineer.',
      temperature: 0.1,
    });

    assert.equal(capturedUrl, 'https://custom-claude-proxy.com/v1/messages');
    assert.equal(capturedHeaders['x-api-key'], 'test-claude-key');
    assert.equal(capturedHeaders['anthropic-version'], '2023-06-01');
    assert.equal(capturedBody.model, 'claude-3-5-sonnet-20241022');
    assert.equal(capturedBody.system, 'You are an expert engineer.');
    assert.equal(capturedBody.messages[0].content, 'Analyze this code');
    assert.equal(result.content, '{"summary":"Repository summary"}');
    assert.equal(result.finishReason, 'end_turn');
  });

  it('handles 401 / 403 API key authentication failure', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: 'Invalid API Key' } }),
    });

    const provider = new ClaudeProvider({ apiKey: 'invalid-key' });

    await assert.rejects(
      async () => {
        await provider.generate('Hello');
      },
      (err) => {
        assert.ok(err instanceof AIAuthenticationError);
        assert.equal(err.statusCode, 401);
        assert.ok(err.message.includes('Invalid API Key'));
        return true;
      }
    );
  });

  it('handles 429 rate limit or quota exceeded', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded' } }),
    });

    const provider = new ClaudeProvider({ apiKey: 'test-key' });

    await assert.rejects(
      async () => {
        await provider.generate('Hello');
      },
      (err) => {
        assert.ok(err instanceof AIRateLimitError);
        assert.equal(err.statusCode, 429);
        assert.ok(err.message.includes('Rate limit exceeded'));
        return true;
      }
    );
  });

  it('handles request timeout cleanly', async () => {
    global.fetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };

    const provider = new ClaudeProvider({ apiKey: 'test-key', timeoutMs: 100 });

    await assert.rejects(
      async () => {
        await provider.generate('Hello');
      },
      (err) => {
        assert.ok(err instanceof AITimeoutError);
        assert.equal(err.statusCode, 504);
        return true;
      }
    );
  });

  it('getDefaultAIProvider initializes ClaudeProvider when configured', () => {
    const provider = getDefaultAIProvider();
    assert.ok(provider);
    assert.equal(provider.name, 'anthropic');
  });
});
