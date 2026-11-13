import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Health Check Endpoints', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'gitex-web');
    assert.ok(typeof res.body.uptime === 'number');
    assert.ok(res.body.timestamp);
  });

  it('GET /api/health returns 200 with JSON payload', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('application/json'), true);
    assert.equal(res.body.status, 'ok');
  });
});

