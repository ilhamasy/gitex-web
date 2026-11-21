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

describe('API Endpoints & Database ERD Feature — fix/graph-endpoint-erd', () => {
  const spendwiseRecord = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), '.data/analyses/ef76fba8-1c34-4e4f-ad24-0b0d939bd5a6.json'), 'utf-8')
  );

  describe('API Endpoints Extraction & Specifications', () => {
    it('extracts all endpoints with methods, paths, request headers, request bodies, and responses', () => {
      const parsed = GitExGraphParser.parseAnalysis(spendwiseRecord);
      assert.ok(parsed, 'Parser returned a result');

      const epView = parsed.availableViews.find((v) => v.id === 'apiEndpoints');
      assert.ok(epView, 'apiEndpoints view is available');
      assert.equal(epView.title, 'API Endpoints');
      assert.ok(epView.count >= 4, `Expected at least 4 endpoints, got ${epView.count}`);

      const { nodes, edges } = parsed.buildGraphForView('apiEndpoints');
      assert.ok(nodes.length >= 5, 'Emits root system and endpoint nodes');

      // Check register endpoint
      const registerEp = nodes.find((n) => n.path === '/api/auth/register');
      assert.ok(registerEp, 'POST /api/auth/register node found');
      assert.equal(registerEp.method, 'POST');
      assert.ok(Array.isArray(registerEp.headers), 'Headers is an array');
      assert.ok(registerEp.headers.some((h) => h.name.toLowerCase() === 'content-type'), 'Has Content-Type header');
      assert.ok(registerEp.requestBody, 'Has request body specification');
      assert.ok(registerEp.requestBody.fields.length >= 3, 'Has fields name, email, password');
      assert.ok(registerEp.response, 'Has response specification');
      assert.match(registerEp.response.status, /201/);

      // Check login endpoint
      const loginEp = nodes.find((n) => n.path === '/api/auth/login');
      assert.ok(loginEp, 'POST /api/auth/login node found');
      assert.equal(loginEp.method, 'POST');
      assert.ok(loginEp.requestBody, 'Has login request body');

      // Check health endpoint
      const healthEp = nodes.find((n) => n.path === '/health');
      assert.ok(healthEp, 'GET /health node found');
      assert.equal(healthEp.method, 'GET');
    });
  });

  describe('Database Models & ERD Relational Mapping', () => {
    it('decomposes models into distinct database tables with columns and ERD relationships', () => {
      const parsed = GitExGraphParser.parseAnalysis(spendwiseRecord);
      const dbView = parsed.availableViews.find((v) => v.id === 'dataModel');
      assert.ok(dbView, 'dataModel view is available');
      assert.equal(dbView.title, 'Database & ERD');
      assert.equal(dbView.count, 6, 'Has 6 database tables');

      const { nodes, edges } = parsed.buildGraphForView('dataModel');
      assert.equal(nodes.length, 6, 'Renders all 6 database tables in ERD view');

      const tableNames = nodes.map((n) => n.name);
      assert.ok(tableNames.includes('users'), 'Contains users table');
      assert.ok(tableNames.includes('categories'), 'Contains categories table');
      assert.ok(tableNames.includes('transactions'), 'Contains transactions table');
      assert.ok(tableNames.includes('saving_goals'), 'Contains saving_goals table');
      assert.ok(tableNames.includes('goal_contributions'), 'Contains goal_contributions table');
      assert.ok(tableNames.includes('budgets'), 'Contains budgets table');

      // Check users table columns
      const usersTable = nodes.find((n) => n.name === 'users');
      assert.ok(usersTable.columns.length >= 5, 'Users table has fields');
      const pkCol = usersTable.columns.find((c) => c.isPk);
      assert.ok(pkCol, 'Users has Primary Key column');
      assert.equal(pkCol.name, 'id');

      // Check transactions table foreign keys
      const txTable = nodes.find((n) => n.name === 'transactions');
      const userFk = txTable.columns.find((c) => c.name === 'user_id');
      assert.ok(userFk && userFk.isFk, 'transactions has user_id foreign key');
      const catFk = txTable.columns.find((c) => c.name === 'category_id');
      assert.ok(catFk && catFk.isFk, 'transactions has category_id foreign key');

      // Check ERD edges
      assert.ok(edges.length >= 6, `Expected at least 6 ERD relational edges, got ${edges.length}`);
      const userTxEdge = edges.find((e) => e.source === 'tbl-users' && e.target === 'tbl-transactions');
      assert.ok(userTxEdge, 'Has ERD edge from users to transactions');
      assert.equal(userTxEdge.type, '1:N');
    });

    it('fallback parser automatically extracts 6 entities and ERD edges from component narrative when explicit DB is omitted', () => {
      const cloned = JSON.parse(JSON.stringify(spendwiseRecord));
      delete cloned.analysis.database;
      delete cloned.database;

      const parsed = GitExGraphParser.parseAnalysis(cloned);
      const { nodes, edges } = parsed.buildGraphForView('dataModel');

      assert.equal(nodes.length, 6, 'Automatically extracted all 6 tables from models.go narrative');
      assert.ok(edges.length >= 6, 'Automatically mapped ERD relational edges');
    });
  });

  describe('UI & Detail Drawer HTTP Integration', () => {
    it('GET /analysis/:id renders drawer panels for endpoints and database tables', async () => {
      cacheRecord(spendwiseRecord);

      const res = await request(app)
        .get(`/analysis/${spendwiseRecord.id}`)
        .expect('Content-Type', /html/)
        .expect(200);

      assert.ok(res.text.includes('id="drawer-endpoint-panel"'), 'Renders endpoint drawer panel');
      assert.ok(res.text.includes('id="drawer-database-panel"'), 'Renders database drawer panel');
      assert.ok(res.text.includes('id="drawer-db-columns-wrapper"'), 'Renders database columns table wrapper');
      assert.ok(res.text.includes('id="drawer-ep-headers-list"'), 'Renders endpoint request headers container');
      assert.ok(res.text.includes('id="drawer-ep-body-block"'), 'Renders endpoint request body block');
    });
  });
});
