import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GitLabService } from '../src/services/repository/gitlab.service.js';
import {
  RepositoryNotFoundError,
  RepositoryRateLimitError,
} from '../src/services/repository/repository.errors.js';

describe('GitLabService — GITEX-005', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches metadata, commit SHA, languages, and README successfully', async () => {
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/projects/gitlab-org%2Fgitlab-runner') && !urlStr.includes('repository') && !urlStr.includes('languages')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: 'gitlab-runner',
            path: 'gitlab-runner',
            path_with_namespace: 'gitlab-org/gitlab-runner',
            namespace: { path: 'gitlab-org', name: 'GitLab Org' },
            description: 'GitLab Runner daemon',
            web_url: 'https://gitlab.com/gitlab-org/gitlab-runner',
            default_branch: 'main',
            star_count: 2400,
            forks_count: 850,
            license: { key: 'mit', name: 'MIT License' },
            last_activity_at: '2026-11-12T10:00:00Z',
          }),
        };
      }
      if (urlStr.includes('/repository/commits')) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ id: '98765fedcba' }],
        };
      }
      if (urlStr.includes('/languages')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ Go: 85.5, Shell: 14.5 }),
        };
      }
      if (urlStr.includes('/files/README.md/raw')) {
        return {
          ok: true,
          status: 200,
          text: async () => '# GitLab Runner\nOfficial GitLab CI runner',
        };
      }
      if (urlStr.includes('/repository/tree')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            { path: 'go.mod', type: 'blob', size: 800 },
            { path: 'main.go', type: 'blob', size: 1500 },
            { path: 'vendor/pkg/foo.go', type: 'blob', size: 500 },
          ],
        };
      }
      return { ok: false, status: 404 };
    };

    const data = await GitLabService.fetchRepositoryData('gitlab-org/gitlab-runner');

    assert.equal(data.provider, 'gitlab');
    assert.equal(data.owner, 'gitlab-org');
    assert.equal(data.name, 'gitlab-runner');
    assert.equal(data.fullName, 'gitlab-org/gitlab-runner');
    assert.equal(data.defaultBranch, 'main');
    assert.equal(data.commitSha, '98765fedcba');
    assert.equal(data.language, 'Go');
    assert.equal(data.stars, 2400);
    assert.equal(data.forks, 850);
    assert.equal(data.license, 'mit');
    assert.equal(data.readme.filename, 'README.md');
    assert.ok(data.readme.content.includes('# GitLab Runner'));
    assert.ok(data.tree.summary.manifests.includes('go.mod'));
    assert.ok(data.tree.summary.entryPoints.includes('main.go'));
  });

  it('throws RepositoryNotFoundError on 404 project', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await assert.rejects(
      async () => {
        await GitLabService.fetchRepositoryData('nonexistent/project');
      },
      RepositoryNotFoundError
    );
  });

  it('throws RepositoryRateLimitError on 429 rate limit', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await assert.rejects(
      async () => {
        await GitLabService.fetchRepositoryData('rate/limited');
      },
      RepositoryRateLimitError
    );
  });
});

