/**
 * GitEx — Analysis Viewer Client Interactions (GITEX-011 & GITEX-012)
 */

document.addEventListener('DOMContentLoaded', () => {
  const record = window.__GITEX_RECORD__;
  const recordId = window.__RECORD_ID__ || new URLSearchParams(window.location.search).get('id');

  // Save to LocalStorage if loaded freshly from server
  if (record && record.id) {
    try {
      saveRecordToLocalStorage(record);
    } catch (e) {
      console.warn('[GitEx] Failed to save record to LocalStorage:', e);
    }
  } else if (!record && recordId) {
    // Attempt client-side hydration from LocalStorage
    hydrateFromLocalStorage(recordId);
  }

  // Initialize interactive features
  initCopyButtons();
  initCopyMarkdownButton(record);
  initReanalyzeButton(record);
  initScrollSpy();
  initMobileToc();
});

/**
 * Saves analysis record to browser LocalStorage
 */
function saveRecordToLocalStorage(record) {
  const STORAGE_KEY = 'gitex_history';
  let history = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    history = raw ? JSON.parse(raw) : [];
  } catch {
    history = [];
  }

  // Remove existing with same id or duplicate URL & revision
  history = history.filter(item => item.id !== record.id && !(item.url === record.url && item.revision === record.revision));
  // Add new record at front
  history.unshift(record);

  // Keep last 25 records
  if (history.length > 25) {
    history = history.slice(0, 25);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('[GitEx] LocalStorage quota exceeded:', err);
  }
}

/**
 * Hydrates document client-side if loaded from history
 */
function hydrateFromLocalStorage(recordId) {
  try {
    const raw = localStorage.getItem('gitex_history');
    if (!raw) return;
    const history = JSON.parse(raw);
    const item = history.find(h => h.id === recordId);
    if (!item) return;

    // Update document title and header
    document.title = `${item.fullName} — GitEx Analysis`;
    const titleEl = document.getElementById('repo-title');
    if (titleEl) titleEl.textContent = item.fullName;

    const badgesEl = document.getElementById('dynamic-badges');
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span class="badge badge-citrus">${item.provider.toUpperCase()}</span>
        <span class="badge">SHA: ${(item.revision || '').substring(0, 7)}</span>
        <span class="badge">${item.language || ''}</span>
        <span class="badge">★ ${item.stars ?? 0}</span>
        <span class="badge badge-success">${item.status}</span>
      `;
    }
  } catch (err) {
    console.warn('[GitEx] Hydration error:', err);
  }
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

  // Close when clicking a TOC link on mobile
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

