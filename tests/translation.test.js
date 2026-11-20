import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { TranslationService } from '../src/services/ai/translation.service.js';
import { SECTION_KEYS, SECTION_TITLES, SECTION_TITLES_ID } from '../src/models/analysis.schema.js';
import { cacheRecord } from '../src/controllers/analysis.controller.js';

describe('Language Support & Translation Service (EN / ID)', () => {
  const sampleAnalysis = {
    overview: {
      title: 'Repository Overview',
      summary: 'Express is a fast, unopinionated, minimalist web framework for node.',
      problemSolved: 'Simplifies writing HTTP servers and APIs.',
      mainGoal: 'Minimalist server foundation.',
      sources: ['package.json'],
    },
    purpose: {
      title: 'Purpose & Use Cases',
      targetUsers: ['Node.js developers', 'Backend engineers'],
      capabilities: ['Routing', 'Middleware execution'],
      scenarios: ['REST APIs'],
      sources: ['README.md'],
    },
    features: {
      title: 'Key Features',
      coreFeatures: ['Robust routing', 'HTTP helpers'],
      uniqueCapabilities: ['Ultra-minimalist footprint'],
      sources: ['README.md'],
    },
    howItWorks: {
      title: 'How It Works',
      architecture: 'Layered HTTP request pipeline with middleware onion model.',
      components: [{ name: 'Router', description: 'Handles method & path matching' }],
      dataFlow: 'Request -> Middlewares -> Route Handler -> Response',
      sources: ['lib/router/index.js'],
    },
    prerequisites: {
      title: 'Prerequisites',
      runtime: 'Node.js >= 18.0.0',
      languages: ['JavaScript'],
      tools: ['npm'],
      system: ['POSIX'],
      sources: ['package.json'],
    },
    installation: {
      title: 'Installation Guide',
      steps: [
        {
          step: 1,
          title: 'Install package',
          command: 'npm install express',
          instructions: 'Run npm install in your project directory',
          verification: 'Check package.json dependencies',
        },
      ],
      sources: ['README.md'],
    },
    configuration: {
      title: 'Configuration',
      configFiles: [{ path: 'package.json', purpose: 'Dependency manifest' }],
      environmentVariables: [{ name: 'PORT', description: 'HTTP port to bind' }],
      secrets: [],
      sources: [],
    },
    usage: {
      title: 'Usage & Examples',
      quickStart: 'const express = require("express"); const app = express();',
      commonCommands: [{ command: 'node app.js', description: 'Start the application' }],
      sources: ['README.md'],
    },
    techStack: {
      title: 'Tech Stack',
      languages: ['JavaScript'],
      frameworks: [],
      libraries: [{ name: 'raw-body', purpose: 'Parse byte streams' }],
      infrastructure: [],
      sources: ['package.json'],
    },
    limitations: {
      title: 'Limitations & Considerations',
      knownLimitations: ['Not documented'],
      compatibility: 'Node.js 18+',
      securityNotes: 'Keep dependencies updated',
      productionReadiness: 'Production ready',
      sources: [],
    },
    alternatives: {
      title: 'Alternatives',
      comparableProjects: [{ name: 'Fastify', distinction: 'Higher throughput' }],
      sources: [],
    },
    resources: {
      title: 'Official Resources',
      repositoryUrl: 'https://github.com/expressjs/express',
      documentationUrl: 'https://expressjs.com',
      sources: [],
    },
  };

  const sampleRecord = {
    id: 'i18n-test-record-123',
    provider: 'github',
    owner: 'expressjs',
    name: 'express',
    fullName: 'expressjs/express',
    url: 'https://github.com/expressjs/express',
    revision: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'completed',
    score: 100,
    analysis: sampleAnalysis,
  };

  cacheRecord(sampleRecord);

  it('SECTION_TITLES_ID maps all 12 canonical section keys to Indonesian titles', () => {
    assert.equal(SECTION_KEYS.length, 12);
    SECTION_KEYS.forEach((key) => {
      assert.ok(SECTION_TITLES_ID[key], `Missing Indonesian title for key: ${key}`);
      assert.notEqual(SECTION_TITLES_ID[key], SECTION_TITLES[key]);
    });
    assert.equal(SECTION_TITLES_ID.overview, 'Ringkasan Repositori');
    assert.equal(SECTION_TITLES_ID.purpose, 'Tujuan & Skenario Penggunaan');
    assert.equal(SECTION_TITLES_ID.features, 'Fitur Utama');
    assert.equal(SECTION_TITLES_ID.howItWorks, 'Cara Kerja');
    assert.equal(SECTION_TITLES_ID.prerequisites, 'Prasyarat');
    assert.equal(SECTION_TITLES_ID.installation, 'Panduan Instalasi');
    assert.equal(SECTION_TITLES_ID.configuration, 'Konfigurasi');
    assert.equal(SECTION_TITLES_ID.usage, 'Penggunaan & Contoh');
    assert.equal(SECTION_TITLES_ID.techStack, 'Tumpukan Teknologi');
    assert.equal(SECTION_TITLES_ID.limitations, 'Batasan & Pertimbangan');
    assert.equal(SECTION_TITLES_ID.alternatives, 'Alternatif & Proyek Sejenis');
    assert.equal(SECTION_TITLES_ID.resources, 'Sumber Daya Resmi');
  });

  it('TranslationService.fallbackTranslate translates section titles and content to Indonesian', () => {
    const translated = TranslationService.fallbackTranslate(sampleAnalysis, 'id');
    assert.ok(translated);
    assert.equal(translated.overview.title, 'Ringkasan Repositori');
    assert.equal(translated.howItWorks.title, 'Cara Kerja');
    assert.equal(translated.installation.title, 'Panduan Instalasi');
    assert.match(translated.overview.summary, /Kerangka kerja web/i);
    assert.match(translated.overview.problemSolved, /Menyederhanakan pembuatan server HTTP/i);
  });

  it('GET /api/analysis/:id/translate?lang=id returns Indonesian translated analysis', async () => {
    const res = await request(app)
      .get('/api/analysis/i18n-test-record-123/translate?lang=id')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.lang, 'id');
    assert.ok(res.body.analysis);
    assert.equal(res.body.analysis.overview.title, 'Ringkasan Repositori');
    assert.equal(res.body.analysis.installation.title, 'Panduan Instalasi');
  });

  it('GET /api/analysis/:id/translate?lang=en returns original English analysis', async () => {
    const res = await request(app)
      .get('/api/analysis/i18n-test-record-123/translate?lang=en')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.lang, 'en');
    assert.equal(res.body.analysis.overview.title, 'Repository Overview');
  });

  it('GET /analysis/:id renders English flag as active by default with switcher buttons', async () => {
    const res = await request(app)
      .get('/analysis/i18n-test-record-123')
      .expect(200);

    const html = res.text;
    assert.match(html, /id="btn-lang-en"/);
    assert.match(html, /id="btn-lang-id"/);
    assert.match(html, /🇬🇧/);
    assert.match(html, /🇮🇩/);
    assert.match(html, /id="btn-lang-en"\s+class="lang-btn\s+active"/);
    assert.match(html, /Repository Overview/);
    assert.match(html, /id="translation-modal"/);
    assert.match(html, /Menerjemahkan Analisis.../);
    assert.match(html, /id="translation-progress-snackbar"/);
    assert.match(html, /id="btn-translation-close"/);
    assert.match(html, /id="btn-translation-background"/);
  });

  it('renders dismissible translation modal and top progress snackbar for background translation', async () => {
    const res = await request(app)
      .get('/analysis/i18n-test-record-123')
      .expect(200);

    const html = res.text;
    assert.match(html, /id="translation-progress-snackbar"/);
    assert.match(html, /id="trans-snackbar-spinner"/);
    assert.match(html, /id="trans-snackbar-icon"/);
    assert.match(html, /id="trans-snackbar-title"/);
    assert.match(html, /id="trans-snackbar-status-text"/);
    assert.match(html, /id="btn-trans-snackbar-action"/);
    assert.match(html, /id="btn-trans-snackbar-close"/);
    assert.match(html, /id="btn-translation-close"/);
    assert.match(html, /id="btn-translation-background"/);
    assert.match(html, /Jalankan di latar belakang/);
  });

  it('GET /analysis/:id?lang=id renders Indonesian flag as active and Indonesian titles', async () => {
    const res = await request(app)
      .get('/analysis/i18n-test-record-123?lang=id')
      .expect(200);

    const html = res.text;
    assert.match(html, /id="btn-lang-id"\s+class="lang-btn\s+active"/);
    assert.match(html, /Ringkasan Repositori/);
    assert.match(html, /Panduan Instalasi/);
    assert.match(html, /Masalah yang Diselesaikan/);
    assert.match(html, /Tujuan Utama/);
    assert.match(html, /Pengguna Sasaran/);
  });

  it('GET /api/analysis?url=... recovers record matching URL from cache', async () => {
    const res = await request(app)
      .get('/api/analysis?url=https://github.com/expressjs/express')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, 'i18n-test-record-123');
    assert.equal(res.body.data.fullName, 'expressjs/express');
  });

  it('preserves feature/component names (Settings Manager, Pointer System, CLI Installer) while translating explanations', () => {
    const complexAnalysis = {
      overview: {
        title: 'Repository Overview',
        summary: 'Anti Slop is a specialized rulebook and CLI tool designed for AI coding agents to filter out generic, low-quality AI-generated content, including UI designs, text, and code patterns.',
        problemSolved: "Addresses the issue of 'AI slop'—generic, hallucinated, or overly hyped outputs (like 'Next-Gen AI' pills or fake terminal latency) that AI agents often produce by default.",
        mainGoal: 'To act as a technical filter that enforces high-quality, human-centric standards in AI-assisted development without prescribing specific styles.',
      },
      howItWorks: {
        title: 'How It Works',
        architecture: "The project functions as a CLI-based distribution system that installs Markdown-based 'skills' into hidden configuration directories of various AI agents.",
        components: [
          { name: 'CLI Installer', purpose: 'Detects installed agents and copies skill folders to appropriate paths.' },
          { name: 'Pointer System', purpose: 'Injects Markdown blocks into project entry files (e.g., CLAUDE.md, AGENTS.md) to reference the installed rules.' },
          { name: 'Settings Manager', purpose: 'Handles global preferences for usage modes (during/after/ask) via a JSON configuration file.' },
          { name: 'Contrast MCP', purpose: 'A Python-based tool for accessibility verification.' },
        ],
      },
      installation: {
        title: 'Installation Guide',
        steps: [
          {
            stepNumber: 1,
            title: 'Run Installer',
            command: 'npx antislop-ai',
            instructions: 'Execute the interactive installer which will prompt for skill selection and agent targets.',
            verification: 'The CLI will print a summary of written skills and updated pointer files.',
          },
        ],
      },
    };

    const translated = TranslationService.fallbackTranslate(complexAnalysis, 'id');

    // Section titles translated
    assert.equal(translated.overview.title, 'Ringkasan Repositori');
    assert.equal(translated.howItWorks.title, 'Cara Kerja');
    assert.equal(translated.installation.title, 'Panduan Instalasi');

    // Content translated
    assert.match(translated.overview.summary, /Anti Slop adalah rulebook dan CLI tool khusus/i);
    assert.match(translated.overview.problemSolved, /Mengatasi masalah 'AI slop'/i);
    assert.match(translated.overview.mainGoal, /Berfungsi sebagai filter teknis/i);

    // Component names preserved 100% intact
    const comps = translated.howItWorks.components;
    assert.equal(comps[0].name, 'CLI Installer');
    assert.equal(comps[1].name, 'Pointer System');
    assert.equal(comps[2].name, 'Settings Manager');
    assert.equal(comps[3].name, 'Contrast MCP');

    // Component purposes translated to natural Indonesian
    assert.match(comps[0].purpose, /Mendeteksi agent yang terpasang/i);
    assert.match(comps[1].purpose, /Menyuntikkan blok Markdown ke file entri proyek/i);
    assert.match(comps[2].purpose, /Menangani preferensi global/i);
    assert.match(comps[3].purpose, /Alat berbasis Python untuk verifikasi aksesibilitas/i);

    // Command preserved, instructions & verification translated
    assert.equal(translated.installation.steps[0].command, 'npx antislop-ai');
    assert.match(translated.installation.steps[0].instructions, /Jalankan installer interaktif/i);
    assert.match(translated.installation.steps[0].verification, /CLI akan mencetak ringkasan/i);
  });
});
