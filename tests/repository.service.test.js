import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RepositoryService } from '../src/services/repository/repository.service.js';

describe('RepositoryService — GITEX-004', () => {
  describe('Provider Detection and Normalization', () => {
    it('normalizes GitHub URL with trailing slash and .git', () => {
      const res = RepositoryService.resolveRepository('https://github.com/facebook/react.git/');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'github');
      assert.equal(res.fullName, 'facebook/react');
      assert.equal(res.normalizedUrl, 'https://github.com/facebook/react');
      assert.equal(res.apiUrl, 'https://api.github.com/repos/facebook/react');
    });

    it('normalizes GitHub SSH URL to canonical HTTPS and API endpoints', () => {
      const res = RepositoryService.resolveRepository('git@github.com:facebook/react.git');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'github');
      assert.equal(res.fullName, 'facebook/react');
      assert.equal(res.normalizedUrl, 'https://github.com/facebook/react');
    });

    it('normalizes GitLab SSH URL to canonical HTTPS and API endpoints', () => {
      const res = RepositoryService.resolveRepository('git@gitlab.com:gitlab-org/gitlab.git');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'gitlab');
      assert.equal(res.fullName, 'gitlab-org/gitlab');
      assert.equal(res.normalizedUrl, 'https://gitlab.com/gitlab-org/gitlab');
      assert.equal(res.apiUrl, 'https://gitlab.com/api/v4/projects/gitlab-org%2Fgitlab');
    });

    it('normalizes deep links to repository root', () => {
      const res = RepositoryService.resolveRepository('https://github.com/expressjs/express/tree/master/examples');
      assert.equal(res.valid, true);
      assert.equal(res.fullName, 'expressjs/express');
      assert.equal(res.normalizedUrl, 'https://github.com/expressjs/express');
    });

    it('normalizes mixed-case hostnames while preserving repo case', () => {
      const res = RepositoryService.resolveRepository('https://GITHUB.COM/Torvalds/Linux');
      assert.equal(res.valid, true);
      assert.equal(res.provider, 'github');
      assert.equal(res.owner, 'Torvalds');
      assert.equal(res.name, 'Linux');
      assert.equal(res.normalizedUrl, 'https://github.com/Torvalds/Linux');
    });
  });

  describe('SSRF and Malicious URL Prevention', () => {
    it('blocks AWS/cloud metadata IP addresses (169.254.169.254)', () => {
      const res = RepositoryService.resolveRepository('http://169.254.169.254/latest/meta-data');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Only public GitHub'));
    });

    it('blocks loopback / localhost addresses', () => {
      const cases = [
        'http://localhost/repo/test',
        'http://127.0.0.1/repo/test',
        'http://[::1]/repo/test',
        'http://2130706433/repo/test', // Integer representation of 127.0.0.1
      ];

      for (const uri of cases) {
        const res = RepositoryService.resolveRepository(uri);
        assert.equal(res.valid, false, `Failed to reject: ${uri}`);
      }
    });

    it('blocks subdomain collision attacks (github.com.attacker.com)', () => {
      const res = RepositoryService.resolveRepository('https://github.com.attacker.com/owner/repo');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Only public GitHub'));
    });

    it('blocks credentials in URL', () => {
      const res = RepositoryService.resolveRepository('https://token:secret@github.com/owner/repo');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('Credentials are not allowed'));
    });

    it('blocks port manipulation (e.g. internal service scanning)', () => {
      const res = RepositoryService.resolveRepository('https://github.com:22/owner/repo');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('port numbers are not permitted'));
    });
  });
});
