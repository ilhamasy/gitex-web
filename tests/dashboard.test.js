import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Dashboard Shell (GITEX-002)', () => {
  it('GET /app renders the GitEx dashboard with 200 OK', async () => {
    const res = await request(app).get('/app');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('text/html'), true);
  });

  it('contains GitEx branding and compact navigation without language switcher on dashboard', async () => {
    const res = await request(app).get('/app');
    assert.ok(res.text.includes('GitEx'));
    assert.ok(res.text.includes('Field Notebook'));
    assert.ok(res.text.includes('id="theme-toggle"'));
    assert.equal(res.text.includes('class="lang-switch-group nav-lang-switch"'), false);
    assert.equal(res.text.includes('id="nav-btn-lang-en"'), false);
    assert.equal(res.text.includes('id="nav-btn-lang-id"'), false);
  });

  it('has repository URL input as the primary action', async () => {
    const res = await request(app).get('/app');
    assert.ok(res.text.includes('id="repo-url"'));
    assert.ok(res.text.includes('id="btn-analyze"'));
    assert.ok(res.text.includes('id="btn-paste"'));
    assert.ok(res.text.includes('Explain repository'));
    assert.ok(res.text.includes('id="provider-badge"'));
  });

  it('sets dark mode as default and omits the static provider pills under the URL input', async () => {
    const res = await request(app).get('/app');
    assert.ok(res.text.includes('data-theme="dark"'));
    assert.equal(res.text.includes('provider-pill'), false);
    assert.equal(res.text.includes('provider-dot'), false);
    assert.equal(res.text.includes('id="url-hint"'), false);
    assert.ok(res.text.includes('id="provider-badge"'));
    assert.equal(res.text.includes('id="btn-example-url"'), false);
  });

  it('renders history section with an informative empty state', async () => {
    const res = await request(app).get('/app');
    assert.ok(res.text.includes('id="history-section"'));
    assert.ok(res.text.includes('Recent Explains'));
    assert.ok(res.text.includes('No repositories analyzed yet'));
    assert.ok(res.text.includes('Analysis history is stored locally in this browser'));
  });

  it('renders copyright on the left and subtitle on the right in footer', async () => {
    const res = await request(app).get('/app');
    assert.ok(res.text.includes('© 2026 Ilham Asyari. All rights reserved.'));
    assert.ok(res.text.includes('Every Repository, Explained.'));
  });

  it('satisfies Anti-Slop criteria: no fake testimonials, metrics, or decorative grids', async () => {
    const res = await request(app).get('/app');
    const lowercaseHtml = res.text.toLowerCase();
    assert.equal(lowercaseHtml.includes('trusted by 10,000+ developers'), false);
    assert.equal(lowercaseHtml.includes('unlock the power'), false);
    assert.equal(lowercaseHtml.includes('supercharge your workflow'), false);
    assert.equal(lowercaseHtml.includes('testimonial'), false);
  });

  it('renders background progress snackbar and dismiss-to-background actions', async () => {
    const res = await request(app).get('/app');
    assert.ok(res.text.includes('id="gitex-progress-snackbar"'));
    assert.ok(res.text.includes('id="btn-progress-background"'));
    assert.ok(res.text.includes('id="btn-progress-close"'));
    assert.ok(res.text.includes('id="progress-dismiss-container"'));
    assert.ok(res.text.includes('id="btn-snackbar-action"'));
  });
});

