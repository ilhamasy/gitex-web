import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MarkdownService } from '../src/services/render/markdown.service.js';

describe('MarkdownService & Sanitizer — GITEX-011', () => {
  it('renders standard markdown to clean HTML', () => {
    const md = '## Key Architecture\nThis is **bold** and *italic*.';
    const html = MarkdownService.render(md);

    assert.match(html, /<h2/);
    assert.match(html, /Key Architecture/);
    assert.match(html, /<strong>bold<\/strong>/);
    assert.match(html, /<em>italic<\/em>/);
  });

  it('renders syntax-highlighted code blocks with copy attributes and language label', () => {
    const md = '```javascript\nconst a = 42;\nconsole.log(a);\n```';
    const html = MarkdownService.render(md);

    assert.match(html, /class="code-block-wrapper/);
    assert.match(html, /data-code="const%20a%20%3D%2042%3B%0Aconsole\.log\(a\)%3B"/);
    assert.match(html, /class="copy-code-btn/);
    assert.match(html, /hljs language-javascript/);
    assert.match(html, /<span class="hljs-keyword">const<\/span>/);
  });

  it('sanitizes malicious script tags and inline handlers', () => {
    const malicious = '<script>alert("xss")</script>\n\n<img src="x" onerror="alert(1)" />\n\n[Attack](javascript:alert("pwned"))';
    const html = MarkdownService.render(malicious);

    assert.doesNotMatch(html, /<script/i);
    assert.doesNotMatch(html, /<img/i);
    assert.doesNotMatch(html, /onerror/i);
    assert.doesNotMatch(html, /javascript:/i);
  });

  it('forces rel="noopener noreferrer" and target="_blank" on external links', () => {
    const md = '[External Documentation](https://example.com/docs)';
    const html = MarkdownService.render(md);

    assert.match(html, /href="https:\/\/example\.com\/docs"/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
  });

  it('renders source badges correctly', () => {
    const badge1 = MarkdownService.renderSourceBadge('package.json');
    assert.match(badge1, /package\.json/);

    const badge2 = MarkdownService.renderSourceBadge('src/server.js', 'https://github.com/owner/repo');
    assert.match(badge2, /href="https:\/\/github\.com\/owner\/repo\/blob\/HEAD\/src\/server\.js"/);
  });
});
