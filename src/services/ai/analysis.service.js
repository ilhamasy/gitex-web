import crypto from 'crypto';
import { getDefaultAIProvider } from './index.js';
import { SYSTEM_INSTRUCTION, buildAnalysisPrompt } from '../../prompts/analysis.prompt.js';
import { validateAndNormalizeAnalysis } from '../../models/analysis.schema.js';
import { AIGenerationError } from './ai.errors.js';

export class AnalysisService {
  /**
   * Cleans model output by removing markdown code fences if present.
   */
  static cleanJsonOutput(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return cleaned.trim();
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
   *   status: 'completed' | 'partial',
   *   analysis: object,
   *   missingSections: string[],
   * }>}
   */
  static async generateAnalysis(repoMeta, repomixBundle = null, options = {}) {
    const provider = options.aiProvider || getDefaultAIProvider();
    const prompt = buildAnalysisPrompt(repoMeta, repomixBundle);

    const result = await provider.generate(prompt, {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      model: options.model,
    });

    const cleanedText = this.cleanJsonOutput(result.content);

    let parsedJson = null;
    try {
      parsedJson = JSON.parse(cleanedText);
    } catch (parseErr) {
      throw new AIGenerationError(
        `Failed to parse Gemini output as JSON: ${parseErr.message}`,
        { details: result.content }
      );
    }

    const { valid, missingSections, normalized } = validateAndNormalizeAnalysis(parsedJson);

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
      status: valid ? 'completed' : 'partial',
      analysis: normalized,
      missingSections,
    };
  }
}

export default AnalysisService;
