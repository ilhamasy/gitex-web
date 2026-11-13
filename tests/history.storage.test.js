import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import GitExHistory from '../public/js/history.storage.js';

// In-memory localStorage mock conforming to Web Storage API
class MockLocalStorage {
  constructor() {
    this.store = {};
    this.quotaLimit = false;
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key, value) {
    if (this.quotaLimit) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    }
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

describe('LocalStorage History Engine — GITEX-013 & GITEX-014', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    GitExHistory.getStorage = () => mockStorage;
  });

  const sampleRecord = {
    id: 'gitex-rec-1',
    provider: 'github',
    owner: 'ilhamasy',
    name: 'gitex-web',
    fullName: 'ilhamasy/gitex-web',
    url: 'https://github.com/ilhamasy/gitex-web',
    revision: '5c85d51',
    description: 'Developer field notebook',
    language: 'JavaScript',
    stars: 10,
    forks: 2,
    license: 'MIT',
    analyzedAt: '2026-11-13T14:00:00.000Z',
    status: 'completed',
    score: 100,
    analysis: {
      overview: { title: 'Repository Overview', summary: 'GitEx web repo' },
      purpose: { title: 'Purpose & Use Cases' },
      features: { title: 'Key Features' },
      howItWorks: { title: 'How It Works' },
      prerequisites: { title: 'Prerequisites' },
      installation: { title: 'Installation Guide' },
      configuration: { title: 'Configuration' },
      usage: { title: 'Usage & Examples' },
      techStack: { title: 'Tech Stack' },
      limitations: { title: 'Limitations & Considerations' },
      alternatives: { title: 'Alternatives & Similar Projects' },
      resources: { title: 'Official Resources' },
    },
  };

  it('saves analysis record and retrieves it by ID and URL', () => {
    const saved = GitExHistory.save(sampleRecord);
    assert.ok(saved);
    assert.equal(saved.id, 'gitex-rec-1');

    const byId = GitExHistory.getById('gitex-rec-1');
    assert.ok(byId);
    assert.equal(byId.fullName, 'ilhamasy/gitex-web');

    const byUrl = GitExHistory.getByUrl('https://github.com/ilhamasy/gitex-web');
    assert.ok(byUrl);
    assert.equal(byUrl.id, 'gitex-rec-1');
  });

  it('strips secrets and raw repomix bundles from saved records', () => {
    const taintedRecord = {
      ...sampleRecord,
      apiKey: 'AIzaSySecretKeyNeverPersist123456789',
      GEMINI_API_KEY: 'AIzaSySecret2',
      token: 'ghp_secretToken',
      packedContent: '<repomix><file>entire repo source</file></repomix>',
    };

    const saved = GitExHistory.save(taintedRecord);
    assert.equal(saved.apiKey, undefined);
    assert.equal(saved.GEMINI_API_KEY, undefined);
    assert.equal(saved.token, undefined);
    assert.equal(saved.packedContent, undefined);

    const storedRaw = mockStorage.getItem(GitExHistory.STORAGE_KEY);
    assert.doesNotMatch(storedRaw, /AIzaSySecretKey/);
    assert.doesNotMatch(storedRaw, /ghp_secretToken/);
    assert.doesNotMatch(storedRaw, /entire repo source/);
  });

  it('deduplicates existing record when re-analyzing same repo URL and revision', () => {
    GitExHistory.save(sampleRecord);

    const updatedRecord = {
      ...sampleRecord,
      id: 'gitex-rec-updated',
      score: 95,
      analyzedAt: '2026-11-13T14:30:00.000Z',
    };

    GitExHistory.save(updatedRecord);

    const all = GitExHistory.getAll();
    assert.equal(all.length, 1, 'Should update existing entry rather than duplicate');
    assert.equal(all[0].id, 'gitex-rec-updated');
    assert.equal(all[0].score, 95);
  });

  it('filters out corrupted or tampered records from storage gracefully', () => {
    // Set corrupted JSON in storage
    mockStorage.setItem(GitExHistory.STORAGE_KEY, '{"invalid_array": true}');
    assert.deepEqual(GitExHistory.getAll(), []);

    // Set array with missing required fields
    mockStorage.setItem(GitExHistory.STORAGE_KEY, JSON.stringify([
      { id: 'broken-1' }, // Missing fullName, url, analysis
      sampleRecord,
    ]));

    const valid = GitExHistory.getAll();
    assert.equal(valid.length, 1);
    assert.equal(valid[0].id, 'gitex-rec-1');
  });

  it('deletes an individual record and clears all history', () => {
    GitExHistory.save(sampleRecord);
    assert.equal(GitExHistory.getAll().length, 1);

    const deleted = GitExHistory.delete('gitex-rec-1');
    assert.equal(deleted, true);
    assert.equal(GitExHistory.getAll().length, 0);
    assert.equal(GitExHistory.isEmpty(), true);

    GitExHistory.save(sampleRecord);
    assert.equal(GitExHistory.getAll().length, 1);

    GitExHistory.clear();
    assert.equal(GitExHistory.getAll().length, 0);
    assert.equal(GitExHistory.isEmpty(), true);
  });

  it('handles quota limits gracefully by pruning oldest records', () => {
    // Save 5 items
    for (let i = 1; i <= 5; i++) {
      GitExHistory.save({
        ...sampleRecord,
        id: `rec-${i}`,
        url: `https://github.com/user/repo-${i}`,
        revision: `rev-${i}`,
      });
    }

    assert.equal(GitExHistory.getAll().length, 5);

    // Now simulate quota error when storing more than 5 items
    let setItemCallCount = 0;
    const originalSetItem = mockStorage.setItem.bind(mockStorage);
    mockStorage.setItem = (key, val) => {
      setItemCallCount++;
      // Throw on first attempt, then accept on second attempt when pruned
      if (setItemCallCount === 1) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        err.code = 22;
        throw err;
      }
      originalSetItem(key, val);
    };

    const saved = GitExHistory.save({
      ...sampleRecord,
      id: 'rec-6',
      url: 'https://github.com/user/repo-6',
      revision: 'rev-6',
    });

    assert.ok(saved);
    assert.equal(saved.id, 'rec-6');
    // Oldest record (rec-1) should have been pruned to fit
    const all = GitExHistory.getAll();
    assert.ok(all.some(r => r.id === 'rec-6'));
    assert.ok(!all.some(r => r.id === 'rec-1'));
  });
});

