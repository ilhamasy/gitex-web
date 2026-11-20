import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { cacheRecord } from '../src/controllers/analysis.controller.js';
import fs from 'node:fs';
import path from 'node:path';

// Load graph parser in Node context
const parserScript = fs.readFileSync(path.resolve(process.cwd(), 'public/js/graph-explorer/graph.parser.js'), 'utf-8');
const runInWindow = new Function('window', `${parserScript}; return window.GitExGraphParser || globalThis.GitExGraphParser;`);
const GitExGraphParser = runInWindow({});

describe('Graph Explorer Feature — GX-001', () => {
  const mockRecord = {
    id: 'test-graph-repo-001',
    fullName: 'awesome-org/microservice-api',
    url: 'https://github.com/awesome-org/microservice-api',
    provider: 'github',
    revision: 'abcdef1234567890',
    language: 'TypeScript',
    stars: 1250,
    status: 'completed',
    analysis: {
      overview: {
        summary: 'A high throughput microservice gateway and API engine.',
        problemSolved: 'Reduces latency for client API aggregation.',
        mainGoal: 'Unified API routing',
      },
      purpose: {
        targetUsers: ['Backend Engineers'],
        capabilities: ['Route proxying', 'Token verification'],
      },
      features: {
        coreFeatures: ['JWT Authentication', 'Rate Limiting', 'PostgreSQL Query Layer'],
      },
      howItWorks: {
        architecture: 'The system uses an Express gateway layer forwarding to internal service workers and PostgreSQL.',
        dataFlow: 'Client sends HTTPS request -> Gateway authenticates via JWT -> Controller dispatches to DB pool -> Response returned.',
        components: [
          { name: 'Gateway Server (src/server.ts)', purpose: 'Entry point initializing express app and routes' },
          { name: 'Auth Controller (src/controllers/auth.controller.ts)', purpose: 'Handles POST /api/auth/login and token signing' },
          { name: 'User Service (src/services/user.service.ts)', purpose: 'Domain logic for user records and credential hashing' },
          { name: 'Database Pool (src/db/pool.ts)', purpose: 'PostgreSQL connection pooling' },
          { name: 'Metrics Collector', purpose: 'Prometheus metrics exporter' },
        ],
        dependencies: ['express', 'pg', 'jsonwebtoken', 'dotenv', 'ioredis'],
      },
      prerequisites: {
        languages: ['Node.js >= 20'],
        tools: ['Docker'],
      },
      installation: {
        steps: [{ title: 'Install dependencies', command: 'npm install' }],
      },
      configuration: {
        environmentVariables: [{ name: 'PORT', purpose: 'Port to listen on' }],
      },
      usage: {
        quickStart: 'Run `npm start` to boot up the gateway.',
      },
      techStack: {
        languages: ['TypeScript', 'SQL'],
        frameworks: ['Express.js'],
        primaryLibraries: ['pg', 'jsonwebtoken', 'zod'],
        infrastructure: ['Docker', 'PostgreSQL', 'Redis'],
      },
      limitations: {
        knownLimitations: ['Requires persistent database connection'],
      },
      alternatives: {
        comparableProjects: ['Kong API Gateway'],
      },
      resources: {
        documentationUrl: 'https://awesome-org.github.io/microservice-api',
      },
    },
  };

  describe('Graph Parser & Dynamic View Detection (Unit)', () => {
    it('successfully parses analysis record into typed nodes and edges', () => {
      const parsed = GitExGraphParser.parseAnalysis(mockRecord);
      assert.ok(parsed, 'Parser returned a result');
      assert.ok(parsed.nodes.length > 5, 'Extracted multiple nodes');
      assert.ok(parsed.edges.length > 3, 'Extracted multiple relationships');
    });

    it('extracts source paths when present in component names', () => {
      const parsed = GitExGraphParser.parseAnalysis(mockRecord);
      const authController = parsed.nodes.find((n) => n.name.includes('Auth Controller'));
      assert.ok(authController, 'Auth controller node found');
      assert.equal(authController.sourceFile, 'src/controllers/auth.controller.ts');
    });

    it('detects available views dynamically based on extracted repo elements', () => {
      const parsed = GitExGraphParser.parseAnalysis(mockRecord);
      const viewIds = parsed.availableViews.map((v) => v.id);

      assert.ok(viewIds.includes('overview'), 'Has Overview view');
      assert.ok(viewIds.includes('architecture'), 'Has Architecture view');
      assert.ok(viewIds.includes('components'), 'Has Components view');
      assert.ok(viewIds.includes('dependencies'), 'Has Dependencies view');
      assert.ok(viewIds.includes('dataModel'), 'Has Data Model view (PostgreSQL detected)');
      assert.ok(viewIds.includes('infrastructure'), 'Has Infrastructure view (Docker/PostgreSQL detected)');
      assert.ok(viewIds.includes('executionFlow'), 'Has Execution Flow view (dataFlow narrative detected)');
      assert.ok(viewIds.includes('apiEndpoints'), 'Has API Endpoints view (controller detected)');
    });

    it('does not generate unavailable/fabricated views when repo lacks support', () => {
      const minimalRecord = {
        fullName: 'minimal/tool',
        analysis: {
          overview: { summary: 'A tiny bash script utility.' },
          howItWorks: {
            architecture: 'Single shell script utility.',
            components: [{ name: 'run.sh', purpose: 'Runs the script' }],
          },
        },
      };

      const parsed = GitExGraphParser.parseAnalysis(minimalRecord);
      const viewIds = parsed.availableViews.map((v) => v.id);

      assert.ok(viewIds.includes('overview'));
      // Should NOT have dataModel, apiEndpoints, or infrastructure views
      assert.ok(!viewIds.includes('dataModel'), 'No dataModel view for tiny script');
      assert.ok(!viewIds.includes('apiEndpoints'), 'No apiEndpoints view for tiny script');
      assert.ok(!viewIds.includes('infrastructure'), 'No infrastructure view for tiny script');
      assert.ok(!viewIds.includes('dependencies'), 'No dependencies view for zero dependency script');
    });

    it('builds view-scoped subgraphs correctly with connected edges', () => {
      const parsed = GitExGraphParser.parseAnalysis(mockRecord);
      const depGraph = parsed.buildGraphForView('dependencies');

      assert.ok(depGraph.nodes.length > 0, 'Dependencies view has nodes');
      const hasPackageNode = depGraph.nodes.some((n) => n.type.toLowerCase() === 'package');
      assert.ok(hasPackageNode, 'Contains package node type');
    });
  });

  describe('Graph Explorer UI & Navigation Integration (HTTP)', () => {
    it('GET /analysis/:id renders the dedicated Graph Explorer workspace and top tabs', async () => {
      // Seed cache
      cacheRecord(mockRecord);

      const res = await request(app)
        .get(`/analysis/${mockRecord.id}`)
        .expect('Content-Type', /html/)
        .expect(200);

      const html = res.text;

      // 1. Top tabs switcher presence
      assert.match(html, /id="tab-nav-graph"/, 'Graph Explorer tab button rendered');
      assert.match(html, /id="tab-nav-docs"/, 'Documentation tab button rendered');
      assert.match(html, /Graph Explorer/, 'Graph Explorer text rendered in navigation');

      // 2. Dedicated Graph Explorer Workspace container
      assert.match(html, /id="graph-explorer-workspace"/, 'Workspace container rendered');
      assert.match(html, /id="graph-views-list"/, 'Views list container rendered');
      assert.match(html, /id="btn-mobile-views-trigger"/, 'Mobile views dropdown trigger rendered');
      assert.match(html, /id="graph-views-modal"/, 'Mobile views modal rendered');
      assert.match(html, /id="graph-search-input"/, 'Search input rendered');
      assert.match(html, /id="graph-filter-chips"/, 'Filter chips container rendered');
      assert.match(html, /id="graph-canvas-viewport"/, 'Canvas viewport rendered');
      assert.match(html, /id="graph-detail-drawer"/, 'Detail slide-over drawer rendered');

      // 3. Script and stylesheet assets included
      assert.match(html, /href="\/css\/graph-explorer\.css(\?[^"]*)?"/, 'Graph Explorer stylesheet linked');
      assert.match(html, /src="\/js\/graph-explorer\/graph\.parser\.js"/, 'Parser script linked');
      assert.match(html, /src="\/js\/graph-explorer\/graph\.engine\.js"/, 'Engine script linked');
      assert.match(html, /src="\/js\/graph-explorer\/graph\.controller\.js"/, 'Controller script linked');

      // 4. Strict preservation of all 12 Documentation sections
      assert.match(html, /id="section-overview"/, 'Section 01 overview preserved');
      assert.match(html, /id="section-purpose"/, 'Section 02 purpose preserved');
      assert.match(html, /id="section-features"/, 'Section 03 features preserved');
      assert.match(html, /id="section-howItWorks"/, 'Section 04 howItWorks preserved');
      assert.match(html, /id="section-prerequisites"/, 'Section 05 prerequisites preserved');
      assert.match(html, /id="section-installation"/, 'Section 06 installation preserved');
      assert.match(html, /id="section-configuration"/, 'Section 07 configuration preserved');
      assert.match(html, /id="section-usage"/, 'Section 08 usage preserved');
      assert.match(html, /id="section-techStack"/, 'Section 09 techStack preserved');
      assert.match(html, /id="section-limitations"/, 'Section 10 limitations preserved');
      assert.match(html, /id="section-alternatives"/, 'Section 11 alternatives preserved');
      assert.match(html, /id="section-resources"/, 'Section 12 resources preserved');
    });
  });
});
