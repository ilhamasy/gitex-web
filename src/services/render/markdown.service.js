import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import hljs from 'highlight.js';

/**
 * Configure marked with highlight.js syntax highlighting
 */
marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
});

/**
 * Custom renderer for marked to produce accessible, copyable code blocks
 */
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }) {
  const language = (lang || '').trim().toLowerCase();
  const validLanguage = hljs.getLanguage(language) ? language : null;

  let highlightedCode = '';
  if (validLanguage) {
    try {
      highlightedCode = hljs.highlight(text, { language: validLanguage, ignoreIllegals: true }).value;
    } catch {
      highlightedCode = escapeHtml(text);
    }
  } else {
    try {
      highlightedCode = hljs.highlightAuto(text).value;
    } catch {
      highlightedCode = escapeHtml(text);
    }
  }

  const displayLang = validLanguage || (language || 'text');
  const encodedCode = encodeURIComponent(text);

  return `
    <div class="code-block-wrapper my-4 rounded border border-border-default bg-surface-canvas overflow-hidden">
      <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 border-b border-border-default bg-surface-subtle text-xs font-mono text-text-subtle">
        <span class="code-block-lang uppercase tracking-wider font-medium text-[11px]">${escapeHtml(displayLang)}</span>
        <button 
          type="button" 
          class="copy-code-btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-text-subtle hover:text-text-primary hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-citrus"
          data-code="${encodedCode}"
          aria-label="Copy ${escapeHtml(displayLang)} code to clipboard"
        >
          <svg class="w-3.5 h-3.5 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          <span class="copy-text">Copy</span>
        </button>
      </div>
      <pre class="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-text-primary"><code class="hljs language-${escapeHtml(displayLang)}">${highlightedCode}</code></pre>
    </div>
  `;
};

// Ensure all external links open securely
renderer.link = function ({ href, title, text }) {
  const isExternal = /^https?:\/\//i.test(href);
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<a href="${escapeHtml(href)}"${titleAttr}${targetAttr} class="text-primary-citrus hover:underline underline-offset-2">${text}</a>`;
};

marked.use({ renderer });

/**
 * Simple HTML escaper
 */
function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize options matching security and syntax highlighting requirements
 */
const SANITIZE_OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'ul', 'ol', 'li', 'blockquote',
    'code', 'pre', 'span', 'strong', 'em', 'b', 'i', 's', 'del',
    'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'br', 'div', 'button', 'svg', 'path'
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'data-*', 'aria-*', 'role', 'title'],
    'a': ['href', 'target', 'rel'],
    'button': ['type', 'data-code', 'aria-label'],
    'svg': ['class', 'fill', 'stroke', 'viewbox', 'aria-hidden'],
    'path': ['stroke-linecap', 'stroke-linejoin', 'stroke-width', 'd', 'fill'],
    'code': ['class'],
    'pre': ['class'],
    'th': ['align', 'scope'],
    'td': ['align'],
  },
  allowedSchemes: ['http', 'https'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto']
  },
  transformTags: {
    'a': (tagName, attribs) => {
      // Disallow javascript: or unsafe links
      if (attribs.href && !attribs.href.startsWith('http://') && !attribs.href.startsWith('https://') && !attribs.href.startsWith('#')) {
        attribs.href = '#';
      }
      if (attribs.href && (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))) {
        attribs.rel = 'noopener noreferrer';
        attribs.target = '_blank';
      }
      return {
        tagName,
        attribs,
      };
    },
  },
};

export class MarkdownService {
  /**
   * Renders markdown string into sanitized HTML.
   *
   * @param {string} markdown - Input markdown string
   * @returns {string} Sanitized HTML string
   */
  static render(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '';
    }

    const rawHtml = marked.parse(markdown);
    return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
  }

  /**
   * Formats source path reference into HTML badge.
   *
   * @param {string} source - File path or URL
   * @param {string} [repoUrl] - Base repo URL to link file to
   * @returns {string} HTML markup
   */
  static renderSourceBadge(source, repoUrl = null) {
    if (!source) return '';
    const cleanSource = escapeHtml(source.trim());
    
    if (repoUrl && !cleanSource.startsWith('http')) {
      const fileUrl = `${repoUrl.replace(/\/$/, '')}/blob/HEAD/${cleanSource.replace(/^\//, '')}`;
      return `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="source-badge" title="View file in repository">
        <svg class="source-badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <span>${cleanSource}</span>
      </a>`;
    }

    return `<span class="source-badge">
      <svg class="source-badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
      <span>${cleanSource}</span>
    </span>`;
  }
}

export default MarkdownService;

