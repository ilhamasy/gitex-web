import { getDefaultAIProvider } from './index.js';
import { SECTION_KEYS, SECTION_TITLES, SECTION_TITLES_ID } from '../../models/analysis.schema.js';
import { AnalysisValidator } from '../../validators/analysis.validator.js';
import { logger } from '../../utils/logger.js';
import {
  translateAnalysisToIndonesian,
  translateTextToIndonesian,
  translateItemToIndonesian,
} from '../../../public/js/translation.helper.js';

export const TRANSLATION_SYSTEM_INSTRUCTION = `You are a professional software engineer and technical translator specializing in translating developer documentation from English to natural, professional Indonesian (Bahasa Indonesia).
Translate the technical guide JSON into clear, accurate, natural Indonesian.

CRITICAL RULES:
1. Translate narrative summaries, problem solved, explanations, descriptions, purposes, step instructions, scenarios, caveats, and usage guides into clear, idiomatic Indonesian.
2. DO NOT translate proper names of features, menus, tools, components, or packages (e.g. keep 'Settings Manager', 'Pointer System', 'CLI Installer', 'Pre-flight', 'Hero Builder', 'Theme Dealer', 'Delivery Gate', 'Sloplint', 'Contrast MCP Server', 'Rulebook Engine' intact). Only translate the descriptive/explanatory prose around them.
3. DO NOT translate code snippets, bash commands, package names, file paths, URLs, framework names, library names, or technical acronyms.
4. Return ONLY valid, well-formed JSON matching the exact same schema structure as the input.
5. Do not wrap output in markdown code fences or add extraneous text.`;

export class TranslationService {
  /**
   * Translates an analysis object to the target language (default 'id').
   * Uses Gemini AI with robust fallback when offline or in test environments.
   *
   * @param {object} analysis - The 12-section analysis object
   * @param {string} targetLang - Target language code ('id' or 'en')
   * @returns {Promise<object>} The translated analysis object
   */
  static async translate(analysis, targetLang = 'id') {
    if (!analysis || typeof analysis !== 'object') {
      return analysis;
    }

    if (targetLang === 'en') {
      return analysis;
    }

    if (process.env.NODE_ENV === 'test') {
      return this.fallbackTranslate(analysis, targetLang);
    }

    let provider = null;
    try {
      provider = getDefaultAIProvider();
    } catch (e) {
      provider = null;
    }

    // If no provider or no API key, use the comprehensive fallback translator
    if (!provider || !provider.apiKey) {
      return this.fallbackTranslate(analysis, targetLang);
    }

    try {
      const prompt = `Translate the following repository analysis JSON into Indonesian (Bahasa Indonesia).
Ensure all 12 sections retain their structure.
CRITICAL: Do not translate feature names, menu names, tool names, or package names like 'Settings Manager', 'Pointer System', 'CLI Installer', 'Contrast MCP', 'Sloplint', etc.
Only translate the explanations, purposes, and descriptions.
Input JSON:
${JSON.stringify(analysis, null, 2)}`;

      const result = await provider.generate(prompt, {
        systemInstruction: TRANSLATION_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      });

      const parsed = AnalysisValidator.safeParse(result.content);
      if (parsed.success && parsed.data && typeof parsed.data === 'object') {
        return this.normalizeTranslatedSections(parsed.data, analysis);
      }
      logger.warn('[TranslationService] AI translation response was not valid JSON, falling back.');
    } catch (err) {
      logger.warn(`[TranslationService] AI translation failed (${err.message}), using fallback.`);
    }

    return this.fallbackTranslate(analysis, targetLang);
  }

  /**
   * Normalizes translated sections ensuring all keys and canonical Indonesian titles exist.
   */
  static normalizeTranslatedSections(translated, original) {
    const result = {};

    SECTION_KEYS.forEach((key) => {
      const origSec = original[key] || {};
      const transSec = translated[key] || {};

      result[key] = {
        ...origSec,
        ...transSec,
        title: SECTION_TITLES_ID[key] || transSec.title || origSec.title,
        sources: origSec.sources || [],
      };
    });

    if (original.flowchart || translated.flowchart) {
      const origSec = original.flowchart || {};
      const transSec = translated.flowchart || {};
      result.flowchart = {
        ...origSec,
        ...transSec,
        title: SECTION_TITLES_ID.flowchart || 'Diagram Alur Aplikasi',
        sources: origSec.sources || [],
      };
    }

    // Preserve specialized technical models across translation
    if (original.endpoints || translated.endpoints) {
      result.endpoints = translated.endpoints || original.endpoints;
    }
    if (original.database || translated.database) {
      result.database = translated.database || original.database;
    }

    return result;
  }

  /**
   * Robust fallback translator converting technical sections to natural Indonesian
   * while strictly preserving proper nouns, feature names, menus, tools, and code.
   */
  static fallbackTranslate(analysis, targetLang = 'id') {
    if (targetLang === 'en' || !analysis) return analysis;
    return translateAnalysisToIndonesian(analysis);
  }

  static translateItem(item) {
    return translateItemToIndonesian(item);
  }

  static translateText(text) {
    return translateTextToIndonesian(text);
  }
}

export default TranslationService;
