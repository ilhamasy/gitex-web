import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { TrendingService } from '../src/services/repository/trending.service.js';

describe('Trending Repositories Feature — #Trending on GitHub', () => {
  describe('TrendingService', () => {
    it('returns top 5 trending repositories for period "today"', async () => {
      const repos = await TrendingService.getTrendingRepositories('today');
      assert.ok(Array.isArray(repos));
      assert.equal(repos.length, 5);

      const first = repos[0];
      assert.ok(first.name);
      assert.ok(first.fullName);
      assert.ok(first.url);
      assert.ok(typeof first.stars === 'number');
      assert.ok(typeof first.forks === 'number');
      assert.ok(first.url.startsWith('https://github.com/'));
    });

    it('returns top 5 trending repositories for period "week"', async () => {
      const repos = await TrendingService.getTrendingRepositories('week');
      assert.ok(Array.isArray(repos));
      assert.equal(repos.length, 5);
      assert.ok(repos.every((r) => r.fullName && r.url));
    });

    it('returns top 5 trending repositories for period "month"', async () => {
      const repos = await TrendingService.getTrendingRepositories('month');
      assert.ok(Array.isArray(repos));
      assert.equal(repos.length, 5);
      assert.ok(repos.every((r) => r.fullName && r.url));
    });

    it('falls back safely to "today" when period is unknown', async () => {
      const repos = await TrendingService.getTrendingRepositories('unknown-period');
      assert.ok(Array.isArray(repos));
      assert.equal(repos.length, 5);
    });
  });

  describe('GET /api/repository/trending', () => {
    it('returns 200 JSON with 5 items for default query', async () => {
      const res = await request(app)
        .get('/api/repository/trending')
        .expect('Content-Type', /json/)
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.period, 'today');
      assert.equal(res.body.count, 5);
      assert.ok(Array.isArray(res.body.data));
      assert.equal(res.body.data.length, 5);
    });

    it('returns 200 JSON with 5 items for week query', async () => {
      const res = await request(app)
        .get('/api/repository/trending?period=week')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.period, 'week');
      assert.equal(res.body.count, 5);
      assert.ok(Array.isArray(res.body.data));
    });

    it('returns 200 JSON with 5 items for month query', async () => {
      const res = await request(app)
        .get('/api/repository/trending?period=month')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.period, 'month');
      assert.equal(res.body.count, 5);
      assert.ok(Array.isArray(res.body.data));
    });
  });

  describe('UI Elements on /app', () => {
    it('renders the discovery tabs including #Trending and timeframe pills', async () => {
      const res = await request(app).get('/app').expect(200);

      assert.ok(res.text.includes('id="tab-btn-history"'));
      assert.ok(res.text.includes('id="tab-btn-trending"'));
      assert.ok(res.text.includes('id="panel-history"'));
      assert.ok(res.text.includes('id="panel-trending"'));
      assert.ok(res.text.includes('data-period="today"'));
      assert.ok(res.text.includes('data-period="week"'));
      assert.ok(res.text.includes('data-period="month"'));
      assert.ok(res.text.includes('id="gitex-toast"'));
    });
  });
});
