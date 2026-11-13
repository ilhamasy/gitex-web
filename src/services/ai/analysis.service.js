import crypto from 'crypto';
import { getDefaultAIProvider } from './index.js';
import { SYSTEM_INSTRUCTION, buildAnalysisPrompt } from '../../prompts/analysis.prompt.js';
import { AnalysisValidator } from '../../validators/analysis.validator.js';
import { AIGenerationError } from './ai.errors.js';
import { logger } from '../../utils/logger.js';

const MAX_REPAIR_RETRIES = 1;

export class AnalysisService {
  /**
   * Cleans model output by removing markdown code fences if present.
   */
  static cleanJsonOutput(rawText) {
    return AnalysisValidator.repairJson(rawText);
  }

  /**
   * Executes AI generation with bounded retry for malformed or incomplete outputs.
   */
  static async executeWithRetry(provider, prompt, options = {}) {
    let attempt = 0;
    let currentPrompt = prompt;
    let lastError = null;

    while (attempt <= MAX_REPAIR_RETRIES) {
      try {
        const result = await provider.generate(currentPrompt, {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          model: options.model,
        });

        const parseResult = AnalysisValidator.safeParse(result.content);

        if (!parseResult.success) {
          if (attempt < MAX_REPAIR_RETRIES) {
            logger.warn(`[AnalysisService] Attempt ${attempt + 1} produced invalid JSON. Retrying with repair instruction...`);
            currentPrompt = `${prompt}\n\nIMPORTANT: Your previous output could not be parsed as JSON. Please ensure you return ONLY valid, strictly well-formed JSON without markdown code fences or comments.`;
            attempt++;
            continue;
          }
          throw new AIGenerationError(`AI output is not valid JSON after retry: ${parseResult.error}`, {
            details: result.content,
          });
        }

        const validation = AnalysisValidator.validateSections(parseResult.data);

        // If there are missing sections and we haven't retried yet, request missing sections
        if (validation.missingSections.length > 0 && attempt < MAX_REPAIR_RETRIES) {
          logger.warn(
            `[AnalysisService] Attempt ${attempt + 1} was missing sections: [${validation.missingSections.join(', ')}]. Retrying...`
          );
          currentPrompt = `${prompt}\n\nIMPORTANT: Your previous output was missing these required sections: ${validation.missingSections.join(', ')}. All 12 sections must be included.`;
          attempt++;
          continue;
        }

        return {
          rawContent: result.content,
          parsedData: parseResult.data,
          validation,
          repaired: parseResult.repaired,
        };
      } catch (err) {
        lastError = err;
        if (attempt >= MAX_REPAIR_RETRIES) break;
        attempt++;
      }
    }

    throw lastError || new AIGenerationError('Failed to generate analysis after retry attempts.');
  }

  /**
   * Generates structured 12-section repository analysis via LLM.
   *
   * @param {object} repoMeta - Repository metadata, README, and tree
   * @param {object} repomixBundle - Bundled source code context
   * @param {object} options - Options including custom provider or model
   * @returns {Promise<{
   *   id: string,
   *   provider: string,
   *   owner: string,
   *   name: string,
   *   fullName: string,
   *   url: string,
   *   revision: string,
   *   description: string | null,
   *   language: string | null,
   *   analyzedAt: string,
   *   status: 'completed' | 'partial' | 'failed',
   *   score: number,
   *   analysis: object,
   *   missingSections: string[],
   *   repaired: boolean,
   * }>}
   */
  static async generateAnalysis(repoMeta, repomixBundle = null, options = {}) {
    const provider = options.aiProvider || getDefaultAIProvider();
    const prompt = buildAnalysisPrompt(repoMeta, repomixBundle);

    const { validation, repaired } = await this.executeWithRetry(provider, prompt, options);

    return {
      id: crypto.randomUUID(),
      provider: repoMeta.provider || 'github',
      owner: repoMeta.owner || 'unknown',
      name: repoMeta.name || 'unknown',
      fullName: repoMeta.fullName || `${repoMeta.owner}/${repoMeta.name}`,
      url: repoMeta.url || '',
      revision: repoMeta.commitSha || repoMeta.defaultBranch || 'HEAD',
      description: repoMeta.description || null,
      language: repoMeta.language || null,
      analyzedAt: new Date().toISOString(),
      status: validation.status,
      score: validation.score,
      analysis: validation.normalized,
      missingSections: validation.missingSections,
      repaired: Boolean(repaired),
    };
  }
}

export default AnalysisService;
