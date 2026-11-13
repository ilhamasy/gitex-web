import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GitHubService } from '../src/services/repository/github.service.js';
import {
  RepositoryNotFoundError,
  RepositoryRateLimitError,
  RepositoryTimeoutError,
} from '../src/services/repository/repository.errors.js';

describe('GitHubService — GITEX-005', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches metadata, commit SHA, languages, and README successfully', async () => {
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/repos/expressjs/express')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: 'express',
            owner: { login: 'expressjs' },
            full_name: 'expressjs/express',
            description: 'Fast, unopinionated, minimalist web framework',
            html_url: 'https://github.com/expressjs/express',
            default_branch: 'master',
            language: 'JavaScript',
            stargazers_count: 65000,
            forks_count: 12000,
            license: { spdx_id: 'MIT', name: 'MIT License' },
            updated_at: '2026-11-10T12:00:00Z',
          }),
        };
      }
      if (urlStr.includes('/commits/master')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ sha: 'a1b2c3d4e5f67890' }),
        };
      }
      if (urlStr.includes('/languages')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ JavaScript: 150000, HTML: 2000 }),
        };
      }
      if (urlStr.includes('/readme')) {
        return {
          ok: true,
          status: 200,
          text: async () => '# Express\nFast web framework for Node.js',
        };
      }
      return { ok: false, status: 404 };
    };

    const data = await GitHubService.fetchRepositoryData('expressjs', 'express');

    assert.equal(data.provider, 'github');
    assert.equal(data.owner, 'expressjs');
    assert.equal(data.name, 'express');
    assert.equal(data.fullName, 'expressjs/express');
    assert.equal(data.defaultBranch, 'master');
    assert.equal(data.commitSha, 'a1b2c3d4e5f67890');
    assert.equal(data.language, 'JavaScript');
    assert.equal(data.languages.JavaScript, 150000);
    assert.equal(data.stars, 65000);
    assert.equal(data.forks, 12000);
    assert.equal(data.license, 'MIT');
    assert.equal(data.readme.filename, 'README.md');
    assert.ok(data.readme.content.includes('# Express'));
    assert.ok(data.readme.byteSize > 0);
  });

  it('handles repository without README gracefully', async () => {
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/repos/owner/no-readme')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: 'no-readme',
            owner: { login: 'owner' },
            full_name: 'owner/no-readme',
            default_branch: 'main',
            stargazers_count: 5,
            forks_count: 1,
            license: null,
            description: null,
          }),
        };
      }
      if (urlStr.includes('/readme')) {
        return { ok: false, status: 404, statusText: 'Not Found' };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };

    const data = await GitHubService.fetchRepositoryData('owner', 'no-readme');

    assert.equal(data.name, 'no-readme');
    assert.equal(data.description, null);
    assert.equal(data.license, null);
    assert.equal(data.readme.content, null);
    assert.equal(data.readme.byteSize, 0);
  });

  it('throws RepositoryNotFoundError on 404', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await assert.rejects(
      async () => {
        await GitHubService.fetchRepositoryData('owner', 'nonexistent');
      },
      RepositoryNotFoundError
    );
  });

  it('throws RepositoryRateLimitError on 403 rate limit', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: {
        get: (h) => (h === 'x-ratelimit-remaining' ? '0' : null),
      },
    });

    await assert.rejects(
      async () => {
        await GitHubService.fetchRepositoryData('owner', 'rate-limited');
      },
      RepositoryRateLimitError
    );
  });
});
