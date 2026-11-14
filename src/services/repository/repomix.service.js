import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GitHubService } from './github.service.js';
import { GitLabService } from './gitlab.service.js';
import { RepositoryError } from './repository.errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate the local repomix binary and cjs script for serverless compatibility
const REPOMIX_BIN = path.resolve(__dirname, '../../../node_modules/.bin/repomix');
const REPOMIX_CJS = path.resolve(__dirname, '../../../node_modules/repomix/bin/repomix.cjs');

const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
const DEFAULT_MAX_BUFFER = 2 * 1024 * 1024; // 2MB max output
const CONCURRENT_FETCH_LIMIT = 5;

export class RepomixError extends RepositoryError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 500 });
    this.name = 'RepomixError';
  }
}

export class RepomixService {
  /**
   * Bundles an array of in-memory files using Repomix in an isolated temporary sandbox.
   *
   * @param {Array<{ path: string, content: string }>} files - Files to pack
   * @param {object} options - Options including timeout, maxBuffer, and output style
   * @returns {Promise<{
   *   packedContent: string,
   *   totalFiles: number,
   *   byteSize: number,
   *   style: string,
   *   sourcePaths: string[],
   * }>}
   */
  static async packFiles(files, options = {}) {
    if (!Array.isArray(files) || files.length === 0) {
      return {
        packedContent: '',
        totalFiles: 0,
        byteSize: 0,
        style: options.style || 'xml',
        sourcePaths: [],
      };
    }

    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const maxBuffer = options.maxBuffer || DEFAULT_MAX_BUFFER;
    const style = options.style || 'xml';

    // 1. Create a secure, isolated temporary staging directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `gitex-repomix-${crypto.randomUUID()}`));

    try {
      const sourcePaths = [];

      // 2. Stage files to temporary directory, preventing directory traversal
      for (const file of files) {
        if (!file || !file.path || typeof file.content !== 'string') continue;

        // Sanitize path and ensure it remains inside tempDir
        const safeRelativePath = path.normalize(file.path).replace(/^(\.\.[\/\\])+/, '');
        const targetPath = path.join(tempDir, safeRelativePath);

        if (!targetPath.startsWith(tempDir)) {
          console.warn(`[RepomixService] Skipping path traversal attempt: ${file.path}`);
          continue;
        }

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, file.content, 'utf8');
        sourcePaths.push(safeRelativePath);
      }

      if (sourcePaths.length === 0) {
        return {
          packedContent: '',
          totalFiles: 0,
          byteSize: 0,
          style,
          sourcePaths: [],
        };
      }

      // 3. Controlled process invocation (with serverless fallback)
      const args = [
        tempDir,
        '--stdout',
        '--style', style,
        '--quiet',
        '--no-security-check',
      ];

      const binToExec = fs.existsSync(REPOMIX_BIN)
        ? REPOMIX_BIN
        : (fs.existsSync(REPOMIX_CJS) ? process.execPath : null);
      const binArgs = binToExec === process.execPath ? [REPOMIX_CJS, ...args] : args;

      let stdout = '';
      if (!binToExec) {
        // In-memory packaging fallback for serverless environments where binaries are unavailable
        stdout = this.inMemoryPackXml(files);
      } else {
        try {
          stdout = await new Promise((resolve, reject) => {
            execFile(
              binToExec,
              binArgs,
              {
                timeout: timeoutMs,
                maxBuffer,
                env: { ...process.env, CI: 'true' },
              },
              (err, output, stderr) => {
                if (err) {
                  if (err.killed || err.signal === 'SIGTERM') {
                    return reject(
                      new RepomixError(`Repomix process timed out after ${timeoutMs / 1000}s.`, {
                        statusCode: 504,
                      })
                    );
                  }
                  if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
                    return reject(
                      new RepomixError('Repomix output exceeded size limit (2MB).', {
                        statusCode: 413,
                      })
                    );
                  }
                  // Fall back gracefully to in-memory packing if process execution fails in serverless sandbox
                  if (err.code === 'ENOENT' || err.code === 'EACCES') {
                    return resolve(this.inMemoryPackXml(files));
                  }
                  return reject(
                    new RepomixError(`Repomix execution failed: ${err.message}`, {
                      details: stderr || err.message,
                    })
                  );
                }
                resolve(output);
              }
            );
          });
        } catch (execErr) {
          if (execErr instanceof RepomixError && (execErr.statusCode === 504 || execErr.statusCode === 413)) {
            throw execErr;
          }
          stdout = this.inMemoryPackXml(files);
        }
      }

      return {
        packedContent: stdout,
        totalFiles: sourcePaths.length,
        byteSize: Buffer.byteLength(stdout, 'utf8'),
        style,
        sourcePaths,
      };
    } finally {
      // 4. Always clean up temporary staging directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn(`[RepomixService] Failed to clean up temp dir: ${cleanupErr.message}`);
      }
    }
  }

  /**
   * Fast in-memory XML pack fallback for serverless runtimes.
   */
  static inMemoryPackXml(files) {
    let out = 'This file is a merged representation of the entire repository.\n\n<file_summary>\n';
    files.forEach((f) => {
      out += `  <file path="${f.path}"/>\n`;
    });
    out += '</file_summary>\n\n<repository_files>\n';
    files.forEach((f) => {
      out += `<file path="${f.path}">\n${f.content || ''}\n</file>\n\n`;
    });
    out += '</repository_files>\n';
    return out;
  }

  /**
   * Helper to fetch file contents with controlled concurrency.
   */
  static async fetchFileContents(provider, repoMeta, filePaths, revision) {
    const results = [];
    const queue = [...filePaths];

    async function worker() {
      while (queue.length > 0) {
        const filePath = queue.shift();
        try {
          let content = '';
          if (provider === 'github') {
            content = await GitHubService.fetchFileContent(
              repoMeta.owner,
              repoMeta.name,
              filePath,
              revision
            );
          } else if (provider === 'gitlab') {
            content = await GitLabService.fetchFileContent(
              repoMeta.fullName,
              filePath,
              revision
            );
          }
          if (typeof content === 'string') {
            results.push({ path: filePath, content });
          }
        } catch (fetchErr) {
          // Gracefully skip files that cannot be fetched (e.g. permission or not found)
          console.warn(`[RepomixService] Could not fetch ${filePath}: ${fetchErr.message}`);
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(CONCURRENT_FETCH_LIMIT, filePaths.length) },
      () => worker()
    );
    await Promise.all(workers);

    return results;
  }

  /**
   * High-level orchestrator: fetches selected files and packs them via Repomix.
   */
  static async bundleRepositoryFiles(provider, repoMeta, selectedFiles, revision, options = {}) {
    const filePaths = (selectedFiles || []).map((f) => (typeof f === 'string' ? f : f.path));

    const filesWithContent = await this.fetchFileContents(
      provider,
      repoMeta,
      filePaths,
      revision
    );

    return this.packFiles(filesWithContent, options);
  }
}

export default RepomixService;

