import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Repository Validation API (POST /api/repository/validate)', () => {
  it('returns 200 with repository details for valid GitHub URL', async () => {
    const res = await request(app)
      .post('/api/repository/validate')
      .send({ url: 'https://github.com/expressjs/express' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.provider, 'github');
    assert.equal(res.body.data.owner, 'expressjs');
    assert.equal(res.body.data.name, 'express');
    assert.equal(res.body.data.fullName, 'expressjs/express');
    assert.equal(res.body.data.normalizedUrl, 'https://github.com/expressjs/express');
  });

  it('returns 200 with repository details for valid GitLab URL', async () => {
    const res = await request(app)
      .post('/api/repository/validate')
      .send({ url: 'https://gitlab.com/gitlab-org/gitlab-runner' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.provider, 'gitlab');
    assert.equal(res.body.data.owner, 'gitlab-org');
    assert.equal(res.body.data.name, 'gitlab-runner');
    assert.equal(res.body.data.fullName, 'gitlab-org/gitlab-runner');
  });

  it('returns 400 when URL is empty', async () => {
    const res = await request(app)
      .post('/api/repository/validate')
      .send({ url: '' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
  });

  it('returns 400 when host is unsupported', async () => {
    const res = await request(app)
      .post('/api/repository/validate')
      .send({ url: 'https://bitbucket.org/atlassian/repo' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Only public GitHub'));
  });

  it('returns 400 when URL path is malformed', async () => {
    const res = await request(app)
      .post('/api/repository/validate')
      .send({ url: 'https://github.com/single-part' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Invalid repository path'));
  });
});

describe('Repository Metadata API (POST /api/repository/metadata)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 200 with repository metadata and README', async () => {
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/repos/expressjs/express') && !urlStr.includes('commits') && !urlStr.includes('languages') && !urlStr.includes('readme')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: 'express',
            owner: { login: 'expressjs' },
            full_name: 'expressjs/express',
            description: 'Fast minimalist web framework',
            html_url: 'https://github.com/expressjs/express',
            default_branch: 'master',
            stargazers_count: 65000,
            forks_count: 12000,
            license: { spdx_id: 'MIT' },
            updated_at: '2026-11-10T12:00:00Z',
          }),
        };
      }
      if (urlStr.includes('/commits/master')) {
        return { ok: true, status: 200, json: async () => ({ sha: 'abcdef123' }) };
      }
      if (urlStr.includes('/languages')) {
        return { ok: true, status: 200, json: async () => ({ JavaScript: 1000 }) };
      }
      if (urlStr.includes('/readme')) {
        return { ok: true, status: 200, text: async () => '# Express' };
      }
      return { ok: false, status: 404 };
    };

    const res = await request(app)
      .post('/api/repository/metadata')
      .send({ url: 'https://github.com/expressjs/express' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'express');
    assert.equal(res.body.data.owner, 'expressjs');
    assert.equal(res.body.data.commitSha, 'abcdef123');
    assert.ok(res.body.data.readme.content.includes('# Express'));
  });

  it('returns 400 when URL is empty', async () => {
    const res = await request(app)
      .post('/api/repository/metadata')
      .send({ url: '' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('returns 404 when repository does not exist on provider', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const res = await request(app)
      .post('/api/repository/metadata')
      .send({ url: 'https://github.com/nonexistent/repo' })
      .set('Content-Type', 'application/json');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('not found'));
  });
});

