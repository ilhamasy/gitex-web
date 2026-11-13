import { validateRepositoryUrl } from '../../validators/url.validator.js';

/**
 * Service for repository URL parsing, provider resolution, and validation.
 */
export class RepositoryService {
  /**
   * Validate repository URL, enforce provider allowlisting and SSRF guards,
   * and return normalized repository identity.
   *
   * @param {string} inputUrl - Raw user input URL
   * @returns {{
   *   valid: boolean,
   *   error?: string,
   *   provider?: 'github' | 'gitlab',
   *   owner?: string,
   *   name?: string,
   *   fullName?: string,
   *   normalizedUrl?: string,
   *   apiUrl?: string
   * }}
   */
  static resolveRepository(inputUrl) {
    const result = validateRepositoryUrl(inputUrl);

    if (!result.valid) {
      return {
        valid: false,
        error: result.error,
      };
    }

    // Determine canonical API endpoint without trusting client inputs
    let apiUrl = '';
    if (result.provider === 'github') {
      apiUrl = `https://api.github.com/repos/${result.fullName}`;
    } else if (result.provider === 'gitlab') {
      // GitLab uses URL-encoded project path for its REST API
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
}

export default RepositoryService;
