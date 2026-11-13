import config from '../../config/index.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryRateLimitError,
  RepositoryTimeoutError,
} from './repository.errors.js';

const GITLAB_API_BASE = 'https://gitlab.com/api/v4';
const DEFAULT_TIMEOUT_MS = 10000;

export class GitLabService {
  /**
   * Internal helper for GitLab REST API requests
   */
  static async request(path, options = {}) {
    const {
      timeoutMs = DEFAULT_TIMEOUT_MS,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${GITLAB_API_BASE}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestHeaders = {
      'User-Agent': 'GitEx-Repository-Analyzer',
      'Accept': 'application/json',
      ...headers,
    };

    if (config.gitlab?.token) {
      requestHeaders['PRIVATE-TOKEN'] = config.gitlab.token;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new RepositoryNotFoundError(`GitLab project '${path}' not found or is private.`, {
            provider: 'gitlab',
          });
        }
        if (response.status === 403 || response.status === 429) {
          throw new RepositoryRateLimitError(
            'GitLab API rate limit exceeded or access forbidden. Please check your token or wait before retrying.',
            {
              provider: 'gitlab',
              statusCode: response.status,
            }
          );
        }
        throw new RepositoryError(`GitLab API error (${response.status}): ${response.statusText}`, {
          provider: 'gitlab',
          statusCode: response.status,
        });
      }

      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new RepositoryTimeoutError('GitLab request timed out after 10s.', {
          provider: 'gitlab',
        });
      }
      if (err instanceof RepositoryError) {
        throw err;
      }
      throw new RepositoryError(`Failed to connect to GitLab: ${err.message}`, {
        provider: 'gitlab',
        details: err,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch README content from repository
   */
  static async fetchReadme(projectPath, defaultBranch = 'main') {
    const encodedPath = encodeURIComponent(projectPath);
    const candidateFiles = ['README.md', 'readme.md', 'README', 'README.rst'];

    for (const filename of candidateFiles) {
      try {
        const encodedFile = encodeURIComponent(filename);
        const res = await this.request(
          `/projects/${encodedPath}/repository/files/${encodedFile}/raw?ref=${encodeURIComponent(defaultBranch)}`
        );
        const text = await res.text();
        return {
          content: text,
          filename,
          byteSize: Buffer.byteLength(text, 'utf8'),
        };
      } catch (err) {
        if (err instanceof RepositoryNotFoundError) {
          continue; // Try next candidate filename
        }
        throw err;
      }
    }

    return {
      content: null,
      filename: null,
      byteSize: 0,
    };
  }

  /**
   * Fetch repository metadata, commit SHA, languages, and README
   */
  static async fetchRepositoryData(fullName) {
    const encodedPath = encodeURIComponent(fullName);

    // 1. Fetch project info
    const projectRes = await this.request(`/projects/${encodedPath}`);
    const data = await projectRes.json();

    const defaultBranch = data.default_branch || 'main';

    // 2. Concurrently fetch commit SHA, languages, and README
    const [commitResult, languagesResult, readmeResult] = await Promise.allSettled([
      // Latest commit SHA
      this.request(`/projects/${encodedPath}/repository/commits?per_page=1&ref_name=${encodeURIComponent(defaultBranch)}`)
        .then((r) => r.json())
        .then((commits) => (Array.isArray(commits) && commits.length > 0 ? commits[0].id : null))
        .catch(() => null),

      // Languages breakdown
      this.request(`/projects/${encodedPath}/languages`)
        .then((r) => r.json())
        .catch(() => ({})),

      // README
      this.fetchReadme(fullName, defaultBranch),
    ]);

    const commitSha = commitResult.status === 'fulfilled' ? commitResult.value : null;
    const languages = languagesResult.status === 'fulfilled' ? (languagesResult.value || {}) : {};
    const readme = readmeResult.status === 'fulfilled'
      ? readmeResult.value
      : { content: null, filename: null, byteSize: 0 };

    // Determine primary language from highest percentage
    let primaryLanguage = null;
    let maxPct = -1;
    for (const [lang, pct] of Object.entries(languages)) {
      if (typeof pct === 'number' && pct > maxPct) {
        maxPct = pct;
        primaryLanguage = lang;
      }
    }

    const owner = data.namespace?.path || data.namespace?.name || fullName.split('/')[0];
    const name = data.path || data.name || fullName.split('/').pop();

    return {
      provider: 'gitlab',
      owner,
      name,
      fullName: data.path_with_namespace || fullName,
      url: data.web_url || `https://gitlab.com/${fullName}`,
      description: data.description || null,
      defaultBranch,
      commitSha,
      language: primaryLanguage,
      languages,
      stars: typeof data.star_count === 'number' ? data.star_count : 0,
      forks: typeof data.forks_count === 'number' ? data.forks_count : 0,
      license: data.license?.key || data.license?.name || null,
      updatedAt: data.last_activity_at || null,
      readme,
    };
  }
}

export default GitLabService;
