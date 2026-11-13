import { describe, it } from 'node:test';
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

