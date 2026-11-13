import config from '../../config/index.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryRateLimitError,
  RepositoryTimeoutError,
} from './repository.errors.js';
import { TreeFilterService } from './tree-filter.service.js';

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
   * Fetch repository tree from GitLab
   */
  static async fetchTree(fullName, revision = 'main', maxEntries = config.ingestion.maxTreeEntries) {
    const encodedPath = encodeURIComponent(fullName);
    const allItems = [];
    let page = 1;
    const perPage = 100;

    try {
      while (allItems.length < maxEntries) {
        const res = await this.request(
          `/projects/${encodedPath}/repository/tree?ref=${encodeURIComponent(revision)}&recursive=true&per_page=${perPage}&page=${page}`
        );
        const items = await res.json();
        if (!Array.isArray(items) || items.length === 0) break;

        allItems.push(...items);
        if (items.length < perPage) break;
        page++;
      }

      return {
        tree: allItems,
        truncated: allItems.length >= maxEntries,
      };
    } catch {
      // Degrade gracefully without crashing if tree fails
      return {
        tree: [],
        truncated: false,
      };
    }
  }

  /**
   * Fetch repository metadata, commit SHA, languages, README, and tree
   */
  static async fetchRepositoryData(fullName) {
    const encodedPath = encodeURIComponent(fullName);

    // 1. Fetch project info
    const projectRes = await this.request(`/projects/${encodedPath}`);
    const data = await projectRes.json();

    const defaultBranch = data.default_branch || 'main';

    // 2. Fetch commit SHA
    let commitSha = null;
    try {
      const commitRes = await this.request(
        `/projects/${encodedPath}/repository/commits?per_page=1&ref_name=${encodeURIComponent(defaultBranch)}`
      );
      const commits = await commitRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        commitSha = commits[0].id || null;
      }
    } catch {
      commitSha = null;
    }

    const revision = commitSha || defaultBranch;

    // 3. Concurrently fetch languages, README, and tree
    const [languagesResult, readmeResult, treeResult] = await Promise.allSettled([
      // Languages breakdown
      this.request(`/projects/${encodedPath}/languages`)
        .then((r) => r.json())
        .catch(() => ({})),

      // README
      this.fetchReadme(fullName, defaultBranch),

      // Repository tree
      this.fetchTree(fullName, revision),
    ]);

    const languages = languagesResult.status === 'fulfilled' ? (languagesResult.value || {}) : {};
    const readme = readmeResult.status === 'fulfilled'
      ? readmeResult.value
      : { content: null, filename: null, byteSize: 0 };
    const rawTree = treeResult.status === 'fulfilled'
      ? treeResult.value
      : { tree: [], truncated: false };

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

    // 4. Process and categorize files using TreeFilterService
    const filteredTree = TreeFilterService.filterAndSelect(rawTree.tree);

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
      tree: {
        revision,
        totalBlobs: filteredTree.totalBlobs,
        totalTrees: filteredTree.totalTrees,
        isTruncated: rawTree.truncated || filteredTree.isTruncated,
        summary: filteredTree.summary,
        relevantFiles: filteredTree.relevantFiles,
      },
    };
  }
}

export default GitLabService;
