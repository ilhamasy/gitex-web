/**
 * GitEx — Analysis Viewer Client Interactions (GITEX-011, GITEX-012, GITEX-013, GITEX-014)
 */
import GitExHistory from './history.storage.js';

if (typeof window !== 'undefined' && !window.GitExHistory) {
  window.GitExHistory = GitExHistory;
}

async function initAnalysis() {
  let record = window.__GITEX_RECORD__;
  const recordId = window.__RECORD_ID__ || new URLSearchParams(window.location.search).get('id');

  // Save to LocalStorage if loaded freshly from server
  if (record && record.id) {
    if (window.GitExHistory) {
      window.GitExHistory.save(record);
    }
  } else if (!record && recordId) {
    // Attempt client-side hydration from LocalStorage or API
    record = await hydrateAnalysis(recordId);
  }

  // Initialize interactive features
  initCopyButtons();
  initCopyMarkdownButton(record);
  initReanalyzeButton(record);
  initTocNavigation();
  initScrollSpy();
  initMobileToc();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalysis);
} else {
  initAnalysis();
}

/**
 * Hydrates document client-side if loaded from history or server API
 */
async function hydrateAnalysis(recordId) {
  try {
    let item = window.GitExHistory ? window.GitExHistory.getById(recordId) : null;

    if (!item) {
      try {
        const raw = localStorage.getItem('gitex_history');
        if (raw) {
          const list = JSON.parse(raw);
          item = list.find((r) => r.id === recordId || r.url?.toLowerCase().includes(recordId.toLowerCase()));
        }
      } catch {}
    }

    // Attempt to fetch from server API if not found in LocalStorage
    if (!item) {
      try {
        const res = await fetch(`/api/analysis/${encodeURIComponent(recordId)}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            item = json.data;
            if (window.GitExHistory) {
              window.GitExHistory.save(item);
            }
          }
        }
      } catch (fetchErr) {
        console.warn('[GitEx Analysis] API fallback fetch failed:', fetchErr);
      }
    }

    if (!item) {
      const placeholder = document.getElementById('client-document-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <div class="section-incomplete-notice">
            <svg class="w-4 h-4 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>Analysis record '${escapeHtml(recordId)}' was not found in cache or local history.</span>
          </div>
          <p style="margin-top:1rem;"><a href="/" class="btn-primary" style="display:inline-block;">Analyze a Repository</a></p>
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

      const visibleKeys = sectionKeys
        .filter(({ key }) => isSectionVisible(key, item.analysis))
        .map((sec, idx) => ({
          ...sec,
          num: String(idx + 1).padStart(2, '0'),
        }));

      let docHtml = '';
      visibleKeys.forEach(({ key, title, num }) => {
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
                  <svg class="w-4 h-4 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <span>This section was not documented or could not be verified from repository documentation.</span>
                </div>
              ` : ''}
              ${renderHydratedSectionContent(key, sec, item)}
            </div>
          </section>
        `;
      });

      docContainer.innerHTML = docHtml;

      // Update Table of Contents rail to match visible sections
      const tocList = document.getElementById('toc-list');
      if (tocList) {
        tocList.innerHTML = visibleKeys.map(({ key, title, num }) => `
          <li>
            <a href="#section-${key}" class="toc-link" data-section="${key}">
              <span class="toc-num">${num}</span>
              <span class="toc-title">${escapeHtml(title)}</span>
            </a>
          </li>
        `).join('');
      }
    }

    return item;
  } catch (err) {
    console.warn('[GitEx] Hydration error:', err);
    return null;
  }
}

function formatItem(item) {
  if (!item) return '';
  if (typeof item === 'string') return escapeHtml(item.trim());
  if (typeof item === 'object') {
    const name = item.name || item.title || '';
    const desc = item.description || item.purpose || item.distinction || '';
    if (name && desc) return `<strong>${escapeHtml(name)}:</strong> ${escapeHtml(desc)}`;
    return escapeHtml(name || desc || '');
  }
  return escapeHtml(String(item));
}

function hasContent(val) {
  if (!val) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 && trimmed !== 'Not documented' && trimmed !== 'Not documented.' && trimmed !== 'N/A' && trimmed !== '[object Object]';
  }
  if (Array.isArray(val)) {
    return val.some(hasContent);
  }
  if (typeof val === 'object') {
    return Object.values(val).some(hasContent);
  }
  return true;
}

function isSectionVisible(key, analysis) {
  if (!analysis) return true;
  const sec = analysis[key];
  if (!sec) return false;

  switch (key) {
    case 'overview':
      return hasContent(sec.summary) || hasContent(sec.problemSolved) || hasContent(sec.mainGoal);
    case 'purpose':
      return (sec.targetUsers || []).some(hasContent) ||
             (sec.capabilities || []).some(hasContent) ||
             (sec.scenarios || []).some(hasContent);
    case 'features':
      return (sec.coreFeatures || []).some(hasContent) ||
             (sec.uniqueCapabilities || []).some(hasContent);
    case 'howItWorks':
      return hasContent(sec.architecture) ||
             (sec.components || []).some(hasContent) ||
             hasContent(sec.dataFlow);
    case 'prerequisites':
      return hasContent(sec.runtime) ||
             (sec.languages || []).some(hasContent) ||
             (sec.tools || []).some(hasContent) ||
             (sec.system || []).some(hasContent);
    case 'installation':
      return (sec.steps || []).some(hasContent) ||
             (sec.caveats || []).some(hasContent);
    case 'configuration':
      return (sec.configFiles || []).some(hasContent) ||
             (sec.environmentVariables || []).some(hasContent) ||
             (sec.secrets || []).some(hasContent);
    case 'usage':
      return hasContent(sec.quickStart) ||
             (sec.commonCommands || []).some(hasContent) ||
             (sec.codeExamples || []).some(hasContent);
    case 'techStack':
      return (sec.languages || []).some(hasContent) ||
             (sec.frameworks || []).some(hasContent) ||
             (sec.libraries || []).some(hasContent) ||
             (sec.infrastructure || []).some(hasContent);
    case 'limitations':
      return (sec.knownLimitations || []).some(hasContent) ||
             (sec.compatibility || []).some(hasContent) ||
             (sec.securityCaveats || []).some(hasContent) ||
             hasContent(sec.productionReadiness);
    case 'alternatives':
      return (sec.comparableProjects || []).some(hasContent);
    case 'resources':
      return hasContent(sec.documentationUrl) ||
             hasContent(sec.issueTrackerUrl) ||
             (sec.communityLinks || []).some(hasContent);
    default:
      return Object.entries(sec).some(([k, v]) => k !== 'title' && k !== 'sources' && k !== 'isIncomplete' && k !== 'status' && hasContent(v));
  }
}

/**
 * Helper to render individual section content during client-side hydration
 */
function renderHydratedSectionContent(key, sec, item) {
  let content = '';

  if (key === 'overview') {
    if (sec.summary && hasContent(sec.summary)) content += `<p>${escapeHtml(sec.summary)}</p>`;
    if (sec.problemSolved && hasContent(sec.problemSolved)) {
      content += `<h3>Problem Solved</h3><p>${escapeHtml(sec.problemSolved)}</p>`;
    }
    if (sec.mainGoal && hasContent(sec.mainGoal)) {
      content += `<h3>Main Goal</h3><p>${escapeHtml(sec.mainGoal)}</p>`;
    }
  } else if (key === 'purpose') {
    const validUsers = (sec.targetUsers || []).filter(hasContent);
    if (validUsers.length) {
      content += `<h3>Target Users</h3><ul>${validUsers.map(u => `<li>${formatItem(u)}</li>`).join('')}</ul>`;
    }
    const validCaps = (sec.capabilities || []).filter(hasContent);
    if (validCaps.length) {
      content += `<h3>Core Capabilities</h3><ul>${validCaps.map(c => `<li>${formatItem(c)}</li>`).join('')}</ul>`;
    }
    const validScen = (sec.scenarios || []).filter(hasContent);
    if (validScen.length) {
      content += `<h3>Real-World Scenarios</h3><ul>${validScen.map(s => `<li>${formatItem(s)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'features') {
    const validFeatures = (sec.coreFeatures || []).filter(hasContent);
    if (validFeatures.length) {
      content += `<h3>Core Features</h3><ul>${validFeatures.map(f => `<li>${formatItem(f)}</li>`).join('')}</ul>`;
    }
    const validUnique = (sec.uniqueCapabilities || []).filter(hasContent);
    if (validUnique.length) {
      content += `<h3>Distinct Capabilities</h3><ul>${validUnique.map(u => `<li>${formatItem(u)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'howItWorks') {
    if (sec.architecture && hasContent(sec.architecture)) content += `<h3>Architecture</h3><p>${escapeHtml(sec.architecture)}</p>`;
    const validComponents = (sec.components || []).filter(hasContent);
    if (validComponents.length) {
      content += `<h3>Key Components</h3><ul>${validComponents.map(c => `<li>${formatItem(c)}</li>`).join('')}</ul>`;
    }
    if (sec.dataFlow && hasContent(sec.dataFlow)) content += `<h3>Data Flow</h3><p>${escapeHtml(sec.dataFlow)}</p>`;
  } else if (key === 'prerequisites') {
    if (sec.runtime && hasContent(sec.runtime)) content += `<p><strong>Runtime:</strong> ${escapeHtml(sec.runtime)}</p>`;
    const validLangs = (sec.languages || []).filter(hasContent);
    if (validLangs.length) content += `<p><strong>Required Languages:</strong> ${validLangs.map(formatItem).join(', ')}</p>`;
    const validTools = (sec.tools || []).filter(hasContent);
    if (validTools.length) content += `<h3>Required Tools</h3><ul>${validTools.map(t => `<li>${formatItem(t)}</li>`).join('')}</ul>`;
    const validSys = (sec.system || []).filter(hasContent);
    if (validSys.length) content += `<h3>System Requirements</h3><ul>${validSys.map(s => `<li>${formatItem(s)}</li>`).join('')}</ul>`;
  } else if (key === 'installation') {
    const validSteps = (sec.steps || []).filter(hasContent);
    if (validSteps.length) {
      validSteps.forEach((st, idx) => {
        content += `
          <div class="install-step-item">
            <div class="install-step-header">
              <span class="install-step-num">${st.step || (idx + 1)}</span>
              <span class="install-step-title">${escapeHtml(st.description || 'Installation Step')}</span>
            </div>
            ${st.command && hasContent(st.command) ? `
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
            ${st.verification && hasContent(st.verification) ? `<p class="text-xs text-text-secondary"><strong>Verification:</strong> ${escapeHtml(st.verification)}</p>` : ''}
          </div>
        `;
      });
    }
    const validCaveats = (sec.caveats || []).filter(hasContent);
    if (validCaveats.length) {
      content += `<div class="callout-recommendation"><div class="callout-title">Setup Caveats & Recommendations</div><ul>${validCaveats.map(c => `<li>${formatItem(c)}</li>`).join('')}</ul></div>`;
    }
  } else if (key === 'configuration') {
    const validConfigs = (sec.configFiles || []).filter(hasContent);
    if (validConfigs.length) {
      content += `<h3>Configuration Files</h3><ul>${validConfigs.map(cf => `<li><code>${escapeHtml(cf.path || cf.name || '')}</code>${cf.purpose || cf.description ? ': ' + escapeHtml(cf.purpose || cf.description) : ''}</li>`).join('')}</ul>`;
    }
    const validEnvs = (sec.environmentVariables || []).filter(hasContent);
    if (validEnvs.length) {
      content += `<h3>Environment Variables</h3><ul>${validEnvs.map(ev => `<li><code>${escapeHtml(ev.name)}</code>${ev.description ? ': ' + escapeHtml(ev.description) : ''}${ev.default ? ` <em>(default: <code>${escapeHtml(ev.default)}</code>)</em>` : ''}</li>`).join('')}</ul>`;
    }
    const validSecrets = (sec.secrets || []).filter(hasContent);
    if (validSecrets.length) {
      content += `<h3>Required Secrets & Tokens</h3><ul>${validSecrets.map(s => `<li><code>${formatItem(s)}</code></li>`).join('')}</ul>`;
    }
  } else if (key === 'usage') {
    if (sec.quickStart && hasContent(sec.quickStart)) content += `<h3>Quick Start</h3><p>${escapeHtml(sec.quickStart)}</p>`;
    const validCmds = (sec.commonCommands || []).filter(hasContent);
    if (validCmds.length) {
      content += `<h3>Common Commands</h3><ul>${validCmds.map(c => `<li>${c.description ? `<strong>${escapeHtml(c.description)}:</strong> ` : ''}${c.command ? `<code>${escapeHtml(c.command)}</code>` : ''}</li>`).join('')}</ul>`;
    }
  } else if (key === 'techStack') {
    const validLangs = (sec.languages || []).filter(hasContent);
    if (validLangs.length) content += `<p><strong>Languages:</strong> ${validLangs.map(formatItem).join(', ')}</p>`;
    const validFw = (sec.frameworks || []).filter(hasContent);
    if (validFw.length) content += `<p><strong>Frameworks:</strong> ${validFw.map(formatItem).join(', ')}</p>`;
    const validLibs = (sec.libraries || []).filter(hasContent);
    if (validLibs.length) {
      content += `<h3>Key Libraries & Dependencies</h3><ul>${validLibs.map(l => `<li><code>${escapeHtml(l.name || '')}</code>${l.purpose || l.description ? ': ' + escapeHtml(l.purpose || l.description) : ''}</li>`).join('')}</ul>`;
    }
    const validInfra = (sec.infrastructure || []).filter(hasContent);
    if (validInfra.length) content += `<p><strong>Infrastructure / Tooling:</strong> ${validInfra.map(formatItem).join(', ')}</p>`;
  } else if (key === 'limitations') {
    const validLim = (sec.knownLimitations || []).filter(hasContent);
    if (validLim.length) content += `<h3>Known Limitations</h3><ul>${validLim.map(l => `<li>${formatItem(l)}</li>`).join('')}</ul>`;
    const validComp = (sec.compatibility || []).filter(hasContent);
    if (validComp.length) content += `<h3>Compatibility Notes</h3><ul>${validComp.map(c => `<li>${formatItem(c)}</li>`).join('')}</ul>`;
    const validSec = (sec.securityCaveats || []).filter(hasContent);
    if (validSec.length) content += `<h3>Security Caveats</h3><ul>${validSec.map(s => `<li>${formatItem(s)}</li>`).join('')}</ul>`;
    if (sec.productionReadiness && hasContent(sec.productionReadiness)) {
      content += `<div class="callout-recommendation"><div class="callout-title">Production Readiness Assessment</div><p>${escapeHtml(sec.productionReadiness)}</p></div>`;
    }
  } else if (key === 'alternatives') {
    const validAlts = (sec.comparableProjects || []).filter(hasContent);
    if (validAlts.length) {
      content += `<h3>Comparable Projects</h3><ul>${validAlts.map(p => `<li>${formatItem(p)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'resources') {
    content += `<ul><li><strong>Repository:</strong> <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.url)}</a></li>`;
    if (sec.documentationUrl && hasContent(sec.documentationUrl)) {
      content += `<li><strong>Documentation:</strong> <a href="${escapeHtml(sec.documentationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sec.documentationUrl)}</a></li>`;
    }
    if (sec.issueTrackerUrl && hasContent(sec.issueTrackerUrl)) {
      content += `<li><strong>Issues:</strong> <a href="${escapeHtml(sec.issueTrackerUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sec.issueTrackerUrl)}</a></li>`;
    }
    content += `</ul>`;
    const validComm = (sec.communityLinks || []).filter(hasContent);
    if (validComm.length) {
      content += `<h3>Community Links</h3><ul>${validComm.map(c => `<li><a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.title || c.url)}</a></li>`).join('')}</ul>`;
    }
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

let isProgrammaticScroll = false;
let programmaticScrollTimer = null;

/**
 * Activates a TOC link and deactivates others, keeping TOC in sync
 */
function setActiveTocLink(sectionKey) {
  if (!sectionKey) return;
  const tocLinks = document.querySelectorAll('.toc-link');
  if (!tocLinks.length) return;

  tocLinks.forEach(link => {
    if (link.getAttribute('data-section') === sectionKey) {
      if (!link.classList.contains('active')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'true');
        // Keep active item in view if TOC rail is scrollable
        const tocRail = document.getElementById('toc-rail');
        if (tocRail && typeof link.scrollIntoView === 'function') {
          link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Handles smooth scrolling and synchronized active state on TOC clicks
 */
function initTocNavigation() {
  const tocRail = document.getElementById('toc-rail');
  if (!tocRail) return;

  // Use event delegation on tocRail to handle clicks cleanly even after dynamic hydration
  tocRail.addEventListener('click', (e) => {
    const link = e.target.closest('.toc-link');
    if (!link) return;

    e.preventDefault();
    const sectionKey = link.getAttribute('data-section');
    if (!sectionKey) return;

    const targetEl = document.getElementById(`section-${sectionKey}`);
    if (!targetEl) return;

    // 1. Immediately highlight the clicked item in TOC
    setActiveTocLink(sectionKey);

    // 2. Lock scroll spy to prevent intermediate highlights during scrolling
    isProgrammaticScroll = true;
    clearTimeout(programmaticScrollTimer);

    // 3. Scroll smoothly to target section
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 4. Update browser URL hash cleanly without instant jump
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', `#section-${sectionKey}`);
    }

    // 5. Close mobile drawer if open
    if (window.innerWidth <= 768) {
      tocRail.classList.remove('open');
      const toggleBtn = document.getElementById('btn-toggle-mobile-toc');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }

    // 6. Release scroll spy lock after scroll completes
    programmaticScrollTimer = setTimeout(() => {
      isProgrammaticScroll = false;
      setActiveTocLink(sectionKey);
    }, 700);
  });
}

/**
 * Scroll spy that keeps TOC synchronized with reading position
 */
function initScrollSpy() {
  function updateActive() {
    if (isProgrammaticScroll) return;

    const sections = Array.from(document.querySelectorAll('.analysis-section[id]'));
    if (!sections.length) return;

    // 1. If at the top of the page, first section is active
    if (window.scrollY < 80) {
      const firstKey = sections[0].id.replace('section-', '');
      setActiveTocLink(firstKey);
      return;
    }

    // 2. If at or near the bottom of the page, last section is active
    const scrollPos = window.innerHeight + window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollPos >= docHeight - 60) {
      const lastKey = sections[sections.length - 1].id.replace('section-', '');
      setActiveTocLink(lastKey);
      return;
    }

    // 3. Find section at reading threshold under sticky header
    // The sticky header offset is roughly 90px; threshold around 120px
    const threshold = 120;
    let currentKey = sections[0].id.replace('section-', '');

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const rect = sec.getBoundingClientRect();
      if (rect.top <= threshold) {
        currentKey = sec.id.replace('section-', '');
      } else {
        break;
      }
    }

    setActiveTocLink(currentKey);
  }

  // Throttled scroll listener
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Handle initial hash on load if present
  if (window.location.hash) {
    const initialKey = window.location.hash.replace('#section-', '');
    const targetEl = document.getElementById(`section-${initialKey}`);
    if (targetEl) {
      setActiveTocLink(initialKey);
      setTimeout(() => {
        isProgrammaticScroll = true;
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          isProgrammaticScroll = false;
          setActiveTocLink(initialKey);
        }, 700);
      }, 150);
      return;
    }
  }

  updateActive();
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
