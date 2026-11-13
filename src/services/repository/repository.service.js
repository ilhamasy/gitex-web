import { validateRepositoryUrl } from '../../validators/url.validator.js';
import { GitHubService } from './github.service.js';
import { GitLabService } from './gitlab.service.js';
import { RepositoryError, RepositoryNotFoundError } from './repository.errors.js';

/**
 * Orchestrator service for repository URL resolution, metadata fetching, and README retrieval.
 */
export class RepositoryService {
  /**
   * Validate repository URL, enforce provider allowlisting and SSRF guards,
   * and return normalized repository identity.
   */
  static resolveRepository(inputUrl) {
    const result = validateRepositoryUrl(inputUrl);

    if (!result.valid) {
      return {
        valid: false,
        error: result.error,
      };
    }

    let apiUrl = '';
    if (result.provider === 'github') {
      apiUrl = `https://api.github.com/repos/${result.fullName}`;
    } else if (result.provider === 'gitlab') {
      const encodedPath = encodeURIComponent(result.fullName);
      apiUrl = `https://gitlab.com/api/v4/projects/${encodedPath}`;
    }

    return {
      valid: true,
      provider: result.provider,
      owner: result.owner,
      name: result.name,
      fullName: result.fullName,
      normalizedUrl: result.normalizedUrl,
      apiUrl,
    };
  }

  /**
   * Fetch repository metadata and README using the detected provider service.
   *
   * @param {string} inputUrl - Raw user repository URL
   * @returns {Promise<{
   *   provider: 'github' | 'gitlab',
   *   owner: string,
   *   name: string,
   *   fullName: string,
   *   url: string,
   *   description: string | null,
   *   defaultBranch: string,
   *   commitSha: string | null,
   *   language: string | null,
   *   languages: Record<string, number>,
   *   stars: number,
   *   forks: number,
   *   license: string | null,
   *   updatedAt: string | null,
   *   readme: {
   *     content: string | null,
   *     filename: string | null,
   *     byteSize: number,
   *   }
   * }>}
   */
  static async fetchMetadataAndReadme(inputUrl) {
    const resolved = this.resolveRepository(inputUrl);

    if (!resolved.valid) {
      throw new RepositoryError(resolved.error, { statusCode: 400 });
    }

    if (resolved.provider === 'github') {
      return GitHubService.fetchRepositoryData(resolved.owner, resolved.name);
    }

    if (resolved.provider === 'gitlab') {
      return GitLabService.fetchRepositoryData(resolved.fullName);
    }

    throw new RepositoryError(`Unsupported repository provider: ${resolved.provider}`, {
      statusCode: 400,
    });
  }

  /**
   * Fetch recursive directory tree using the detected provider service.
   *
   * @param {string} inputUrl - Raw user repository URL
   * @param {object} [options]
   * @param {string} [options.ref] - Branch or commit SHA
   * @returns {Promise<{ tree: Array<object>, truncated: boolean }>}
   */
  static async fetchTree(inputUrl, options = {}) {
    const resolved = this.resolveRepository(inputUrl);

    if (!resolved.valid) {
      throw new RepositoryError(resolved.error, { statusCode: 400 });
    }

    if (resolved.provider === 'github') {
      return GitHubService.fetchTree(resolved.owner, resolved.name, options.ref || 'HEAD');
    }

    if (resolved.provider === 'gitlab') {
      return GitLabService.fetchTree(resolved.fullName, options.ref || 'HEAD');
    }

    throw new RepositoryError(`Unsupported repository provider: ${resolved.provider}`, {
      statusCode: 400,
    });
  }
}

export default RepositoryService;
