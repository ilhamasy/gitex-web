import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnalysisValidator } from '../src/validators/analysis.validator.js';
import { createEmptyAnalysis, SECTION_KEYS } from '../src/models/analysis.schema.js';
import { sanitizeSecrets } from '../src/utils/logger.js';

describe('Analysis Validator & Sanitizer — GITEX-010', () => {
  describe('JSON Repair Engine', () => {
    it('repairs trailing commas in objects and arrays', () => {
      const raw = '{"overview": {"summary": "Fast app",}, "items": [1, 2, 3,]}';
      const repaired = AnalysisValidator.repairJson(raw);
      const parsed = JSON.parse(repaired);
      assert.equal(parsed.overview.summary, 'Fast app');
      assert.equal(parsed.items.length, 3);
    });

    it('repairs unclosed strings and missing closing braces', () => {
      const truncated = '{"overview": {"summary": "A fast framework';
      const repaired = AnalysisValidator.repairJson(truncated);
      const parsed = JSON.parse(repaired);
      assert.equal(parsed.overview.summary, 'A fast framework');
    });

    it('safeParse successfully parses and repairs formatted JSON', () => {
      const wrapped = '```json\n{"overview": {"summary": "Valid"},}\n```';
      const res = AnalysisValidator.safeParse(wrapped);
      assert.equal(res.success, true);
      assert.equal(res.data.overview.summary, 'Valid');
    });

    it('safeParse fails cleanly on completely invalid text', () => {
      const gibberish = '<<<<< This is not JSON at all >>>>>';
      const res = AnalysisValidator.safeParse(gibberish);
      assert.equal(res.success, false);
      assert.ok(res.error.includes('Malformed JSON'));
    });
  });

  describe('Section Integrity Validation', () => {
    it('marks full 12-section analysis as completed with 100% score', () => {
      const full = createEmptyAnalysis();
      // Populate sections
      full.overview.summary = 'Complete web framework';
      full.features.coreFeatures = [{ name: 'Routing', description: 'HTTP routing' }];
      full.installation.steps = [{ stepNumber: 1, title: 'Install', command: 'npm i' }];

      const res = AnalysisValidator.validateSections(full);
      assert.equal(res.valid, true);
      assert.equal(res.status, 'completed');
      assert.equal(res.score, 100);
      assert.equal(res.missingSections.length, 0);
    });

    it('marks partial analysis when sections are missing and flags incomplete', () => {
      const partial = {
        overview: { title: 'Repository Overview', summary: 'Framework summary' },
        purpose: { title: 'Purpose', targetUsers: ['Developers'] },
      };

      const res = AnalysisValidator.validateSections(partial);
      assert.equal(res.valid, false);
      assert.equal(res.status, 'failed'); // 10 sections missing (>= 6)
      assert.ok(res.missingSections.includes('installation'));
      assert.ok(res.missingSections.includes('howItWorks'));

      // Check that unrecoverable sections are marked incomplete
      assert.equal(res.normalized.installation.isIncomplete, true);
      assert.equal(res.normalized.installation.status, 'not_documented');
    });

    it('distinguishes partial status when 1-5 sections are missing', () => {
      const mostlyComplete = createEmptyAnalysis();
      delete mostlyComplete.limitations;
      delete mostlyComplete.alternatives;

      const res = AnalysisValidator.validateSections(mostlyComplete);
      assert.equal(res.valid, false);
      assert.equal(res.status, 'partial'); // 2 sections missing
      assert.equal(res.missingSections.length, 2);
      assert.equal(res.score, 83); // 10/12 = 83%
    });
  });

  describe('Secret Sanitization in Logs', () => {
    it('redacts Google API keys and GitHub tokens', () => {
      const text = 'Failed with key AIzaSyD1234567890abcdefghij1234567890 and token ghp_123456789012345678901234567890123456';
      const sanitized = sanitizeSecrets(text);
      assert.equal(sanitized.includes('AIzaSyD1234567890'), false);
      assert.equal(sanitized.includes('ghp_1234567890123'), false);
      assert.ok(sanitized.includes('[REDACTED]'));
    });
  });
});

