/**
 * Custom error hierarchy for repository provider operations.
 */

export class RepositoryError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'RepositoryError';
    this.statusCode = options.statusCode || 500;
    this.provider = options.provider || null;
    this.details = options.details || null;
  }
}

export class RepositoryNotFoundError extends RepositoryError {
  constructor(message = 'Repository not found or is private.', options = {}) {
    super(message, { ...options, statusCode: 404 });
    this.name = 'RepositoryNotFoundError';
  }
}

export class RepositoryRateLimitError extends RepositoryError {
  constructor(message = 'Repository API rate limit exceeded.', options = {}) {
    super(message, { ...options, statusCode: 429 });
    this.name = 'RepositoryRateLimitError';
  }
}

export class RepositoryTimeoutError extends RepositoryError {
  constructor(message = 'Request to repository provider timed out.', options = {}) {
    super(message, { ...options, statusCode: 504 });
    this.name = 'RepositoryTimeoutError';
  }
}

export default {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryRateLimitError,
  RepositoryTimeoutError,
};

