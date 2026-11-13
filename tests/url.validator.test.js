import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateRepositoryUrl } from '../src/validators/url.validator.js';

describe('Repository URL Validator (Unit)', () => {
  describe('Valid GitHub URLs', () => {
    it('accepts standard HTTPS GitHub URL', () => {
      const res = validateRepositoryUrl('https://github.com/expressjs/express');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'github');
      assert.equal(res.owner, 'expressjs');
      assert.equal(res.name, 'express');
      assert.equal(res.fullName, 'expressjs/express');
      assert.equal(res.normalizedUrl, 'https://github.com/expressjs/express');
    });

    it('strips .git extension and trailing slashes', () => {
      const res = validateRepositoryUrl('https://github.com/nodejs/node.git/');
      assert.equal(res.valid, true);
      assert.equal(res.owner, 'nodejs');
      assert.equal(res.name, 'node');
      assert.equal(res.normalizedUrl, 'https://github.com/nodejs/node');
    });

    it('accepts URLs without protocol', () => {
      const res = validateRepositoryUrl('github.com/facebook/react');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'github');
      assert.equal(res.fullName, 'facebook/react');
    });

    it('accepts www.github.com', () => {
      const res = validateRepositoryUrl('https://www.github.com/vuejs/core');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'github');
      assert.equal(res.fullName, 'vuejs/core');
    });

    it('accepts GitHub SSH syntax (git@github.com:owner/repo.git)', () => {
      const res = validateRepositoryUrl('git@github.com:torvalds/linux.git');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'github');
      assert.equal(res.fullName, 'torvalds/linux');
      assert.equal(res.normalizedUrl, 'https://github.com/torvalds/linux');
    });
  });

  describe('Valid GitLab URLs', () => {
    it('accepts standard HTTPS GitLab URL', () => {
      const res = validateRepositoryUrl('https://gitlab.com/gitlab-org/gitlab');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'gitlab');
      assert.equal(res.owner, 'gitlab-org');
      assert.equal(res.name, 'gitlab');
      assert.equal(res.normalizedUrl, 'https://gitlab.com/gitlab-org/gitlab');
    });

    it('accepts GitLab nested groups', () => {
      const res = validateRepositoryUrl('https://gitlab.com/group/subgroup/project');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'gitlab');
      assert.equal(res.fullName, 'group/subgroup/project');
      assert.equal(res.name, 'project');
    });
  });

  describe('Invalid URLs & Format Rejections', () => {
    it('rejects empty or missing URL', () => {
      const res1 = validateRepositoryUrl('');
      assert.equal(res1.valid, false);
      assert.ok(res1.error);

      const res2 = validateRepositoryUrl(null);
      assert.equal(res2.valid, false);
    });

    it('rejects unsupported hosts', () => {
      const res = validateRepositoryUrl('https://bitbucket.org/owner/repo');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Only public GitHub'));
    });

    it('rejects URLs missing repository name', () => {
      const res = validateRepositoryUrl('https://github.com/expressjs');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Invalid repository path'));
    });

    it('rejects reserved GitHub paths', () => {
      const res = validateRepositoryUrl('https://github.com/explore/repos');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('reserved portal path'));
    });

    it('rejects malformed URLs', () => {
      const res = validateRepositoryUrl('not a valid url at all');
      assert.equal(res.valid, false);
    });
  });

  describe('SSRF Protections', () => {
    it('rejects non-HTTP protocols (javascript:, file:, data:)', () => {
      const res = validateRepositoryUrl('javascript:alert(1)');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('protocols are supported'));
    });

    it('rejects embedded credentials in URL', () => {
      const res = validateRepositoryUrl('https://admin:password@github.com/owner/repo');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Credentials are not allowed'));
    });

    it('rejects non-standard ports', () => {
      const res = validateRepositoryUrl('https://github.com:8443/owner/repo');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('port numbers are not permitted'));
    });

    it('rejects localhost or internal IP addresses', () => {
      const res = validateRepositoryUrl('http://127.0.0.1/owner/repo');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Only public GitHub'));
    });
  });
});

