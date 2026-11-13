import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TreeFilterService } from '../src/services/repository/tree-filter.service.js';

describe('TreeFilterService — GITEX-006', () => {
  describe('File and Directory Exclusions', () => {
    it('ignores files in excluded directories', () => {
      const paths = [
        'node_modules/express/index.js',
        'dist/bundle.js',
        'build/static/js/main.js',
        'vendor/bundle/ruby.rb',
        '.git/config',
        '.github/workflows/ci.yml',
        'coverage/lcov.info',
        'venv/lib/python/site-packages/pkg.py',
        '__pycache__/mod.cpython-310.pyc',
      ];

      for (const p of paths) {
        assert.equal(TreeFilterService.shouldIgnore(p), true, `Failed to ignore: ${p}`);
      }
    });

    it('ignores binary and media files by extension', () => {
      const paths = [
        'assets/logo.png',
        'images/banner.jpg',
        'icons/favicon.ico',
        'fonts/inter.woff2',
        'bin/app.exe',
        'lib/native.so',
        'releases/archive.zip',
        'data/db.sqlite',
        'models/weights.bin',
        'scripts/vendor.min.js',
      ];

      for (const p of paths) {
        assert.equal(TreeFilterService.shouldIgnore(p), true, `Failed to ignore: ${p}`);
      }
    });

    it('ignores files exceeding maximum size limit', () => {
      const allowedSize = 50 * 1024; // 50KB
      const tooLarge = 150 * 1024; // 150KB

      assert.equal(TreeFilterService.shouldIgnore('src/app.js', allowedSize, 100 * 1024), false);
      assert.equal(TreeFilterService.shouldIgnore('src/huge.js', tooLarge, 100 * 1024), true);
    });

    it('accepts legitimate source and config files', () => {
      const allowed = [
        'package.json',
        'src/index.js',
        'src/services/user.service.ts',
        'README.md',
        'Dockerfile',
        '.env.example',
        'tsconfig.json',
        'main.go',
        'app/models.py',
      ];

      for (const p of allowed) {
        assert.equal(TreeFilterService.shouldIgnore(p), false, `Should NOT ignore: ${p}`);
      }
    });
  });

  describe('File Classification', () => {
    it('classifies manifests, configs, docs, entrypoints, and source files', () => {
      assert.equal(TreeFilterService.classifyFile('package.json'), 'manifest');
      assert.equal(TreeFilterService.classifyFile('Cargo.toml'), 'manifest');
      assert.equal(TreeFilterService.classifyFile('requirements.txt'), 'manifest');
      assert.equal(TreeFilterService.classifyFile('Dockerfile'), 'manifest');

      assert.equal(TreeFilterService.classifyFile('.env.example'), 'config');
      assert.equal(TreeFilterService.classifyFile('tsconfig.json'), 'config');
      assert.equal(TreeFilterService.classifyFile('vite.config.ts'), 'config');

      assert.equal(TreeFilterService.classifyFile('README.md'), 'doc');
      assert.equal(TreeFilterService.classifyFile('CONTRIBUTING.md'), 'doc');

      assert.equal(TreeFilterService.classifyFile('src/index.js'), 'entry');
      assert.equal(TreeFilterService.classifyFile('main.py'), 'entry');

      assert.equal(TreeFilterService.classifyFile('src/utils/helpers.ts'), 'source');
    });
  });

  describe('Tree Selection and Prioritization', () => {
    it('prioritizes manifests and entrypoints while applying limits', () => {
      const treeItems = [
        { path: 'node_modules/dep/index.js', type: 'blob', size: 100 },
        { path: 'src', type: 'tree' },
        { path: 'package.json', type: 'blob', size: 1200 },
        { path: 'src/index.js', type: 'blob', size: 4500 },
        { path: '.env.example', type: 'blob', size: 300 },
        { path: 'README.md', type: 'blob', size: 2000 },
        { path: 'src/components/DeepNested/Button.tsx', type: 'blob', size: 800 },
        { path: 'src/utils.ts', type: 'blob', size: 900 },
        { path: 'assets/image.png', type: 'blob', size: 50000 },
      ];

      const res = TreeFilterService.filterAndSelect(treeItems, { maxRelevant: 5 });

      assert.equal(res.totalBlobs, 8);
      assert.equal(res.totalTrees, 1);
      assert.equal(res.relevantFiles.length, 5);

      // Verify manifests and configs are captured in summary
      assert.ok(res.summary.manifests.includes('package.json'));
      assert.ok(res.summary.configs.includes('.env.example'));
      assert.ok(res.summary.docs.includes('README.md'));
      assert.ok(res.summary.entryPoints.includes('src/index.js'));

      // Check first prioritized item is manifest
      assert.equal(res.relevantFiles[0].path, 'package.json');
      assert.equal(res.relevantFiles[0].category, 'manifest');
    });
  });
});
