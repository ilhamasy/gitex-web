import crypto from 'crypto';
import { RepositoryService } from '../repository/repository.service.js';
import { TreeFilterService } from '../repository/tree-filter.service.js';
import { RepomixService } from '../repository/repomix.service.js';
import { AnalysisService } from '../ai/analysis.service.js';
import { logger } from '../../utils/logger.js';

export const PIPELINE_STAGES = {
  VALIDATING: 'Validating',
  FETCHING: 'Fetching',
  PROCESSING: 'Processing',
  ANALYZING: 'Analyzing',
  GENERATING: 'Generating',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export class PipelineService {
  /**
   * Executes the full repository analysis pipeline.
   *
   * @param {string} url - Repository URL
   * @param {object} [options]
   * @param {function} [options.onStageChange] - Callback receiving (stage, message)
   * @param {string} [options.model] - Optional LLM model override
   * @returns {Promise<object>} Full analysis record
   */
  static async run(url, options = {}) {
    const notify = (stage, message) => {
      logger.info(`[Pipeline] Stage [${stage}]: ${message}`);
      if (typeof options.onStageChange === 'function') {
        try {
          options.onStageChange(stage, message);
        } catch (err) {
          logger.warn(`[Pipeline] Stage callback threw error: ${err.message}`);
        }
      }
    };

    try {
      // 1. Stage: Validating
      notify(PIPELINE_STAGES.VALIDATING, 'Validating repository URL and checking provider...');
      const resolved = RepositoryService.resolveRepository(url);
      if (!resolved.valid) {
        throw new Error(resolved.error || 'Invalid repository URL.');
      }

      // 2. Stage: Fetching
      notify(PIPELINE_STAGES.FETCHING, `Fetching repository metadata and tree from ${resolved.provider.toUpperCase()}...`);
      const repoMeta = await RepositoryService.fetchMetadataAndReadme(url);
      
      let treeData = null;
      try {
        treeData = await RepositoryService.fetchTree(url, { recursive: true });
        repoMeta.tree = treeData.tree || [];
        repoMeta.treeTruncated = treeData.truncated || false;
      } catch (treeErr) {
        logger.warn(`[Pipeline] Failed to fetch directory tree: ${treeErr.message}. Continuing with basic tree.`);
        repoMeta.tree = [];
        repoMeta.treeTruncated = false;
      }

      // 3. Stage: Processing
      notify(PIPELINE_STAGES.PROCESSING, 'Selecting relevant files and packing context with Repomix...');
      let repomixBundle = null;
      try {
        const fileSelection = TreeFilterService.filterAndSelect(repoMeta.tree?.rawTree || repoMeta.tree || []);
        
        repomixBundle = await RepomixService.bundleRepositoryFiles(
          repoMeta.provider,
          repoMeta,
          fileSelection.relevantFiles || [],
          repoMeta.commitSha || repoMeta.defaultBranch
        );
      } catch (packErr) {
        logger.warn(`[Pipeline] Repomix bundling note: ${packErr.message}. Falling back to metadata-driven context.`);
        repomixBundle = {
          packedContent: '',
          content: '',
          fileCount: 0,
          totalBytes: 0,
        };
      }

      // 4. Stage: Analyzing
      notify(PIPELINE_STAGES.ANALYZING, 'Analyzing architecture, dependencies, and operational workflows with Gemini...');

      // 5. Stage: Generating
      notify(PIPELINE_STAGES.GENERATING, 'Validating schema and generating structured technical guide...');
      const generated = await AnalysisService.generateAnalysis(repoMeta, repomixBundle, {
        model: options.model,
      });

      // Assemble full record
      const record = {
        id: generated.id || `gitex-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        provider: resolved.provider,
        owner: resolved.owner,
        name: resolved.name,
        fullName: resolved.fullName,
        url: resolved.normalizedUrl,
        revision: repoMeta.commitSha || 'unknown',
        description: repoMeta.description || null,
        language: repoMeta.language || null,
        languages: repoMeta.languages || {},
        stars: repoMeta.stars || 0,
        forks: repoMeta.forks || 0,
        license: repoMeta.license || null,
        defaultBranch: repoMeta.defaultBranch || 'main',
        analyzedAt: generated.analyzedAt || new Date().toISOString(),
        status: generated.status || 'completed',
        score: generated.score ?? 100,
        analysis: generated.analysis,
        missingSections: generated.missingSections || [],
        repaired: generated.repaired || false,
        stage: PIPELINE_STAGES.COMPLETED,
      };

      notify(PIPELINE_STAGES.COMPLETED, `Analysis completed (${record.status}). Score: ${record.score}%.`);
      return record;
    } catch (err) {
      notify(PIPELINE_STAGES.FAILED, `Analysis failed: ${err.message}`);
      throw err;
    }
  }
}

export default PipelineService;
