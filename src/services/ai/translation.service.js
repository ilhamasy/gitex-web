import { getDefaultAIProvider } from './index.js';
import { SECTION_KEYS, SECTION_TITLES, SECTION_TITLES_ID } from '../../models/analysis.schema.js';
import { AnalysisValidator } from '../../validators/analysis.validator.js';
import { logger } from '../../utils/logger.js';

export const TRANSLATION_SYSTEM_INSTRUCTION = `You are a professional software engineer and technical translator specializing in translating developer documentation from English to Indonesian (Bahasa Indonesia).
Translate the technical guide JSON into clear, accurate, natural Indonesian.
Rules:
1. Translate narrative summaries, problem solved, explanations, and usage guides into clear Indonesian.
2. Keep code snippets, bash commands, package names, file paths, and URLs unchanged.
3. Return ONLY valid, well-formed JSON matching the exact same schema structure as the input.
4. Do not wrap output in markdown code fences or add extraneous text.`;

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

    return result;
  }

  /**
   * Robust fallback translator converting technical sections to Indonesian without external network calls.
   */
  static fallbackTranslate(analysis, targetLang = 'id') {
    if (targetLang === 'en' || !analysis) return analysis;

    const translated = {};

    SECTION_KEYS.forEach((key) => {
      const orig = analysis[key];
      if (!orig) return;

      const title = SECTION_TITLES_ID[key] || orig.title;
      const copy = JSON.parse(JSON.stringify(orig));
      copy.title = title;

      switch (key) {
        case 'overview':
          if (copy.summary) copy.summary = this.translateText(copy.summary);
          if (copy.problemSolved) copy.problemSolved = this.translateText(copy.problemSolved);
          if (copy.mainGoal) copy.mainGoal = this.translateText(copy.mainGoal);
          break;

        case 'purpose':
          if (Array.isArray(copy.targetUsers)) copy.targetUsers = copy.targetUsers.map(t => this.translateItem(t));
          if (Array.isArray(copy.capabilities)) copy.capabilities = copy.capabilities.map(t => this.translateItem(t));
          if (Array.isArray(copy.scenarios)) copy.scenarios = copy.scenarios.map(t => this.translateItem(t));
          break;

        case 'features':
          if (Array.isArray(copy.coreFeatures)) {
            copy.coreFeatures = copy.coreFeatures.map(f => {
              if (typeof f === 'object' && f !== null) {
                return { ...f, description: this.translateText(f.description) };
              }
              return this.translateItem(f);
            });
          }
          if (Array.isArray(copy.uniqueCapabilities)) copy.uniqueCapabilities = copy.uniqueCapabilities.map(t => this.translateItem(t));
          break;

        case 'howItWorks':
          if (copy.architecture) copy.architecture = this.translateText(copy.architecture);
          if (copy.dataFlow) copy.dataFlow = this.translateText(copy.dataFlow);
          if (Array.isArray(copy.components)) {
            copy.components = copy.components.map(c => {
              if (typeof c === 'object' && c !== null) {
                return {
                  ...c,
                  purpose: c.purpose ? this.translateText(c.purpose) : c.purpose,
                  description: c.description ? this.translateText(c.description) : c.description,
                };
              }
              return this.translateItem(c);
            });
          }
          break;

        case 'prerequisites':
          if (copy.environment) copy.environment = this.translateText(copy.environment);
          break;

        case 'installation':
          if (Array.isArray(copy.steps)) {
            copy.steps = copy.steps.map(st => {
              if (typeof st === 'object' && st !== null) {
                return {
                  ...st,
                  title: st.title ? this.translateText(st.title) : st.title,
                  description: st.description ? this.translateText(st.description) : st.description,
                  instructions: st.instructions ? this.translateText(st.instructions) : st.instructions,
                  verification: st.verification ? this.translateText(st.verification) : st.verification,
                };
              }
              return st;
            });
          }
          if (Array.isArray(copy.caveats)) copy.caveats = copy.caveats.map(c => this.translateItem(c));
          break;

        case 'configuration':
          if (copy.setupNotes) copy.setupNotes = this.translateText(copy.setupNotes);
          if (Array.isArray(copy.environmentVariables)) {
            copy.environmentVariables = copy.environmentVariables.map(ev => {
              if (typeof ev === 'object' && ev !== null) {
                return { ...ev, description: ev.description ? this.translateText(ev.description) : ev.description };
              }
              return ev;
            });
          }
          if (Array.isArray(copy.configFiles)) {
            copy.configFiles = copy.configFiles.map(cf => {
              if (typeof cf === 'object' && cf !== null) {
                return { ...cf, purpose: cf.purpose ? this.translateText(cf.purpose) : (cf.description ? this.translateText(cf.description) : cf.purpose) };
              }
              return cf;
            });
          }
          if (Array.isArray(copy.secrets)) copy.secrets = copy.secrets.map(s => this.translateItem(s));
          break;

        case 'usage':
          if (copy.quickStart) copy.quickStart = this.translateText(copy.quickStart);
          if (Array.isArray(copy.examples)) {
            copy.examples = copy.examples.map(ex => {
              if (typeof ex === 'object' && ex !== null) {
                return { ...ex, description: ex.description ? this.translateText(ex.description) : ex.description };
              }
              return ex;
            });
          }
          if (Array.isArray(copy.commonCommands)) {
            copy.commonCommands = copy.commonCommands.map(cmd => {
              if (typeof cmd === 'object' && cmd !== null) {
                return { ...cmd, description: cmd.description ? this.translateText(cmd.description) : cmd.description };
              }
              return cmd;
            });
          }
          break;

        case 'limitations':
          if (Array.isArray(copy.documentedLimitations)) copy.documentedLimitations = copy.documentedLimitations.map(t => this.translateItem(t));
          if (Array.isArray(copy.knownLimitations)) copy.knownLimitations = copy.knownLimitations.map(t => this.translateItem(t));
          if (copy.compatibilityNotes) copy.compatibilityNotes = this.translateText(copy.compatibilityNotes);
          if (copy.compatibility) copy.compatibility = this.translateText(copy.compatibility);
          if (copy.securityNotes) copy.securityNotes = this.translateText(copy.securityNotes);
          if (copy.securityCaveats) copy.securityCaveats = Array.isArray(copy.securityCaveats) ? copy.securityCaveats.map(s => this.translateItem(s)) : this.translateText(copy.securityCaveats);
          if (copy.productionReadiness) copy.productionReadiness = this.translateText(copy.productionReadiness);
          break;

        case 'alternatives':
          if (copy.distinctions) copy.distinctions = this.translateText(copy.distinctions);
          if (Array.isArray(copy.similarProjects)) {
            copy.similarProjects = copy.similarProjects.map(sp => {
              if (typeof sp === 'object' && sp !== null) {
                return { ...sp, comparison: sp.comparison ? this.translateText(sp.comparison) : sp.comparison };
              }
              return sp;
            });
          }
          if (Array.isArray(copy.comparableProjects)) {
            copy.comparableProjects = copy.comparableProjects.map(p => this.translateItem(p));
          }
          break;

        default:
          break;
      }

      translated[key] = copy;
    });

    return translated;
  }

  static translateItem(item) {
    if (!item) return item;
    if (typeof item === 'string') return this.translateText(item);
    if (typeof item === 'object') {
      const copy = { ...item };
      if (copy.description) copy.description = this.translateText(copy.description);
      if (copy.purpose) copy.purpose = this.translateText(copy.purpose);
      if (copy.distinction) copy.distinction = this.translateText(copy.distinction);
      return copy;
    }
    return item;
  }

  static translateText(text) {
    if (!text || typeof text !== 'string') return text;
    if (text.trim().toLowerCase() === 'not documented') return 'Tidak terdokumentasi';

    const replacements = [
      [/\bNot documented\b/gi, 'Tidak terdokumentasi'],
      [/\bFast, unopinionated, minimalist web framework for node\b/gi, 'Kerangka kerja web yang cepat, minimalis, dan fleksibel untuk Node.js'],
      [/\bSimplifies writing HTTP servers and APIs\b/gi, 'Menyederhanakan pembuatan server HTTP dan API'],
      [/\bMinimalist server foundation\b/gi, 'Fondasi server yang minimalis'],
      [/\bNode\.js developers\b/gi, 'Pengembang Node.js'],
      [/\bBackend engineers\b/gi, 'Insinyur Backend'],
      [/\bRouting\b/gi, 'Perutean'],
      [/\bMiddleware execution\b/gi, 'Eksekusi Middleware'],
      [/\bRobust routing\b/gi, 'Perutean tangguh'],
      [/\bHTTP helpers\b/gi, 'Pembantu HTTP'],
      [/\bMiddleware chain\b/gi, 'Rantai middleware'],
      [/\bUltra-minimalist footprint\b/gi, 'Ukuran dan jejak ultra-minimalis'],
      [/\bLayered HTTP request pipeline with middleware onion model\b/gi, 'Saluran permintaan HTTP berlapis dengan model middleware onion'],
      [/\bHandles method & path matching\b/gi, 'Menangani pencocokan metode dan jalur'],
    ];

    let result = text;
    for (const [pattern, repl] of replacements) {
      result = result.replace(pattern, repl);
    }
    return result;
  }
}

export default TranslationService;
