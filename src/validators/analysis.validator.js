/**
 * Validator and JSON repair engine for AI analysis outputs.
 * Source: docs/PRD.md & docs/USER-STORIES.md (GITEX-010)
 */

import { SECTION_KEYS, SECTION_TITLES, createDefaultSection } from '../models/analysis.schema.js';

export class AnalysisValidator {
  /**
   * Attempts to clean and repair common LLM JSON formatting defects.
   */
  static repairJson(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    let text = rawText.trim();

    // 1. Strip markdown fences
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    text = text.trim();

    // 2. Remove trailing commas before closing braces/brackets
    text = text.replace(/,(\s*[}\]])/g, '$1');

    // 3. Attempt simple parse first
    try {
      JSON.parse(text);
      return text;
    } catch {
      // Continue to bracket repair if parse failed
    }

    // 4. Handle truncated JSON: close unclosed string and balance braces/brackets
    let inString = false;
    let isEscaped = false;
    const stack = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '\\' && inString) {
        isEscaped = !isEscaped;
        continue;
      }
      if (char === '"' && !isEscaped) {
        inString = !inString;
      }
      isEscaped = false;

      if (!inString) {
        if (char === '{' || char === '[') {
          stack.push(char);
        } else if (char === '}') {
          if (stack[stack.length - 1] === '{') stack.pop();
        } else if (char === ']') {
          if (stack[stack.length - 1] === '[') stack.pop();
        }
      }
    }

    let repaired = text;
    if (inString) {
      repaired += '"';
    }

    // Close remaining open brackets in reverse order
    while (stack.length > 0) {
      const open = stack.pop();
      if (open === '{') repaired += '}';
      else if (open === '[') repaired += ']';
    }

    return repaired;
  }

  /**
   * Parses JSON string with automatic repair fallback.
   */
  static safeParse(rawText) {
    if (!rawText) {
      return { success: false, data: null, error: 'Empty model output' };
    }

    // Attempt direct parse
    try {
      const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed, repaired: false };
    } catch {
      // Direct parse failed, attempt repair
    }

    try {
      const repaired = this.repairJson(rawText);
      const parsed = JSON.parse(repaired);
      return { success: true, data: parsed, repaired: true };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: `Malformed JSON: ${err.message}`,
        repaired: false,
      };
    }
  }

  /**
   * Validates section integrity across all 12 sections.
   * Marks unrecoverable sections as incomplete rather than fabricating data.
   */
  static validateSections(parsedData) {
    if (!parsedData || typeof parsedData !== 'object') {
      const empty = {};
      for (const k of SECTION_KEYS) {
        empty[k] = { ...createDefaultSection(k), isIncomplete: true };
      }
      return {
        valid: false,
        status: 'failed',
        missingSections: [...SECTION_KEYS],
        normalized: empty,
        score: 0,
      };
    }

    const missingSections = [];
    const normalized = {};

    for (const key of SECTION_KEYS) {
      const rawSection = parsedData[key];

      if (!rawSection || typeof rawSection !== 'object') {
        missingSections.push(key);
        normalized[key] = {
          ...createDefaultSection(key),
          title: SECTION_TITLES[key],
          isIncomplete: true,
          status: 'not_documented',
        };
      } else {
        // Validate that section contains meaningful data
        const defaultSec = createDefaultSection(key);
        const merged = {
          ...defaultSec,
          ...rawSection,
          title: rawSection.title || SECTION_TITLES[key],
          sources: Array.isArray(rawSection.sources) ? rawSection.sources : [],
          isIncomplete: false,
        };

        // Check if all content fields are empty or placeholders
        const isBasicallyEmpty =
          (merged.summary === 'Not documented' || merged.summary === '') &&
          (merged.architecture === 'Not documented' || !merged.architecture) &&
          (!merged.steps || merged.steps.length === 0) &&
          (!merged.coreFeatures || merged.coreFeatures.length === 0) &&
          (!merged.languages || merged.languages.length === 0) &&
          (!merged.similarProjects || merged.similarProjects.length === 0);

        if (isBasicallyEmpty && key !== 'resources') {
          merged.isIncomplete = true;
          merged.status = 'not_documented';
        }

        normalized[key] = merged;
      }
    }

    const completedSectionsCount = SECTION_KEYS.length - missingSections.length;
    const score = Math.round((completedSectionsCount / SECTION_KEYS.length) * 100);

    let status = 'completed';
    if (missingSections.length > 0) {
      status = missingSections.length >= 6 ? 'failed' : 'partial';
    }

    return {
      valid: missingSections.length === 0,
      status,
      missingSections,
      normalized,
      score,
    };
  }
}

export default AnalysisValidator;

