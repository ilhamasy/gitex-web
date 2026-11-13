import path from 'path';
import config from '../../config/index.js';

// Directories to ignore universally
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'vendor',
  'dist',
  'build',
  'out',
  'target',
  'bin',
  'obj',
  'coverage',
  '.git',
  '.github',
  '.gitlab',
  '.idea',
  '.vscode',
  '.next',
  '.nuxt',
  '.cache',
  'tmp',
  'temp',
  'venv',
  '.venv',
  'env',
  '__pycache__',
  '.pytest_cache',
  'Pods',
  'public/build',
]);

// File extensions to ignore (binaries, media, fonts, archives, compiled artifacts)
const IGNORED_EXTENSIONS = new Set([
  // Images & Media
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif', '.bmp', '.tiff',
  '.mp4', '.mp3', '.wav', '.ogg', '.mov', '.avi', '.webm',
  // Executables & Binaries
  '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war', '.bin', '.iso', '.dmg',
  // Archives
  '.zip', '.tar', '.gz', '.7z', '.rar', '.bz2', '.xz',
  // Fonts
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  // Compiled code & Bytecode
  '.pyc', '.pyo', '.pyd', '.o', '.a', '.obj', '.wasm', '.pdb',
  // Database files
  '.sqlite', '.db', '.parquet', '.dat',
  // Lockfiles (usually too verbose for LLM unless specifically requested)
  '.map',
]);

// Well-known dependency manifests
const MANIFEST_FILENAMES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'requirements.txt',
  'pyproject.toml',
  'pipfile',
  'setup.py',
  'setup.cfg',
  'poetry.lock',
  'cargo.toml',
  'cargo.lock',
  'go.mod',
  'go.sum',
  'gemfile',
  'gemfile.lock',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'settings.gradle',
  'composer.json',
  'composer.lock',
  'cmakelists.txt',
  'makefile',
  'dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'compose.yaml',
]);

// Well-known configuration files
const CONFIG_FILENAMES = new Set([
  '.env.example',
  '.env.sample',
  '.env.template',
  'tsconfig.json',
  'jsconfig.json',
  'vite.config.js',
  'vite.config.ts',
  'webpack.config.js',
  'rollup.config.js',
  'next.config.js',
  'next.config.mjs',
  'nuxt.config.ts',
  'nuxt.config.js',
  'tailwind.config.js',
  'tailwind.config.ts',
  '.eslintrc.json',
  '.eslintrc.js',
]);

// Recognized primary source code extensions
const SOURCE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx',
  '.ts', '.mts', '.cts', '.tsx',
  '.py',
  '.go',
  '.rs',
  '.java', '.kt', '.scala',
  '.c', '.cpp', '.h', '.hpp', '.cc',
  '.cs', '.fs',
  '.rb',
  '.php',
  '.swift',
  '.sh', '.bash',
  '.sql',
  '.graphql', '.gql',
  '.html', '.css', '.scss',
]);

// Common application entry points
const ENTRY_POINT_NAMES = new Set([
  'index.js', 'index.ts', 'main.js', 'main.ts', 'server.js', 'server.ts', 'app.js', 'app.ts',
  'main.py', 'app.py', 'server.py', 'wsgi.py', 'asgi.py',
  'main.go',
  'main.rs', 'lib.rs',
  'index.html',
]);

export class TreeFilterService {
  /**
   * Determine whether a given file path should be ignored.
   */
  static shouldIgnore(filePath, size = null, maxSize = config.ingestion.maxFileSizeBytes) {
    if (!filePath || typeof filePath !== 'string') return true;

    const normalized = filePath.replace(/\\/g, '/');
    const segments = normalized.split('/');

    // Check directory exclusions
    for (const segment of segments.slice(0, -1)) {
      if (IGNORED_DIRECTORIES.has(segment.toLowerCase())) {
        return true;
      }
    }

    const filename = segments[segments.length - 1];
    const lowerFilename = filename.toLowerCase();

    // Ignore minified files
    if (lowerFilename.endsWith('.min.js') || lowerFilename.endsWith('.min.css')) {
      return true;
    }

    // Ignore bundle outputs
    if (lowerFilename.includes('.bundle.') || lowerFilename.includes('-bundle.')) {
      return true;
    }

    // Check extension exclusions
    const ext = path.extname(lowerFilename);
    if (IGNORED_EXTENSIONS.has(ext)) {
      return true;
    }

    // Check file size threshold if provided
    if (typeof size === 'number' && size > maxSize) {
      return true;
    }

    return false;
  }

  /**
   * Classify file into manifest, config, doc, entry, or source.
   */
  static classifyFile(filePath) {
    const filename = path.basename(filePath);
    const lowerFilename = filename.toLowerCase();
    const ext = path.extname(lowerFilename);

    if (MANIFEST_FILENAMES.has(lowerFilename)) {
      return 'manifest';
    }

    if (CONFIG_FILENAMES.has(lowerFilename)) {
      return 'config';
    }

    if (/^readme(\..+)?$/i.test(filename) || /^contributing(\..+)?$/i.test(filename) || /^license(\..+)?$/i.test(filename)) {
      return 'doc';
    }

    if (ENTRY_POINT_NAMES.has(lowerFilename)) {
      return 'entry';
    }

    if (SOURCE_EXTENSIONS.has(ext)) {
      return 'source';
    }

    return 'other';
  }

  /**
   * Process and select the most relevant files from repository tree items.
   */
  static filterAndSelect(treeItems, options = {}) {
    const maxEntries = options.maxEntries || config.ingestion.maxTreeEntries;
    const maxRelevant = options.maxRelevant || config.ingestion.maxRelevantFiles;
    const maxSize = options.maxSize || config.ingestion.maxFileSizeBytes;

    const manifests = [];
    const configs = [];
    const docs = [];
    const entryPoints = [];
    const sourceFiles = [];

    let totalBlobs = 0;
    let totalTrees = 0;

    // Filter and categorize
    for (const item of (treeItems || []).slice(0, maxEntries)) {
      if (item.type === 'tree') {
        totalTrees++;
        continue;
      }

      if (item.type !== 'blob') {
        continue;
      }

      totalBlobs++;

      if (this.shouldIgnore(item.path, item.size, maxSize)) {
        continue;
      }

      const category = this.classifyFile(item.path);
      const fileRecord = {
        path: item.path,
        category,
        size: item.size || null,
        depth: item.path.split('/').length - 1,
      };

      if (category === 'manifest') {
        manifests.push(fileRecord);
      } else if (category === 'config') {
        configs.push(fileRecord);
      } else if (category === 'doc') {
        docs.push(fileRecord);
      } else if (category === 'entry') {
        entryPoints.push(fileRecord);
      } else if (category === 'source') {
        sourceFiles.push(fileRecord);
      }
    }

    // Sort source files by depth (shallow root files first, e.g. src/index.js over src/a/b/c/d.js)
    sourceFiles.sort((a, b) => a.depth - b.depth);

    // Combine prioritized relevant files
    const prioritized = [
      ...manifests,
      ...entryPoints,
      ...configs,
      ...docs,
      ...sourceFiles,
    ];

    const selectedFiles = prioritized.slice(0, maxRelevant).map(({ depth, ...rest }) => rest);

    return {
      totalBlobs,
      totalTrees,
      isTruncated: (treeItems || []).length > maxEntries,
      summary: {
        manifests: manifests.map((f) => f.path),
        configs: configs.map((f) => f.path),
        docs: docs.map((f) => f.path),
        entryPoints: entryPoints.map((f) => f.path),
        totalSourceFiles: sourceFiles.length,
      },
      relevantFiles: selectedFiles,
    };
  }
}

export default TreeFilterService;

