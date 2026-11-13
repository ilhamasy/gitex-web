import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnalysisService } from '../src/services/ai/analysis.service.js';
import {
  SECTION_KEYS,
  createEmptyAnalysis,
  validateAndNormalizeAnalysis,
} from '../src/models/analysis.schema.js';
import { buildAnalysisPrompt } from '../src/prompts/analysis.prompt.js';
import { AIGenerationError } from '../src/services/ai/ai.errors.js';

describe('Analysis Template & Generator — GITEX-009', () => {
  describe('Analysis Schema & 12 Sections', () => {
    it('defines exactly the 12 canonical sections from PRD', () => {
      assert.equal(SECTION_KEYS.length, 12);
      const expected = [
        'overview',
        'purpose',
        'features',
        'howItWorks',
        'prerequisites',
        'installation',
        'configuration',
        'usage',
        'techStack',
        'limitations',
        'alternatives',
        'resources',
      ];
      assert.deepEqual(SECTION_KEYS, expected);
    });

    it('createEmptyAnalysis produces all 12 sections with default values', () => {
      const empty = createEmptyAnalysis();
      for (const key of SECTION_KEYS) {
        assert.ok(empty[key], `Missing section key: ${key}`);
        assert.ok(empty[key].title);
        assert.ok(Array.isArray(empty[key].sources));
      }
    });

    it('validateAndNormalizeAnalysis identifies missing sections and normalizes', () => {
      const partial = {
        overview: { summary: 'An express web framework', sources: ['README.md'] },
        techStack: { languages: ['JavaScript'], sources: ['package.json'] },
      };

      const { valid, missingSections, normalized } = validateAndNormalizeAnalysis(partial);

      assert.equal(valid, false);
      assert.equal(missingSections.length, 10);
      assert.ok(missingSections.includes('installation'));
      assert.ok(missingSections.includes('prerequisites'));

      // All 12 sections must exist in normalized output
      for (const key of SECTION_KEYS) {
        assert.ok(normalized[key], `Expected normalized[${key}] to exist`);
      }
      assert.equal(normalized.overview.summary, 'An express web framework');
      assert.equal(normalized.installation.steps.length, 0);
    });
  });

  describe('Analysis Prompt Builder', () => {
    it('assembles metadata, tree summary, README, and Repomix context', () => {
      const repoMeta = {
        provider: 'github',
        owner: 'expressjs',
        name: 'express',
        fullName: 'expressjs/express',
        url: 'https://github.com/expressjs/express',
        commitSha: '43fca52d2',
        language: 'JavaScript',
        readme: { content: '# Express framework readme' },
        tree: {
          summary: {
            manifests: ['package.json'],
            entryPoints: ['index.js'],
          },
        },
      };

      const repomixBundle = {
        packedContent: '<file path="package.json">{"name":"express"}</file>',
      };

      const prompt = buildAnalysisPrompt(repoMeta, repomixBundle);

      assert.ok(prompt.includes('expressjs/express'));
      assert.ok(prompt.includes('43fca52d2'));
      assert.ok(prompt.includes('package.json'));
      assert.ok(prompt.includes('Express framework readme'));
      assert.ok(prompt.includes('<file path="package.json">'));
      assert.ok(prompt.includes('OUTPUT SCHEMA REQUIREMENT'));
    });
  });

  describe('AnalysisService.generateAnalysis', () => {
    it('generates a complete 12-section analysis from mocked AI provider', async () => {
      const fullAnalysisJson = createEmptyAnalysis();
      fullAnalysisJson.overview = {
        title: 'Repository Overview',
        summary: 'Fast minimalist framework',
        problemSolved: 'Web server creation',
        mainGoal: 'Lightweight routing',
        sources: ['package.json', 'README.md'],
      };
      fullAnalysisJson.installation = {
        title: 'Installation Guide',
        steps: [
          {
            stepNumber: 1,
            title: 'Install express',
            command: 'npm install express',
            instructions: 'Install via npm',
            verification: 'Check node_modules/express',
          },
        ],
        sources: ['package.json'],
      };

      const mockProvider = {
        generate: async () => ({
          content: `\`\`\`json\n${JSON.stringify(fullAnalysisJson)}\n\`\`\``,
          model: 'gemini-1.5-flash',
        }),
      };

      const repoMeta = {
        provider: 'github',
        owner: 'expressjs',
        name: 'express',
        fullName: 'expressjs/express',
        url: 'https://github.com/expressjs/express',
        defaultBranch: 'master',
        commitSha: 'commit-sha-123',
      };

      const result = await AnalysisService.generateAnalysis(repoMeta, null, {
        aiProvider: mockProvider,
      });

      assert.equal(result.provider, 'github');
      assert.equal(result.fullName, 'expressjs/express');
      assert.equal(result.revision, 'commit-sha-123');
      assert.equal(result.status, 'completed');
      assert.equal(result.missingSections.length, 0);

      // Verify sections are properly formatted
      assert.equal(result.analysis.overview.summary, 'Fast minimalist framework');
      assert.equal(result.analysis.installation.steps[0].command, 'npm install express');
      assert.deepEqual(result.analysis.overview.sources, ['package.json', 'README.md']);
    });

    it('handles markdown code fences and whitespace in model output', () => {
      const raw = '  ```json\n{"overview":{}}\n```  ';
      const cleaned = AnalysisService.cleanJsonOutput(raw);
      assert.equal(cleaned, '{"overview":{}}');
    });

    it('throws AIGenerationError when model outputs invalid JSON', async () => {
      const mockProvider = {
        generate: async () => ({
          content: 'This is not valid JSON at all!',
          model: 'gemini-1.5-flash',
        }),
      };

      await assert.rejects(
        async () => {
          await AnalysisService.generateAnalysis({ fullName: 'test/repo' }, null, {
            aiProvider: mockProvider,
          });
        },
        AIGenerationError
      );
    });
  });
});
