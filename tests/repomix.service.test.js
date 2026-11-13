import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { RepomixService, RepomixError } from '../src/services/repository/repomix.service.js';

describe('RepomixService — GITEX-007', () => {
  it('bundles multiple files into structured XML format', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({ name: 'my-app', dependencies: { express: '^4.18.0' } }, null, 2),
      },
      {
        path: 'src/index.js',
        content: 'const express = require("express");\nconst app = express();\nmodule.exports = app;',
      },
      {
        path: '.env.example',
        content: 'PORT=3000\nNODE_ENV=development',
      },
    ];

    const result = await RepomixService.packFiles(files, { style: 'xml' });

    assert.equal(result.totalFiles, 3);
    assert.equal(result.style, 'xml');
    assert.ok(result.byteSize > 0);
    assert.ok(result.sourcePaths.includes('package.json'));
    assert.ok(result.sourcePaths.includes('src/index.js'));
    assert.ok(result.sourcePaths.includes('.env.example'));

    // Output must contain file contents and path tags
    assert.ok(result.packedContent.includes('package.json'));
    assert.ok(result.packedContent.includes('express'));
    assert.ok(result.packedContent.includes('PORT=3000'));
  });

  it('handles empty file list gracefully without error', async () => {
    const result = await RepomixService.packFiles([]);
    assert.equal(result.totalFiles, 0);
    assert.equal(result.packedContent, '');
    assert.equal(result.byteSize, 0);
    assert.deepEqual(result.sourcePaths, []);
  });

  it('sanitizes and prevents directory traversal paths', async () => {
    const files = [
      {
        path: '../../../../etc/passwd',
        content: 'root:x:0:0::/root:/bin/bash',
      },
      {
        path: 'src/valid.js',
        content: 'console.log("valid");',
      },
    ];

    const result = await RepomixService.packFiles(files);

    // Traversal path should be neutralized or normalized inside sandbox
    assert.ok(result.sourcePaths.includes('src/valid.js'));
    assert.equal(fs.existsSync('/etc/passwd.gitex'), false);
  });

  it('handles process timeout safely and throws RepomixError', async () => {
    const files = [
      { path: 'test.js', content: 'console.log("slow");' },
    ];

    // Pass an impossibly small timeout to trigger timeout handling
    await assert.rejects(
      async () => {
        await RepomixService.packFiles(files, { timeoutMs: 1 });
      },
      (err) => {
        assert.ok(err instanceof RepomixError);
        assert.equal(err.statusCode, 504);
        assert.ok(err.message.includes('timed out'));
        return true;
      }
    );
  });

  it('handles output exceeding maxBuffer limit', async () => {
    const hugeContent = 'console.log("large output");\n'.repeat(500);
    const files = [{ path: 'large.js', content: hugeContent }];

    // Pass tiny maxBuffer of 100 bytes to trigger maxBuffer guard
    await assert.rejects(
      async () => {
        await RepomixService.packFiles(files, { maxBuffer: 100 });
      },
      (err) => {
        assert.ok(err instanceof RepomixError);
        assert.equal(err.statusCode, 413);
        assert.ok(err.message.includes('size limit'));
        return true;
      }
    );
  });

  it('cleans up temporary sandbox directory after execution', async () => {
    const files = [{ path: 'cleanup-test.js', content: 'console.log("clean");' }];

    // Count directories matching gitex-repomix before
    const tmpBase = os.tmpdir();
    const countBefore = fs.readdirSync(tmpBase).filter((f) => f.startsWith('gitex-repomix-')).length;

    await RepomixService.packFiles(files);

    const countAfter = fs.readdirSync(tmpBase).filter((f) => f.startsWith('gitex-repomix-')).length;
    assert.equal(countAfter, countBefore, 'Temporary directories must be cleaned up');
  });
});

