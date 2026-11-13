import config from '../../config/index.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryRateLimitError,
  RepositoryTimeoutError,
} from './repository.errors.js';
import { TreeFilterService } from './tree-filter.service.js';

const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_TIMEOUT_MS = 10000;

export class GitHubService {
  /**
   * Internal helper for GitHub REST API requests
   */
  static async request(path, options = {}) {
    const {
      timeoutMs = DEFAULT_TIMEOUT_MS,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${GITHUB_API_BASE}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestHeaders = {
      'User-Agent': 'GitEx-Repository-Analyzer',
      'Accept': 'application/vnd.github.v3+json',
      ...headers,
    };

    if (config.github?.token) {
      requestHeaders['Authorization'] = `Bearer ${config.github.token}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new RepositoryNotFoundError(`GitHub repository '${path}' not found or is private.`, {
            provider: 'github',
          });
        }
        if (response.status === 403 || response.status === 429) {
          const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
          const resetTime = response.headers.get('x-ratelimit-reset');
          throw new RepositoryRateLimitError(
            'GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN or wait before retrying.',
            {
              provider: 'github',
              details: { rateLimitRemaining, resetTime },
            }
          );
        }
        throw new RepositoryError(`GitHub API error (${response.status}): ${response.statusText}`, {
          provider: 'github',
          statusCode: response.status,
        });
      }

      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new RepositoryTimeoutError('GitHub request timed out after 10s.', {
          provider: 'github',
        });
      }
      if (err instanceof RepositoryError) {
        throw err;
      }
      throw new RepositoryError(`Failed to connect to GitHub: ${err.message}`, {
        provider: 'github',
        details: err,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch README content from repository
   */
  static async fetchReadme(owner, repo) {
    try {
      const res = await this.request(`/repos/${owner}/${repo}/readme`, {
        headers: { Accept: 'application/vnd.github.v3.raw' },
      });
      const text = await res.text();
      return {
        content: text,
        filename: 'README.md',
        byteSize: Buffer.byteLength(text, 'utf8'),
      };
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        return {
          content: null,
          filename: null,
          byteSize: 0,
        };
      }
      throw err;
    }
  }

  /**
   * Fetch raw content of a specific file from GitHub
   */
  static async fetchFileContent(owner, repo, filePath, ref) {
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    const res = await this.request(`/repos/${owner}/${repo}/contents/${filePath}${query}`, {
      headers: { Accept: 'application/vnd.github.v3.raw' },
    });
    return res.text();
  }

  /**
   * Fetch repository directory tree using Git Trees API
   */
  static async fetchTree(owner, repo, treeSha) {
    try {
      const res = await this.request(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`);
      const data = await res.json();
      return {
        tree: Array.isArray(data.tree) ? data.tree : [],
        truncated: Boolean(data.truncated),
      };
    } catch {
      // Degrade gracefully without crashing if tree retrieval fails
      return {
        tree: [],
        truncated: false,
      };
    }
  }

  /**
   * Fetch repository metadata, commit SHA, languages, README, and structured tree
   */
  static async fetchRepositoryData(owner, repo) {
    // 1. Fetch primary repo info
    const repoRes = await this.request(`/repos/${owner}/${repo}`);
    const data = await repoRes.json();

    const defaultBranch = data.default_branch || 'main';

    // 2. Fetch commit SHA for default branch
    let commitSha = null;
    try {
      const commitRes = await this.request(`/repos/${owner}/${repo}/commits/${encodeURIComponent(defaultBranch)}`);
      const commitData = await commitRes.json();
      commitSha = commitData.sha || null;
    } catch {
      commitSha = null;
    }

    const revision = commitSha || defaultBranch;

    // 3. Concurrently fetch languages, README, and tree
    const [languagesResult, readmeResult, treeResult] = await Promise.allSettled([
      // Language byte breakdown
      this.request(`/repos/${owner}/${repo}/languages`)
        .then((r) => r.json())
        .catch(() => ({})),

      // README
      this.fetchReadme(owner, repo),

      // Directory tree
      this.fetchTree(owner, repo, revision),
    ]);

    const languages = languagesResult.status === 'fulfilled' ? (languagesResult.value || {}) : {};
    const readme = readmeResult.status === 'fulfilled'
      ? readmeResult.value
      : { content: null, filename: null, byteSize: 0 };
    const rawTree = treeResult.status === 'fulfilled'
      ? treeResult.value
      : { tree: [], truncated: false };

    // 4. Process and categorize files using TreeFilterService
    const filteredTree = TreeFilterService.filterAndSelect(rawTree.tree);

    return {
      provider: 'github',
      owner: data.owner?.login || owner,
      name: data.name || repo,
      fullName: data.full_name || `${owner}/${repo}`,
      url: data.html_url || `https://github.com/${owner}/${repo}`,
      description: data.description || null,
      defaultBranch,
      commitSha,
      language: data.language || null,
      languages,
      stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
      forks: typeof data.forks_count === 'number' ? data.forks_count : 0,
      license: data.license?.spdx_id || data.license?.name || null,
      updatedAt: data.updated_at || null,
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

export default GitHubService;
