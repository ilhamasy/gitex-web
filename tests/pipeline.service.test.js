import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { PipelineService, PIPELINE_STAGES } from '../src/services/pipeline/pipeline.service.js';
import { RepositoryService } from '../src/services/repository/repository.service.js';
import { TreeFilterService } from '../src/services/repository/tree-filter.service.js';
import { RepomixService } from '../src/services/repository/repomix.service.js';
import { AnalysisService } from '../src/services/ai/analysis.service.js';

describe('PipelineService — GITEX-011 & GITEX-012', () => {
  it('runs the pipeline through all named stages in order and produces complete analysis', async () => {
    const stagesRecorded = [];

    // Mock dependencies
    mock.method(RepositoryService, 'resolveRepository', (url) => ({
      valid: true,
      provider: 'github',
      owner: 'octocat',
      name: 'hello-world',
      fullName: 'octocat/hello-world',
      normalizedUrl: 'https://github.com/octocat/hello-world',
      apiUrl: 'https://api.github.com/repos/octocat/hello-world',
    }));

    mock.method(RepositoryService, 'fetchMetadataAndReadme', async () => ({
      provider: 'github',
      owner: 'octocat',
      name: 'hello-world',
      fullName: 'octocat/hello-world',
      url: 'https://github.com/octocat/hello-world',
      description: 'Hello World repo',
      commitSha: '949cdd7a1b2c3d4e5f',
      defaultBranch: 'main',
      stars: 42,
      forks: 7,
      license: 'MIT',
      language: 'JavaScript',
      languages: { JavaScript: 100 },
      readme: '# Hello World\nSample repo',
      hasReadme: true,
    }));

    mock.method(RepositoryService, 'fetchTree', async () => ({
      tree: [
        { path: 'package.json', type: 'blob', size: 250 },
        { path: 'src/index.js', type: 'blob', size: 1024 },
      ],
      truncated: false,
    }));

    mock.method(TreeFilterService, 'filterAndSelect', () => ({
      relevantFiles: [
        { path: 'package.json', size: 250, category: 'manifest' },
        { path: 'src/index.js', size: 1024, category: 'entrypoint' },
      ],
      totalBlobs: 2,
      totalTrees: 0,
      isTruncated: false,
      summary: { manifests: ['package.json'], entryPoints: ['src/index.js'] },
    }));

    mock.method(RepomixService, 'packFiles', async () => ({
      packedContent: '<repomix>packed code</repomix>',
      totalFiles: 2,
      byteSize: 1274,
      style: 'xml',
      sourcePaths: ['package.json', 'src/index.js'],
    }));

    mock.method(AnalysisService, 'generateAnalysis', async () => ({
      id: 'analysis-123',
      analyzedAt: '2026-11-13T10:00:00.000Z',
      status: 'completed',
      score: 100,
      missingSections: [],
      repaired: false,
      analysis: {
        overview: { title: 'Repository Overview', summary: 'A simple hello world', sources: ['README.md'] },
        purpose: { title: 'Purpose & Use Cases', capabilities: ['Says hello'] },
        features: { title: 'Key Features', coreFeatures: ['Fast greetings'] },
        howItWorks: { title: 'How It Works', architecture: 'Single file module' },
        prerequisites: { title: 'Prerequisites', runtime: 'Node.js >= 18' },
        installation: { title: 'Installation Guide', steps: [{ step: 1, command: 'npm install' }] },
        configuration: { title: 'Configuration', configFiles: [] },
        usage: { title: 'Usage & Examples', quickStart: 'node src/index.js' },
        techStack: { title: 'Tech Stack', languages: ['JavaScript'] },
        limitations: { title: 'Limitations & Considerations', knownLimitations: ['None'] },
        alternatives: { title: 'Alternatives', comparableProjects: [] },
        resources: { title: 'Official Resources', repositoryUrl: 'https://github.com/octocat/hello-world' },
      },
    }));

    const record = await PipelineService.run('https://github.com/octocat/hello-world', {
      onStageChange: (stage) => {
        stagesRecorded.push(stage);
      },
    });

    assert.equal(record.id, 'analysis-123');
    assert.equal(record.fullName, 'octocat/hello-world');
    assert.equal(record.revision, '949cdd7a1b2c3d4e5f');
    assert.equal(record.status, 'completed');
    assert.equal(record.score, 100);

    // Verify stages order
    assert.deepEqual(stagesRecorded, [
      PIPELINE_STAGES.VALIDATING,
      PIPELINE_STAGES.FETCHING,
      PIPELINE_STAGES.PROCESSING,
      PIPELINE_STAGES.ANALYZING,
      PIPELINE_STAGES.GENERATING,
      PIPELINE_STAGES.COMPLETED,
    ]);
  });

  it('handles invalid URL validation cleanly and records Failed stage', async () => {
    const stagesRecorded = [];

    mock.method(RepositoryService, 'resolveRepository', () => ({
      valid: false,
      error: 'Unsupported host.',
    }));

    await assert.rejects(
      async () => {
        await PipelineService.run('https://bitbucket.org/owner/repo', {
          onStageChange: (stage) => stagesRecorded.push(stage),
        });
      },
      { message: /Unsupported host/ }
    );

    assert.ok(stagesRecorded.includes(PIPELINE_STAGES.VALIDATING));
    assert.ok(stagesRecorded.includes(PIPELINE_STAGES.FAILED));
  });
});
