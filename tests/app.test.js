import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('App & Error Handling', () => {
  it('GET / renders the home view', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('text/html'), true);
    assert.ok(res.text.includes('GitEx'));
  });

  it('GET /non-existent-page returns 404 HTML for browser requests', async () => {
    const res = await request(app).get('/non-existent-page');
    assert.equal(res.status, 404);
    assert.equal(res.headers['content-type'].includes('text/html'), true);
    assert.ok(res.text.includes('404'));
  });

  it('GET /api/non-existent-endpoint returns 404 JSON for API requests', async () => {
    const res = await request(app)
      .get('/api/non-existent-endpoint')
      .set('Accept', 'application/json');
    assert.equal(res.status, 404);
    assert.equal(res.headers['content-type'].includes('application/json'), true);
    assert.equal(res.body.error, 'Not Found');
  });

  it('Serves static assets from /public', async () => {
    const res = await request(app).get('/css/style.css');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('--color-canvas'));
  });
});

