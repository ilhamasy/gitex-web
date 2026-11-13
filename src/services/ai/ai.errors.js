/**
 * Error hierarchy for AI Provider operations.
 */

export class AIProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.statusCode = options.statusCode || 500;
    this.provider = options.provider || 'gemini';
    this.code = options.code || 'AI_PROVIDER_ERROR';
    this.details = options.details || null;
  }
}

export class AIAuthenticationError extends AIProviderError {
  constructor(message = 'Gemini API key is missing, invalid, or expired.', options = {}) {
    super(message, { ...options, statusCode: 401, code: 'AI_AUTH_ERROR' });
    this.name = 'AIAuthenticationError';
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor(
    message = 'Gemini Developer API quota or rate limit exceeded. Please verify your quota on Google AI Studio.',
    options = {}
  ) {
    super(message, { ...options, statusCode: 429, code: 'AI_RATE_LIMIT_ERROR' });
    this.name = 'AIRateLimitError';
  }
}

export class AITimeoutError extends AIProviderError {
  constructor(message = 'AI generation request timed out.', options = {}) {
    super(message, { ...options, statusCode: 504, code: 'AI_TIMEOUT_ERROR' });
    this.name = 'AITimeoutError';
  }
}

export class AIGenerationError extends AIProviderError {
  constructor(message = 'Failed to generate analysis content from AI model.', options = {}) {
    super(message, { ...options, statusCode: 502, code: 'AI_GENERATION_ERROR' });
    this.name = 'AIGenerationError';
  }
}

export default {
  AIProviderError,
  AIAuthenticationError,
  AIRateLimitError,
  AITimeoutError,
  AIGenerationError,
};
