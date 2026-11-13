import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Dashboard Shell (GITEX-002)', () => {
  it('GET / renders the GitEx dashboard with 200 OK', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('text/html'), true);
  });

  it('contains GitEx branding and compact navigation', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('GitEx'));
    assert.ok(res.text.includes('Field Notebook'));
    assert.ok(res.text.includes('id="theme-toggle"'));
    assert.ok(res.text.includes('href="/health"'));
    assert.ok(res.text.includes('id="nav-history-link"'));
  });

  it('has repository URL input as the primary action', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('id="repo-url"'));
    assert.ok(res.text.includes('id="btn-analyze"'));
    assert.ok(res.text.includes('Analyze repository'));
    assert.ok(res.text.includes('id="provider-badge"'));
  });

  it('sets dark mode as default and displays supported provider badges', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('data-theme="dark"'));
    assert.ok(res.text.includes('GitHub'));
    assert.ok(res.text.includes('GitLab'));
    assert.equal(res.text.includes('id="btn-example-url"'), false);
  });

  it('renders history section with an informative empty state', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('id="history-section"'));
    assert.ok(res.text.includes('Recent Analyses'));
    assert.ok(res.text.includes('No repositories analyzed yet'));
    assert.ok(res.text.includes('Analysis history is stored locally in this browser'));
  });

  it('satisfies Anti-Slop criteria: no fake testimonials, metrics, or decorative grids', async () => {
    const res = await request(app).get('/');
    const lowercaseHtml = res.text.toLowerCase();
    assert.equal(lowercaseHtml.includes('trusted by 10,000+ developers'), false);
    assert.equal(lowercaseHtml.includes('unlock the power'), false);
    assert.equal(lowercaseHtml.includes('supercharge your workflow'), false);
    assert.equal(lowercaseHtml.includes('testimonial'), false);
  });
});

