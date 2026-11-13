import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { PipelineService } from '../src/services/pipeline/pipeline.service.js';

describe('Analysis Viewer & Controller — GITEX-011 & GITEX-012', () => {
  const mockRecord = {
    id: 'test-analysis-456',
    provider: 'github',
    owner: 'expressjs',
    name: 'express',
    fullName: 'expressjs/express',
    url: 'https://github.com/expressjs/express',
    revision: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'Fast, unopinionated, minimalist web framework for node.',
    language: 'JavaScript',
    stars: 64000,
    forks: 15000,
    license: 'MIT',
    analyzedAt: '2026-11-13T12:00:00.000Z',
    status: 'completed',
    score: 100,
    analysis: {
      overview: {
        title: 'Repository Overview',
        summary: 'Express is a standard Node.js routing and middleware framework.',
        problemSolved: 'Simplifies writing HTTP servers and APIs.',
        mainGoal: 'Minimalist server foundation.',
        sources: ['package.json', 'README.md'],
      },
      purpose: {
        title: 'Purpose & Use Cases',
        targetUsers: ['Node.js developers', 'Backend engineers'],
        capabilities: ['Routing', 'Middleware execution'],
        scenarios: ['REST APIs', 'Monolith web apps'],
        sources: ['README.md'],
      },
      features: {
        title: 'Key Features',
        coreFeatures: ['Robust routing', 'HTTP helpers', 'Middleware chain'],
        uniqueCapabilities: ['Ultra-minimalist footprint'],
        sources: ['README.md'],
      },
      howItWorks: {
        title: 'How It Works',
        architecture: 'Layered HTTP request pipeline with middleware onion model.',
        components: [{ name: 'Router', description: 'Handles method & path matching', path: 'lib/router/index.js' }],
        dataFlow: 'Request -> Middlewares -> Route Handler -> Response',
        dependencies: ['raw-body', 'router'],
        sources: ['lib/express.js'],
      },
      prerequisites: {
        title: 'Prerequisites',
        runtime: 'Node.js >= 18.0.0',
        languages: ['JavaScript'],
        tools: ['npm or yarn'],
        system: ['POSIX or Windows'],
        sources: ['package.json'],
      },
      installation: {
        title: 'Installation Guide',
        steps: [
          { step: 1, description: 'Install package via npm', command: 'npm install express', verification: 'Check package.json' },
        ],
        caveats: ['Requires Node.js runtime'],
        sources: ['README.md'],
      },
      configuration: {
        title: 'Configuration',
        configFiles: [],
        environmentVariables: [{ name: 'NODE_ENV', description: 'Environment mode', default: 'development' }],
        secrets: [],
        sources: ['lib/application.js'],
      },
      usage: {
        title: 'Usage & Examples',
        quickStart: 'Create an app and listen on a port.',
        commonCommands: [{ description: 'Start app', command: 'node server.js' }],
        codeExamples: [{ title: 'Basic Server', language: 'javascript', code: 'const app = express();\napp.listen(3000);' }],
        sources: ['examples/hello-world/index.js'],
      },
      techStack: {
        title: 'Tech Stack',
        languages: ['JavaScript'],
        frameworks: ['Express'],
        libraries: [{ name: 'statuses', purpose: 'HTTP status utility' }],
        infrastructure: ['Node.js runtime'],
        sources: ['package.json'],
      },
      limitations: {
        title: 'Limitations & Considerations',
        knownLimitations: ['Not full-stack, lacks built-in ORM'],
        compatibility: ['Node.js LTS versions'],
        securityCaveats: ['Requires helmet or security middleware for headers'],
        productionReadiness: 'Battle-tested across millions of production deployments.',
        sources: ['README.md'],
      },
      alternatives: {
        title: 'Alternatives & Similar Projects',
        comparableProjects: [{ name: 'Fastify', distinction: 'Higher JSON throughput and schema validation' }],
        sources: ['README.md'],
      },
      resources: {
        title: 'Official Resources',
        repositoryUrl: 'https://github.com/expressjs/express',
        documentationUrl: 'https://expressjs.com',
        issueTrackerUrl: 'https://github.com/expressjs/express/issues',
        communityLinks: [],
        sources: ['README.md'],
      },
    },
  };

  it('POST /api/analyze validates required URL and returns 400 when missing', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({})
      .expect('Content-Type', /json/)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Repository URL is required/);
  });

  it('POST /api/analyze executes pipeline and returns complete 200 record', async () => {
    mock.method(PipelineService, 'run', async () => mockRecord);

    const res = await request(app)
      .post('/api/analyze')
      .send({ url: 'https://github.com/expressjs/express' })
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, 'test-analysis-456');
    assert.equal(res.body.data.fullName, 'expressjs/express');
  });

  it('GET /analysis/:id renders analysis viewer with 12 sections in fixed canonical order', async () => {
    // Pipeline run earlier cached the record
    const res = await request(app)
      .get('/analysis/test-analysis-456')
      .expect('Content-Type', /html/)
      .expect(200);

    const html = res.text;

    // Check repository identity metadata
    assert.match(html, /expressjs\/express/);
    assert.match(html, /GITHUB/);
    assert.match(html, /SHA:\s*e3b0c44/);
    assert.match(html, /JavaScript/);
    assert.match(html, /Completed/);

    // Check TOC table of contents contains all 12 sections
    assert.match(html, /Table of Contents/);
    assert.match(html, /href="#section-overview"/);
    assert.match(html, /href="#section-purpose"/);
    assert.match(html, /href="#section-features"/);
    assert.match(html, /href="#section-howItWorks"/);
    assert.match(html, /href="#section-prerequisites"/);
    assert.match(html, /href="#section-installation"/);
    assert.match(html, /href="#section-configuration"/);
    assert.match(html, /href="#section-usage"/);
    assert.match(html, /href="#section-techStack"/);
    assert.match(html, /href="#section-limitations"/);
    assert.match(html, /href="#section-alternatives"/);
    assert.match(html, /href="#section-resources"/);

    // Verify canonical section ordering in the reading column
    const overviewIdx = html.indexOf('id="section-overview"');
    const purposeIdx = html.indexOf('id="section-purpose"');
    const featuresIdx = html.indexOf('id="section-features"');
    const howItWorksIdx = html.indexOf('id="section-howItWorks"');
    const prerequisitesIdx = html.indexOf('id="section-prerequisites"');
    const installationIdx = html.indexOf('id="section-installation"');
    const configurationIdx = html.indexOf('id="section-configuration"');
    const usageIdx = html.indexOf('id="section-usage"');
    const techStackIdx = html.indexOf('id="section-techStack"');
    const limitationsIdx = html.indexOf('id="section-limitations"');
    const alternativesIdx = html.indexOf('id="section-alternatives"');
    const resourcesIdx = html.indexOf('id="section-resources"');

    assert.ok(overviewIdx < purposeIdx, '01 overview before 02 purpose');
    assert.ok(purposeIdx < featuresIdx, '02 purpose before 03 features');
    assert.ok(featuresIdx < howItWorksIdx, '03 features before 04 howItWorks');
    assert.ok(howItWorksIdx < prerequisitesIdx, '04 howItWorks before 05 prerequisites');
    assert.ok(prerequisitesIdx < installationIdx, '05 prerequisites before 06 installation');
    assert.ok(installationIdx < configurationIdx, '06 installation before 07 configuration');
    assert.ok(configurationIdx < usageIdx, '07 configuration before 08 usage');
    assert.ok(usageIdx < techStackIdx, '08 usage before 09 techStack');
    assert.ok(techStackIdx < limitationsIdx, '09 techStack before 10 limitations');
    assert.ok(limitationsIdx < alternativesIdx, '10 limitations before 11 alternatives');
    assert.ok(alternativesIdx < resourcesIdx, '11 alternatives before 12 resources');

    // Check code blocks with copy attributes (GITEX-012)
    assert.match(html, /copy-code-btn/);
    assert.match(html, /npm install express/);
    assert.match(html, /data-code=/);

    // Check source badges rendered
    assert.match(html, /package\.json/);

    // Check recommendations callout
    assert.match(html, /callout-recommendation/);
    assert.match(html, /Battle-tested across millions of production deployments/);

    // Check footer copyright on left, tagline on right
    assert.match(html, /© 2026 Ilham Asyari\. All rights reserved\./);
    assert.match(html, /Every Repository, Explained\./);
  });

  it('GET /api/analysis/:id returns JSON data for cached record', async () => {
    const res = await request(app)
      .get('/api/analysis/test-analysis-456')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, 'test-analysis-456');
    assert.equal(res.body.data.fullName, 'expressjs/express');
  });

  it('GET /api/analysis/unknown-id returns 404 JSON', async () => {
    const res = await request(app)
      .get('/api/analysis/unknown-id-999')
      .expect('Content-Type', /json/)
      .expect(404);

    assert.equal(res.body.success, false);
    assert.match(res.body.error, /not found/i);
  });
});

