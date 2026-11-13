import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Landing Homepage (feat/add-homepage)', () => {
  it('GET / renders the new homepage with 200 OK', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('text/html'), true);
  });

  it('renders navbar with GitEx wordmark and theme toggle', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('GitEx'));
    assert.ok(res.text.includes('id="theme-toggle"'));
  });

  it('renders hero with GitEx[plain], tagline, description, and Get Started CTA', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('GitEx<span class="title-bracket">[plain]</span>'));
    assert.ok(res.text.includes('Every Repository, Explained.'));
    assert.ok(res.text.includes('Understand any codebase without getting lost in the code.'));
    assert.ok(res.text.includes('GitEx transforms GitHub and GitLab repositories into clear, structured technical guides.'));
    assert.ok(res.text.includes('Get Started'));
    assert.ok(res.text.includes('href="/app"'));
    assert.ok(res.text.includes('Explore repositories. Understand technology. Build with confidence.'));
  });

  it('renders How It Works section with linear workflow', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('How it works'));
    assert.ok(res.text.includes('Paste repository → Analyze → Understand.'));
    assert.ok(res.text.includes('Paste repository'));
    assert.ok(res.text.includes('Analyze'));
    assert.ok(res.text.includes('Understand'));
  });

  it('renders What You\'ll Get section with core sections', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('What you\'ll get'));
    assert.ok(res.text.includes('Overview'));
    assert.ok(res.text.includes('Features'));
    assert.ok(res.text.includes('Architecture'));
    assert.ok(res.text.includes('Prerequisites'));
    assert.ok(res.text.includes('Installation'));
    assert.ok(res.text.includes('Usage'));
  });

  it('renders Supported Platforms section with GitHub and GitLab', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('Supported platforms'));
    assert.ok(res.text.includes('GitHub'));
    assert.ok(res.text.includes('GitLab'));
  });

  it('loads Three.js and Vanta.js NET scripts', async () => {
    const res = await request(app).get('/');
    assert.ok(res.text.includes('/vendor/three.r134.min.js'));
    assert.ok(res.text.includes('/vendor/vanta.net.min.js'));
    assert.ok(res.text.includes('/js/landing.vanta.js'));
    assert.ok(res.text.includes('id="vanta-net-bg"'));
  });

  it('redirects /?url=... directly to /app?url=...', async () => {
    const res = await request(app).get('/?url=https%3A%2F%2Fgithub.com%2Fowner%2Frepo&reanalyze=true');
    assert.equal(res.status, 302);
    assert.ok(res.headers.location.includes('/app?'));
    assert.ok(res.headers.location.includes('reanalyze=true'));
  });
});
