/**
 * GitEx — Analysis Viewer Client Interactions (GITEX-011, GITEX-012, GITEX-013, GITEX-014)
 */

document.addEventListener('DOMContentLoaded', () => {
  let record = window.__GITEX_RECORD__;
  const recordId = window.__RECORD_ID__ || new URLSearchParams(window.location.search).get('id');

  // Save to LocalStorage if loaded freshly from server
  if (record && record.id) {
    if (window.GitExHistory) {
      window.GitExHistory.save(record);
    }
  } else if (!record && recordId) {
    // Attempt client-side hydration from LocalStorage
    record = hydrateFromLocalStorage(recordId);
  }

  // Initialize interactive features
  initCopyButtons();
  initCopyMarkdownButton(record);
  initReanalyzeButton(record);
  initScrollSpy();
  initMobileToc();
});

/**
 * Hydrates document client-side if loaded from history
 */
function hydrateFromLocalStorage(recordId) {
  try {
    const item = window.GitExHistory ? window.GitExHistory.getById(recordId) : null;
    if (!item) {
      const placeholder = document.getElementById('client-document-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <div class="section-incomplete-notice">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>Analysis record '${escapeHtml(recordId)}' was not found in local history.</span>
          </div>
          <p><a href="/" class="btn-primary" style="display:inline-block;margin-top:0.5rem;">Analyze a Repository</a></p>
        `;
      }
      return null;
    }

    // Update document title and header
    document.title = `${item.fullName} — GitEx Analysis`;
    const titleEl = document.getElementById('repo-title');
    if (titleEl) titleEl.textContent = item.fullName;

    const badgesEl = document.getElementById('dynamic-badges');
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span class="badge badge-citrus">${item.provider.toUpperCase()}</span>
        ${item.revision ? `<span class="badge" title="Commit SHA">SHA: ${escapeHtml(item.revision.substring(0, 7))}</span>` : ''}
        ${item.language ? `<span class="badge">${escapeHtml(item.language)}</span>` : ''}
        ${item.stars !== undefined ? `<span class="badge">★ ${item.stars}</span>` : ''}
        ${item.license ? `<span class="badge">${escapeHtml(item.license)}</span>` : ''}
        <span class="badge ${item.status === 'completed' ? 'badge-success' : 'badge-amber'}">${item.status === 'completed' ? 'Completed (12/12)' : 'Partial'}</span>
      `;
    }

    // Render 12 canonical sections dynamically into #analysis-document if not already rendered
    const docContainer = document.getElementById('analysis-document');
    if (docContainer && item.analysis) {
      const sectionKeys = [
        { key: 'overview', title: 'Repository Overview', num: '01' },
        { key: 'purpose', title: 'Purpose & Use Cases', num: '02' },
        { key: 'features', title: 'Key Features', num: '03' },
        { key: 'howItWorks', title: 'How It Works', num: '04' },
        { key: 'prerequisites', title: 'Prerequisites', num: '05' },
        { key: 'installation', title: 'Installation Guide', num: '06' },
        { key: 'configuration', title: 'Configuration', num: '07' },
        { key: 'usage', title: 'Usage & Examples', num: '08' },
        { key: 'techStack', title: 'Tech Stack', num: '09' },
        { key: 'limitations', title: 'Limitations & Considerations', num: '10' },
        { key: 'alternatives', title: 'Alternatives & Similar Projects', num: '11' },
        { key: 'resources', title: 'Official Resources', num: '12' },
      ];

      let docHtml = '';
      sectionKeys.forEach(({ key, title, num }) => {
        const sec = item.analysis[key] || {};
        const isNotDoc = sec.status === 'not_documented' || sec.isIncomplete;

        docHtml += `
          <section class="analysis-section" id="section-${key}" aria-labelledby="heading-${key}">
            <header class="section-header-row">
              <div class="section-title-wrap">
                <span class="section-number">${num}</span>
                <h2 id="heading-${key}" class="section-title">${escapeHtml(sec.title || title)}</h2>
              </div>
              ${isNotDoc ? '<span class="badge badge-amber">Not documented</span>' : ''}
            </header>
            <div class="section-body">
              ${isNotDoc ? `
                <div class="section-incomplete-notice">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <span>This section was not documented or could not be verified from repository documentation.</span>
                </div>
              ` : ''}
              ${renderHydratedSectionContent(key, sec, item)}
            </div>
          </section>
        `;
      });

      docContainer.innerHTML = docHtml;
    }

    return item;
  } catch (err) {
    console.warn('[GitEx] Hydration error:', err);
    return null;
  }
}

/**
 * Helper to render individual section content during client-side hydration
 */
function renderHydratedSectionContent(key, sec, item) {
  let content = '';

  if (key === 'overview') {
    if (sec.summary) content += `<p>${escapeHtml(sec.summary)}</p>`;
    if (sec.problemSolved && sec.problemSolved !== 'Not documented') {
      content += `<h3>Problem Solved</h3><p>${escapeHtml(sec.problemSolved)}</p>`;
    }
    if (sec.mainGoal && sec.mainGoal !== 'Not documented') {
      content += `<h3>Main Goal</h3><p>${escapeHtml(sec.mainGoal)}</p>`;
    }
  } else if (key === 'purpose') {
    if (sec.targetUsers?.length) {
      content += `<h3>Target Users</h3><ul>${sec.targetUsers.map(u => `<li>${escapeHtml(u)}</li>`).join('')}</ul>`;
    }
    if (sec.capabilities?.length) {
      content += `<h3>Core Capabilities</h3><ul>${sec.capabilities.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'features') {
    if (sec.coreFeatures?.length) {
      content += `<h3>Core Features</h3><ul>${sec.coreFeatures.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'howItWorks') {
    if (sec.architecture) content += `<h3>Architecture</h3><p>${escapeHtml(sec.architecture)}</p>`;
    if (sec.dataFlow) content += `<h3>Data Flow</h3><p>${escapeHtml(sec.dataFlow)}</p>`;
  } else if (key === 'installation') {
    if (sec.steps?.length) {
      sec.steps.forEach((st, idx) => {
        content += `
          <div class="install-step-item">
            <div class="install-step-header">
              <span class="install-step-num">${st.step || (idx + 1)}</span>
              <span class="install-step-title">${escapeHtml(st.description || 'Installation Step')}</span>
            </div>
            ${st.command ? `
              <div class="code-block-wrapper my-4 rounded border border-border-default bg-surface-canvas overflow-hidden">
                <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 border-b border-border-default bg-surface-subtle text-xs font-mono text-text-subtle">
                  <span class="code-block-lang uppercase font-medium text-[11px]">BASH</span>
                  <button type="button" class="copy-code-btn inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-text-subtle hover:text-text-primary" data-code="${encodeURIComponent(st.command)}">
                    <span class="copy-text">Copy</span>
                  </button>
                </div>
                <pre class="p-4 overflow-x-auto text-sm font-mono leading-relaxed"><code class="hljs">${escapeHtml(st.command)}</code></pre>
              </div>
            ` : ''}
          </div>
        `;
      });
    }
  } else if (key === 'techStack') {
    if (sec.languages?.length) content += `<p><strong>Languages:</strong> ${escapeHtml(sec.languages.join(', '))}</p>`;
    if (sec.frameworks?.length) content += `<p><strong>Frameworks:</strong> ${escapeHtml(sec.frameworks.join(', '))}</p>`;
  } else if (key === 'resources') {
    content += `<ul><li><strong>Repository:</strong> <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.url)}</a></li></ul>`;
  } else {
    content += `<p>${escapeHtml(JSON.stringify(sec))}</p>`;
  }

  // Render sources if available
  if (sec.sources?.length) {
    content += `
      <div class="section-sources-row">
        <span class="sources-label">Sources:</span>
        ${sec.sources.map(src => `<span class="source-badge font-mono text-xs">${escapeHtml(src)}</span>`).join(' ')}
      </div>
    `;
  }

  return content;
}

/**
 * Initializes copy actions for code blocks
 */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-code-btn');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const encodedCode = btn.getAttribute('data-code');
      const textToCopy = decodeURIComponent(encodedCode || '');

      if (!textToCopy) return;

      const copyTextSpan = btn.querySelector('.copy-text');
      const originalText = copyTextSpan ? copyTextSpan.textContent : 'Copy';

      try {
        await navigator.clipboard.writeText(textToCopy);
        if (copyTextSpan) copyTextSpan.textContent = 'Copied!';
        btn.classList.add('text-primary-citrus');
        showToast('Code copied to clipboard');

        setTimeout(() => {
          if (copyTextSpan) copyTextSpan.textContent = originalText;
          btn.classList.remove('text-primary-citrus');
        }, 2000);
      } catch (err) {
        console.error('[GitEx] Failed to copy code:', err);
        showToast('Failed to copy to clipboard');
      }
    });
  });
}

/**
 * Initializes copy full markdown button
 */
function initCopyMarkdownButton(record) {
  const btn = document.getElementById('btn-copy-markdown');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!record || !record.analysis) {
      showToast('No analysis available to copy');
      return;
    }

    let md = `# ${record.fullName}\n\n`;
    md += `> Source: ${record.url} | Revision: ${record.revision} | Analyzed with GitEx\n\n`;

    const sectionTitles = {
      overview: '01. Repository Overview',
      purpose: '02. Purpose & Use Cases',
      features: '03. Key Features',
      howItWorks: '04. How It Works',
      prerequisites: '05. Prerequisites',
      installation: '06. Installation Guide',
      configuration: '07. Configuration',
      usage: '08. Usage & Examples',
      techStack: '09. Tech Stack',
      limitations: '10. Limitations & Considerations',
      alternatives: '11. Alternatives & Similar Projects',
      resources: '12. Official Resources',
    };

    for (const [key, title] of Object.entries(sectionTitles)) {
      const sec = record.analysis[key];
      md += `## ${title}\n\n`;
      if (!sec) {
        md += `*Not documented.*\n\n`;
        continue;
      }

      if (key === 'overview') {
        md += `${sec.summary || ''}\n\n`;
        if (sec.problemSolved) md += `**Problem Solved:**\n${sec.problemSolved}\n\n`;
        if (sec.mainGoal) md += `**Main Goal:**\n${sec.mainGoal}\n\n`;
      } else if (key === 'installation' && sec.steps) {
        sec.steps.forEach((st, idx) => {
          md += `${idx + 1}. **${st.description || 'Step'}**\n`;
          if (st.command) md += `   \`\`\`bash\n   ${st.command}\n   \`\`\`\n`;
        });
        md += '\n';
      } else {
        md += `${JSON.stringify(sec, null, 2)}\n\n`;
      }
    }

    try {
      await navigator.clipboard.writeText(md);
      showToast('Full Markdown copied to clipboard');
    } catch {
      showToast('Failed to copy markdown');
    }
  });
}

/**
 * Initializes re-analyze button
 */
function initReanalyzeButton(record) {
  const btn = document.getElementById('btn-reanalyze');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (record && record.url) {
      window.location.href = `/?url=${encodeURIComponent(record.url)}&reanalyze=true`;
    } else {
      window.location.href = '/';
    }
  });
}

/**
 * Intersection Observer for Table of Contents scroll spy
 */
function initScrollSpy() {
  const sections = document.querySelectorAll('.analysis-section');
  const tocLinks = document.querySelectorAll('.toc-link');

  if (!sections.length || !tocLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const key = id.replace('section-', '');
        
        tocLinks.forEach(link => {
          if (link.getAttribute('data-section') === key) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-80px 0px -70% 0px',
  });

  sections.forEach(sec => observer.observe(sec));
}

/**
 * Mobile Table of Contents drawer toggle
 */
function initMobileToc() {
  const toggleBtn = document.getElementById('btn-toggle-mobile-toc');
  const tocRail = document.getElementById('toc-rail');

  if (!toggleBtn || !tocRail) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    tocRail.classList.toggle('open', !isExpanded);
  });

  tocRail.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        tocRail.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

/**
 * Shows transient toast feedback
 */
function showToast(message) {
  const toast = document.getElementById('gitex-toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
