/**
 * GitEx — Analysis Viewer Client Interactions (GITEX-011, GITEX-012, GITEX-013, GITEX-014)
 */
import GitExHistory from './history.storage.js';
import { translateAnalysisToIndonesian } from './translation.helper.js';

if (typeof window !== 'undefined' && !window.GitExHistory) {
  window.GitExHistory = GitExHistory;
}

const I18N = {
  en: {
    backToDashboard: 'Dashboard',
    viewOn: (p) => `View on ${p}`,
    copyMarkdown: 'Copy Markdown',
    reanalyze: 'Re-analyze',
    deleteAnalysis: 'Delete',
    tableOfContents: 'Table of Contents',
    notDocumented: 'Not documented',
    incompleteNotice: 'This section was not documented or could not be verified from repository documentation.',
    problemSolved: 'Problem Solved',
    mainGoal: 'Main Goal',
    targetUsers: 'Target Users',
    coreCapabilities: 'Core Capabilities',
    scenarios: 'Real-World Scenarios',
    coreFeatures: 'Core Features',
    distinctCapabilities: 'Distinct Capabilities',
    architecture: 'Architecture',
    keyComponents: 'Key Components',
    dataFlow: 'Data Flow',
    runtime: 'Runtime',
    requiredLanguages: 'Required Languages',
    requiredTools: 'Required Tools',
    systemRequirements: 'System Requirements',
    setupCaveats: 'Setup Caveats & Recommendations',
    configFiles: 'Configuration Files',
    envVars: 'Environment Variables',
    secrets: 'Required Secrets & Tokens',
    quickStart: 'Quick Start',
    commonCommands: 'Common Commands',
    languages: 'Languages',
    frameworks: 'Frameworks',
    libraries: 'Key Libraries & Dependencies',
    infrastructure: 'Infrastructure / Tooling',
    limitations: 'Known Limitations',
    compatibility: 'Compatibility Notes',
    security: 'Security Caveats',
    productionReadiness: 'Production Readiness Assessment',
    comparableProjects: 'Comparable Projects',
    repository: 'Repository',
    documentation: 'Documentation',
    issues: 'Issues',
    community: 'Community Links',
    sources: 'Sources:',
    verification: 'Verification:',
    copyCode: 'Copy',
    copiedCode: 'Copied!',
    metadataTitle: 'Analysis Metadata',
    statRevision: 'Revision',
    statCompleteness: 'Completeness',
    statAnalyzed: 'Analyzed',
    statSections: 'Sections',
    langSwitched: 'Switched to English',
    loadingTranslation: 'Translating analysis to Indonesian...',
  },
  id: {
    backToDashboard: 'Dasbor',
    viewOn: (p) => `Lihat di ${p}`,
    copyMarkdown: 'Salin Markdown',
    reanalyze: 'Analisis Ulang',
    deleteAnalysis: 'Hapus',
    tableOfContents: 'Daftar Isi',
    notDocumented: 'Tidak terdokumentasi',
    incompleteNotice: 'Bagian ini tidak terdokumentasi atau tidak dapat diverifikasi dari dokumentasi repositori.',
    problemSolved: 'Masalah yang Diselesaikan',
    mainGoal: 'Tujuan Utama',
    targetUsers: 'Pengguna Sasaran',
    coreCapabilities: 'Kemampuan Inti',
    scenarios: 'Skenario Dunia Nyata',
    coreFeatures: 'Fitur Utama',
    distinctCapabilities: 'Kemampuan Khusus',
    architecture: 'Arsitektur',
    keyComponents: 'Komponen Utama',
    dataFlow: 'Aliran Data',
    runtime: 'Lingkungan Eksekusi',
    requiredLanguages: 'Bahasa yang Dibutuhkan',
    requiredTools: 'Alat yang Dibutuhkan',
    systemRequirements: 'Persyaratan Sistem',
    setupCaveats: 'Peringatan & Rekomendasi Setup',
    configFiles: 'Berkas Konfigurasi',
    envVars: 'Variabel Lingkungan',
    secrets: 'Token & Kunci Rahasia yang Dibutuhkan',
    quickStart: 'Memulai Cepat',
    commonCommands: 'Perintah Umum',
    languages: 'Bahasa',
    frameworks: 'Kerangka Kerja',
    libraries: 'Pustaka & Dependensi Utama',
    infrastructure: 'Infrastruktur / Perkakas',
    limitations: 'Batasan yang Diketahui',
    compatibility: 'Catatan Kompatibilitas',
    security: 'Peringatan Keamanan',
    productionReadiness: 'Penilaian Kesiapan Produksi',
    comparableProjects: 'Proyek Pembanding / Alternatif',
    repository: 'Repositori',
    documentation: 'Dokumentasi',
    issues: 'Pelaporan Masalah',
    community: 'Tautan Komunitas',
    sources: 'Sumber:',
    verification: 'Verifikasi:',
    copyCode: 'Salin',
    copiedCode: 'Tersalin!',
    metadataTitle: 'Metadata Analisis',
    statRevision: 'Revisi',
    statCompleteness: 'Kelengkapan',
    statAnalyzed: 'Dianalisis',
    statSections: 'Bagian',
    langSwitched: 'Bahasa beralih ke Bahasa Indonesia',
    loadingTranslation: 'Menerjemahkan analisis ke Bahasa Indonesia...',
  }
};

const SECTION_DEFS = [
  { key: 'overview', titleEn: 'Repository Overview', titleId: 'Ringkasan Repositori' },
  { key: 'purpose', titleEn: 'Purpose & Use Cases', titleId: 'Tujuan & Skenario Penggunaan' },
  { key: 'features', titleEn: 'Key Features', titleId: 'Fitur Utama' },
  { key: 'howItWorks', titleEn: 'How It Works', titleId: 'Cara Kerja' },
  { key: 'flowchart', titleEn: 'Application Flowchart', titleId: 'Diagram Alur Aplikasi' },
  { key: 'prerequisites', titleEn: 'Prerequisites', titleId: 'Prasyarat' },
  { key: 'installation', titleEn: 'Installation Guide', titleId: 'Panduan Instalasi' },
  { key: 'configuration', titleEn: 'Configuration', titleId: 'Konfigurasi' },
  { key: 'usage', titleEn: 'Usage & Examples', titleId: 'Penggunaan & Contoh' },
  { key: 'techStack', titleEn: 'Tech Stack', titleId: 'Tech Stack' },
  { key: 'limitations', titleEn: 'Limitations & Considerations', titleId: 'Batasan & Pertimbangan' },
  { key: 'alternatives', titleEn: 'Alternatives & Similar Projects', titleId: 'Alternatif Proyek' },
  { key: 'resources', titleEn: 'Official Resources', titleId: 'Sumber Daya Resmi' },
];

let currentRecord = (typeof window !== 'undefined' && window.__GITEX_RECORD__) || null;
let originalAnalysis = (typeof window !== 'undefined' && window.__ORIGINAL_RECORD__?.analysis) || currentRecord?.analysis || null;
let currentLang = (typeof window !== 'undefined' && window.__CURRENT_LANG__) || 'en';

function initInteractiveUI(record) {
  try { initLanguageSwitcher(record); } catch (e) { console.warn('[GitEx] initLanguageSwitcher error:', e); }
  try { initMobileToc(); } catch (e) { console.warn('[GitEx] initMobileToc error:', e); }
  try { initTocNavigation(); } catch (e) { console.warn('[GitEx] initTocNavigation error:', e); }
  try { initScrollSpy(); } catch (e) { console.warn('[GitEx] initScrollSpy error:', e); }
  try { initCopyButtons(); } catch (e) { console.warn('[GitEx] initCopyButtons error:', e); }
  try { initCopyMarkdownButton(); } catch (e) { console.warn('[GitEx] initCopyMarkdown error:', e); }
  try { initReanalyzeButton(record); } catch (e) { console.warn('[GitEx] initReanalyze error:', e); }
  try { initDeleteButton(record); } catch (e) { console.warn('[GitEx] initDeleteButton error:', e); }
  try { initTranslationModalEvents(); } catch (e) { console.warn('[GitEx] initTranslationModalEvents error:', e); }
}

async function initAnalysis() {
  document.body.classList.remove('mobile-toc-open');
  document.body.style.overflow = '';

  let record = window.__GITEX_RECORD__;
  const recordId = window.__RECORD_ID__ || new URLSearchParams(window.location.search).get('id');

  if (record) {
    currentRecord = record;
    if (!originalAnalysis && record.analysis) {
      originalAnalysis = record.analysis;
    }
  }

  // 1. Immediately activate UI listeners
  initInteractiveUI(currentRecord);

  // 2. Safely save to history or hydrate
  try {
    if (record && record.id && window.GitExHistory) {
      window.GitExHistory.save(record);
    } else if (!record && recordId) {
      record = await hydrateAnalysis(recordId);
      currentRecord = record;
      window.__GITEX_RECORD__ = record;
      if (record && record.analysis && !originalAnalysis) {
        originalAnalysis = record.analysis;
      }
      try {
        window.dispatchEvent(new CustomEvent('gitex:record-ready', { detail: record }));
      } catch (e) {}
      initInteractiveUI(record);
    }
  } catch (err) {
    console.warn('[GitEx] History save or hydration notice:', err);
  }

  // Check saved language preference (if saved as 'id' and currently 'en')
  try {
    const savedLang = localStorage.getItem('gitex_lang') || new URLSearchParams(window.location.search).get('lang');
    if (savedLang === 'id') {
      if (!isClientTranslationValid(currentRecord)) {
        switchLanguage('id', false);
      }
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalysis);
  } else {
    initAnalysis();
  }
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
        <span class="badge ${item.status === 'completed' ? 'badge-success' : 'badge-amber'}">${item.status === 'completed' ? 'Completed' : 'Partial'}</span>
      `;
    }

    renderDocument(item.analysis, item, currentLang);
    return item;
  } catch (err) {
    console.warn('[GitEx] Hydration error:', err);
    return null;
  }
}

/**
 * Renders document sections and table of contents
 */
function renderDocument(analysis, item, lang = 'en') {
  const docContainer = document.getElementById('analysis-document');
  if (!docContainer || !analysis) return;

  const t = I18N[lang] || I18N.en;

  const visibleKeys = SECTION_DEFS
    .filter(({ key }) => isSectionVisible(key, analysis))
    .map((sec, idx) => ({
      ...sec,
      title: lang === 'id'
        ? (window.__SECTION_TITLES_ID__?.[sec.key] || sec.titleId)
        : (window.__SECTION_TITLES_EN__?.[sec.key] || sec.titleEn),
      num: String(idx + 1).padStart(2, '0'),
    }));

  let docHtml = '';
  visibleKeys.forEach(({ key, title, num }) => {
    const sec = analysis[key] || {};
    const isNotDoc = sec.status === 'not_documented' || sec.isIncomplete;

    docHtml += `
      <section class="analysis-section" id="section-${key}" aria-labelledby="heading-${key}">
        <header class="section-header-row">
          <div class="section-title-wrap">
            <span class="section-number">${num}</span>
            <h2 id="heading-${key}" class="section-title">${escapeHtml(sec.title || title)}</h2>
          </div>
          ${isNotDoc ? `<span class="badge badge-amber">${t.notDocumented}</span>` : ''}
        </header>
        <div class="section-body">
          ${isNotDoc ? `
            <div class="section-incomplete-notice">
              <svg class="w-4 h-4 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span>${t.incompleteNotice}</span>
            </div>
          ` : ''}
          ${renderHydratedSectionContent(key, sec, item, lang)}
        </div>
      </section>
    `;
  });

  docContainer.innerHTML = docHtml;

  // Update Table of Contents rail
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

  // Update static UI text labels
  updateStaticLabels(lang, item, visibleKeys.length);

  // Re-bind code block copy buttons
  initCopyButtons();

  // Re-bind and render flowchart diagram
  if (window.GitExFlowchart) {
    try {
      window.GitExFlowchart.bindControls();
      window.GitExFlowchart.renderDiagram();
    } catch (e) {
      console.warn('[GitEx] Flowchart re-render error:', e);
    }
  }
}

/**
 * Updates static labels across the page
 */
function updateStaticLabels(lang, item, sectionCount) {
  const t = I18N[lang] || I18N.en;

  // Dashboard back link
  const backLinkText = document.querySelector('.back-link span');
  if (backLinkText) backLinkText.textContent = t.backToDashboard;

  // Provider link
  const linkRepo = document.getElementById('link-repo-provider');
  if (linkRepo) {
    const textSpan = linkRepo.querySelector('.btn-text') || linkRepo.querySelector('span');
    if (textSpan) {
      const p = item?.provider === 'gitlab' ? 'GitLab' : 'GitHub';
      textSpan.textContent = t.viewOn(p);
    }
  }

  // Copy Markdown
  const copyMdBtn = document.getElementById('btn-copy-markdown');
  if (copyMdBtn) {
    const textSpan = copyMdBtn.querySelector('.btn-text') || copyMdBtn.querySelector('span');
    if (textSpan) textSpan.textContent = t.copyMarkdown;
  }

  // Re-analyze
  const reanalyzeBtn = document.getElementById('btn-reanalyze');
  if (reanalyzeBtn) {
    const textSpan = reanalyzeBtn.querySelector('.btn-text') || reanalyzeBtn.querySelector('span');
    if (textSpan) textSpan.textContent = t.reanalyze;
  }

  // Delete
  const deleteBtn = document.getElementById('btn-delete-analysis');
  if (deleteBtn) {
    const textSpan = deleteBtn.querySelector('.btn-text') || deleteBtn.querySelector('span');
    if (textSpan) textSpan.textContent = t.deleteAnalysis;
  }

  // Mobile TOC button
  const mobileTocSpan = document.querySelector('#btn-toggle-mobile-toc .btn-toc-left span:last-child');
  if (mobileTocSpan) mobileTocSpan.textContent = t.tableOfContents;

  // Rail TOC Header
  const railTocSpan = document.querySelector('#toc-rail .toc-header span:first-child');
  if (railTocSpan) railTocSpan.textContent = t.tableOfContents;

  // Evidence rail header
  const evidenceHeader = document.querySelector('.evidence-header');
  if (evidenceHeader) evidenceHeader.textContent = t.metadataTitle;

  // Evidence rows
  const statLabels = document.querySelectorAll('.evidence-stat-label');
  if (statLabels.length >= 4) {
    statLabels[0].textContent = t.statRevision;
    statLabels[1].textContent = t.statCompleteness;
    statLabels[2].textContent = t.statAnalyzed;
    statLabels[3].textContent = t.statSections;
  }

  if (sectionCount !== undefined) {
    const statVals = document.querySelectorAll('.evidence-stat-val');
    if (statVals.length >= 4) {
      statVals[3].textContent = `${sectionCount} ${t.statSections}`;
    }
  }
}

/**
 * Helper to generate instant client-side fallback translation
 */
function generateClientFallbackIndonesian(analysis) {
  if (!analysis || typeof analysis !== 'object') return analysis;
  return translateAnalysisToIndonesian(analysis);
}

/**
 * Checks if a record has genuine translated content in Indonesian
 */
function isClientTranslationValid(record) {
  if (!record || !record.translations?.id) return false;
  const origOverview = record.analysis?.overview || originalAnalysis?.overview;
  const transOverview = record.translations.id.overview;
  const origPurpose = record.analysis?.purpose || originalAnalysis?.purpose;
  const transPurpose = record.translations.id.purpose;

  if (!transOverview) return false;
  if (origOverview?.problemSolved && transOverview?.problemSolved && origOverview.problemSolved.trim() === transOverview.problemSolved.trim()) {
    return false;
  }
  if (origPurpose?.targetUsers?.[0] && transPurpose?.targetUsers?.[0] && origPurpose.targetUsers[0].trim() === transPurpose.targetUsers[0].trim()) {
    return false;
  }
  return true;
}

let isTranslating = false;
let isTranslationDismissed = false;
let translationSnackbarTimeout = null;

function showTranslationSnackbar(title, statusText) {
  const snackbar = document.getElementById('translation-progress-snackbar');
  if (!snackbar) return;
  if (translationSnackbarTimeout) clearTimeout(translationSnackbarTimeout);

  snackbar.classList.remove('hidden', 'is-completed', 'is-failed');
  snackbar.style.display = 'block';

  const spinner = document.getElementById('trans-snackbar-spinner');
  const icon = document.getElementById('trans-snackbar-icon');
  const actionBtn = document.getElementById('btn-trans-snackbar-action');
  const titleEl = document.getElementById('trans-snackbar-title');
  const textEl = document.getElementById('trans-snackbar-status-text');

  if (spinner) spinner.classList.remove('hidden');
  if (icon) icon.classList.add('hidden');
  if (actionBtn) actionBtn.classList.add('hidden');

  if (titleEl && title) titleEl.textContent = title;
  if (textEl) textEl.textContent = statusText || 'Menerjemahkan ke Bahasa Indonesia... (Klik untuk melihat progress)';

  void snackbar.offsetWidth;
  snackbar.classList.add('show');
}

function updateTranslationSnackbarCompleted(message) {
  const snackbar = document.getElementById('translation-progress-snackbar');
  if (!snackbar) return;
  if (translationSnackbarTimeout) clearTimeout(translationSnackbarTimeout);

  snackbar.classList.remove('hidden', 'is-failed');
  snackbar.classList.add('is-completed', 'show');
  snackbar.style.display = 'block';

  const spinner = document.getElementById('trans-snackbar-spinner');
  const icon = document.getElementById('trans-snackbar-icon');
  const actionBtn = document.getElementById('btn-trans-snackbar-action');
  const textEl = document.getElementById('trans-snackbar-status-text');

  if (spinner) spinner.classList.add('hidden');
  if (icon) {
    icon.classList.remove('hidden');
    icon.textContent = '✓';
    icon.style.color = '#22c55e';
    icon.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
  }
  if (textEl) {
    textEl.textContent = message || 'Terjemahan selesai! Dokumentasi siap dibaca.';
  }
  if (actionBtn) {
    actionBtn.classList.remove('hidden');
    actionBtn.textContent = 'Tampilkan';
    actionBtn.onclick = (e) => {
      e.stopPropagation();
      hideTranslationSnackbar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  translationSnackbarTimeout = setTimeout(() => {
    hideTranslationSnackbar();
  }, 8000);
}

function updateTranslationSnackbarFailed(errorMsg) {
  const snackbar = document.getElementById('translation-progress-snackbar');
  if (!snackbar) return;
  if (translationSnackbarTimeout) clearTimeout(translationSnackbarTimeout);

  snackbar.classList.remove('hidden', 'is-completed');
  snackbar.classList.add('is-failed', 'show');
  snackbar.style.display = 'block';

  const spinner = document.getElementById('trans-snackbar-spinner');
  const icon = document.getElementById('trans-snackbar-icon');
  const textEl = document.getElementById('trans-snackbar-status-text');

  if (spinner) spinner.classList.add('hidden');
  if (icon) {
    icon.classList.remove('hidden');
    icon.textContent = '✕';
    icon.style.color = '#ef4444';
    icon.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
  }
  if (textEl) {
    textEl.textContent = `Gagal menerjemahkan (${errorMsg || 'Error'}).`;
  }

  translationSnackbarTimeout = setTimeout(() => {
    hideTranslationSnackbar();
  }, 10000);
}

function hideTranslationSnackbar() {
  const snackbar = document.getElementById('translation-progress-snackbar');
  if (!snackbar) return;
  if (translationSnackbarTimeout) clearTimeout(translationSnackbarTimeout);
  snackbar.classList.remove('show');
  setTimeout(() => {
    snackbar.classList.add('hidden');
    snackbar.style.display = 'none';
  }, 300);
}

function dismissTranslationToBackground() {
  const modal = document.getElementById('translation-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  isTranslationDismissed = true;
  const repoName = currentRecord?.fullName || (currentRecord?.owner && currentRecord?.name ? `${currentRecord.owner}/${currentRecord.name}` : currentRecord?.name) || 'Analisis Repositori';
  showTranslationSnackbar(repoName, 'Menerjemahkan ke Bahasa Indonesia... (Klik untuk melihat progress)');
}

function initTranslationModalEvents() {
  const modal = document.getElementById('translation-modal');
  const btnClose = document.getElementById('btn-translation-close');
  const btnBg = document.getElementById('btn-translation-background');
  const snackbar = document.getElementById('translation-progress-snackbar');
  const btnSnackbarClose = document.getElementById('btn-trans-snackbar-close');

  if (btnClose && !btnClose._hasDismissListener) {
    btnClose._hasDismissListener = true;
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissTranslationToBackground();
    });
  }

  if (btnBg && !btnBg._hasDismissListener) {
    btnBg._hasDismissListener = true;
    btnBg.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissTranslationToBackground();
    });
  }

  if (modal && !modal._hasBackdropListener) {
    modal._hasBackdropListener = true;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        dismissTranslationToBackground();
      }
    });
  }

  if (btnSnackbarClose && !btnSnackbarClose._hasCloseListener) {
    btnSnackbarClose._hasCloseListener = true;
    btnSnackbarClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideTranslationSnackbar();
    });
  }

  if (snackbar && !snackbar._hasClickListener) {
    snackbar._hasClickListener = true;
    snackbar.addEventListener('click', (e) => {
      if (e.target.closest('#btn-trans-snackbar-close') || e.target.closest('#btn-trans-snackbar-action')) {
        return;
      }
      if (isTranslating) {
        hideTranslationSnackbar();
        isTranslationDismissed = false;
        if (modal) {
          modal.classList.remove('hidden');
          modal.style.display = 'flex';
        }
      }
    });
  }
}

/**
 * Switches analysis language between 'en' and 'id'
 */
async function switchLanguage(targetLang, showNotification = true) {
  if (targetLang !== 'en' && targetLang !== 'id') return;

  const btnEn = document.getElementById('btn-lang-en');
  const btnId = document.getElementById('btn-lang-id');
  const navBtnEn = document.getElementById('nav-btn-lang-en');
  const navBtnId = document.getElementById('nav-btn-lang-id');

  const isEn = (targetLang === 'en');
  [btnEn, navBtnEn].forEach((btn) => {
    if (btn) {
      btn.classList.toggle('active', isEn);
      btn.setAttribute('aria-pressed', isEn ? 'true' : 'false');
    }
  });
  [btnId, navBtnId].forEach((btn) => {
    if (btn) {
      btn.classList.toggle('active', !isEn);
      btn.setAttribute('aria-pressed', !isEn ? 'true' : 'false');
    }
  });

  currentLang = targetLang;
  try {
    localStorage.setItem('gitex_lang', targetLang);
  } catch {}

  try {
    const url = new URL(window.location.href);
    if (targetLang === 'id') url.searchParams.set('lang', 'id');
    else url.searchParams.delete('lang');
    window.history.replaceState({}, '', url.toString());
  } catch {}

  const t = I18N[targetLang];

  if (targetLang === 'en') {
    const analysisToRender = originalAnalysis || currentRecord?.analysis;
    if (analysisToRender) {
      renderDocument(analysisToRender, currentRecord, 'en');
    }
    if (showNotification) showToast(t.langSwitched);
    return;
  }

  // Target is Indonesian ('id')
  // 1. Instant render if real AI translation is already cached
  if (isClientTranslationValid(currentRecord)) {
    renderDocument(currentRecord.translations.id, currentRecord, 'id');
    if (showNotification) showToast(t.langSwitched);
    return;
  }

  // 2. Show loading modal popup
  const modal = document.getElementById('translation-modal');
  isTranslating = true;
  isTranslationDismissed = false;
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }

  // 3. Asynchronously fetch full AI translation from server
  const pathParts = window.location.pathname.split('/');
  const pathId = pathParts[1] === 'analysis' ? pathParts[2] : null;
  const recordId = currentRecord?.id || window.__RECORD_ID__ || pathId || new URLSearchParams(window.location.search).get('id');

  try {
    if (!recordId) {
      throw new Error('Analysis ID not found');
    }

    const res = await fetch(`/api/analysis/${encodeURIComponent(recordId)}/translate?lang=id`);
    if (!res.ok) {
      throw new Error(`Translation request failed (${res.status})`);
    }

    const json = await res.json();
    if (json.success && json.analysis) {
      if (!currentRecord) currentRecord = { id: recordId };
      if (!currentRecord.translations) currentRecord.translations = {};
      currentRecord.translations.id = json.analysis;

      if (currentLang === 'id') {
        renderDocument(json.analysis, currentRecord, 'id');
      }

      if (isTranslationDismissed) {
        updateTranslationSnackbarCompleted('Terjemahan selesai! Bahasa Indonesia siap dibaca.');
      } else {
        if (showNotification) showToast(t.langSwitched);
      }
    } else {
      throw new Error(json.error || 'Translation failed');
    }
  } catch (err) {
    console.warn('[GitEx Translation] Fetch failed:', err);
    // On failure render client fallback
    const baseAnalysis = originalAnalysis || currentRecord?.analysis;
    if (baseAnalysis && currentLang === 'id') {
      const fallbackId = generateClientFallbackIndonesian(baseAnalysis);
      renderDocument(fallbackId, currentRecord, 'id');
    }
    if (isTranslationDismissed) {
      updateTranslationSnackbarFailed(err.message || 'Gagal menerjemahkan');
    } else {
      showToast('Gagal menerjemahkan dokumentasi.');
    }
  } finally {
    isTranslating = false;
    if (!isTranslationDismissed && modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }
}

// Expose globally so inline onclick always works immediately
if (typeof window !== 'undefined') {
  window._gitexSwitchLanguage = switchLanguage;
  window.switchLanguage = switchLanguage;
  window._gitexDismissTranslation = dismissTranslationToBackground;
  window._gitexShowTranslationSnackbar = showTranslationSnackbar;
  window._gitexHideTranslationSnackbar = hideTranslationSnackbar;
  if (window._pendingLangSwitch) {
    const pending = window._pendingLangSwitch;
    window._pendingLangSwitch = null;
    switchLanguage(pending, true);
  }
}

/**
 * Initializes language toggle buttons
 */
function initLanguageSwitcher(record) {
  const btnEn = document.getElementById('btn-lang-en');
  const btnId = document.getElementById('btn-lang-id');
  const navBtnEn = document.getElementById('nav-btn-lang-en');
  const navBtnId = document.getElementById('nav-btn-lang-id');

  const bindBtn = (btn, lang) => {
    if (btn && !btn._hasLangListener) {
      btn._hasLangListener = true;
      btn.onclick = (e) => {
        e.preventDefault();
        switchLanguage(lang, true);
      };
    }
  };

  bindBtn(btnEn, 'en');
  bindBtn(btnId, 'id');
  bindBtn(navBtnEn, 'en');
  bindBtn(navBtnId, 'id');
}

function formatItem(item) {
  if (!item) return '';
  if (typeof item === 'string') return escapeHtml(item.trim());
  if (typeof item === 'object') {
    const name = item.name || item.title || '';
    const desc = item.description || item.purpose || item.distinction || item.comparison || '';
    if (name && desc) return `<strong>${escapeHtml(name)}:</strong> ${escapeHtml(desc)}`;
    return escapeHtml(name || desc || '');
  }
  return escapeHtml(String(item));
}

function hasContent(val) {
  if (!val) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 &&
      trimmed !== 'Not documented' &&
      trimmed !== 'Not documented.' &&
      trimmed !== 'Tidak terdokumentasi' &&
      trimmed !== 'Tidak terdokumentasi.' &&
      trimmed !== 'N/A' &&
      trimmed !== '[object Object]';
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
    case 'flowchart':
      return hasContent(sec.diagram) ||
             (sec.steps && sec.steps.length > 0) ||
             Boolean(item && item.howItWorks && (hasContent(item.howItWorks.dataFlow) || (item.howItWorks.components || []).some(hasContent)));
    case 'prerequisites':
      return hasContent(sec.runtime) ||
             hasContent(sec.environment) ||
             (sec.languages || []).some(hasContent) ||
             (sec.tools || []).some(hasContent) ||
             (sec.system || []).some(hasContent);
    case 'installation':
      return (sec.steps || []).some(hasContent) ||
             (sec.caveats || []).some(hasContent);
    case 'configuration':
      return (sec.configFiles || []).some(hasContent) ||
             (sec.environmentVariables || []).some(hasContent) ||
             (sec.secrets || []).some(hasContent) ||
             hasContent(sec.setupNotes);
    case 'usage':
      return hasContent(sec.quickStart) ||
             (sec.commonCommands || []).some(hasContent) ||
             (sec.codeExamples || []).some(hasContent) ||
             (sec.examples || []).some(hasContent);
    case 'techStack':
      return (sec.languages || []).some(hasContent) ||
             (sec.frameworks || []).some(hasContent) ||
             (sec.libraries || []).some(hasContent) ||
             (sec.primaryLibraries || []).some(hasContent) ||
             (sec.infrastructure || []).some(hasContent);
    case 'limitations':
      return (sec.knownLimitations || []).some(hasContent) ||
             (sec.documentedLimitations || []).some(hasContent) ||
             (sec.compatibility || []).some(hasContent) ||
             hasContent(sec.compatibilityNotes) ||
             (sec.securityCaveats || []).some(hasContent) ||
             hasContent(sec.securityNotes) ||
             hasContent(sec.productionReadiness);
    case 'alternatives':
      return (sec.comparableProjects || []).some(hasContent) ||
             (sec.similarProjects || []).some(hasContent) ||
             hasContent(sec.distinctions);
    case 'resources':
      return hasContent(sec.documentationUrl) ||
             hasContent(sec.issueTrackerUrl) ||
             hasContent(sec.repositoryUrl) ||
             (sec.communityLinks || []).some(hasContent);
    default:
      return Object.entries(sec).some(([k, v]) => k !== 'title' && k !== 'sources' && k !== 'isIncomplete' && k !== 'status' && hasContent(v));
  }
}

/**
 * Helper to render individual section content
 */
function renderHydratedSectionContent(key, sec, item, lang = 'en') {
  const t = I18N[lang] || I18N.en;
  let content = '';

  if (key === 'overview') {
    if (sec.summary && hasContent(sec.summary)) content += `<p>${escapeHtml(sec.summary)}</p>`;
    if (sec.problemSolved && hasContent(sec.problemSolved)) {
      content += `<h3>${t.problemSolved}</h3><p>${escapeHtml(sec.problemSolved)}</p>`;
    }
    if (sec.mainGoal && hasContent(sec.mainGoal)) {
      content += `<h3>${t.mainGoal}</h3><p>${escapeHtml(sec.mainGoal)}</p>`;
    }
  } else if (key === 'purpose') {
    const validUsers = (sec.targetUsers || []).filter(hasContent);
    if (validUsers.length) {
      content += `<h3>${t.targetUsers}</h3><ul>${validUsers.map(u => `<li>${formatItem(u)}</li>`).join('')}</ul>`;
    }
    const validCaps = (sec.capabilities || []).filter(hasContent);
    if (validCaps.length) {
      content += `<h3>${t.coreCapabilities}</h3><ul>${validCaps.map(c => `<li>${formatItem(c)}</li>`).join('')}</ul>`;
    }
    const validScen = (sec.scenarios || []).filter(hasContent);
    if (validScen.length) {
      content += `<h3>${t.scenarios}</h3><ul>${validScen.map(s => `<li>${formatItem(s)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'features') {
    const validFeatures = (sec.coreFeatures || []).filter(hasContent);
    if (validFeatures.length) {
      content += `<h3>${t.coreFeatures}</h3><ul>${validFeatures.map(f => `<li>${formatItem(f)}</li>`).join('')}</ul>`;
    }
    const validUnique = (sec.uniqueCapabilities || []).filter(hasContent);
    if (validUnique.length) {
      content += `<h3>${t.distinctCapabilities}</h3><ul>${validUnique.map(u => `<li>${formatItem(u)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'howItWorks') {
    if (sec.architecture && hasContent(sec.architecture)) content += `<h3>${t.architecture}</h3><p>${escapeHtml(sec.architecture)}</p>`;
    const validComponents = (sec.components || []).filter(hasContent);
    if (validComponents.length) {
      content += `<h3>${t.keyComponents}</h3><ul>${validComponents.map(c => `<li>${formatItem(c)}</li>`).join('')}</ul>`;
    }
    if (sec.dataFlow && hasContent(sec.dataFlow)) content += `<h3>${t.dataFlow}</h3><p>${escapeHtml(sec.dataFlow)}</p>`;
  } else if (key === 'flowchart') {
    const leadText = lang === 'id' 
      ? 'Visualisasi diagram alur cara aplikasi bekerja dan perjalanan data antar komponen.' 
      : 'Interactive visual flowchart of application execution flow and component data movement.';
    
    const existingCanvas = document.getElementById('mermaid-flowchart-canvas');
    let flowDef = sec.diagram || (existingCanvas && existingCanvas.dataset.mermaid ? atob(existingCanvas.dataset.mermaid) : '');
    const b64 = flowDef ? btoa(unescape(encodeURIComponent(flowDef))) : '';

    content += `
      <div class="flowchart-header-actions mb-3" style="display:flex; justify-content: flex-end; gap:0.375rem; margin-bottom: 0.75rem;">
        <button type="button" class="btn-flowchart-action" id="btn-zoom-in-flowchart" title="Zoom In" aria-label="Zoom In">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
        <button type="button" class="btn-flowchart-action" id="btn-zoom-out-flowchart" title="Zoom Out" aria-label="Zoom Out">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
        <button type="button" class="btn-flowchart-action" id="btn-reset-flowchart" title="Reset View" aria-label="Reset View">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        </button>
        <button type="button" class="btn-flowchart-action" id="btn-copy-flowchart" title="Copy Mermaid Definition" aria-label="Copy Mermaid Definition">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="btn-copy-label">Mermaid</span>
        </button>
      </div>
      <p class="flowchart-lead-text text-sm mb-3 text-text-secondary" style="margin-bottom: 0.875rem;">${leadText}</p>
      <div class="flowchart-container" id="flowchart-container">
        <div class="flowchart-viewport" id="flowchart-viewport" tabindex="0" role="region" aria-label="Interactive Architecture Flowchart Canvas">
          <div class="mermaid" id="mermaid-flowchart-canvas" data-mermaid="${b64}">
            ${flowDef ? escapeHtml(flowDef) : ''}
          </div>
        </div>
      </div>
    `;
  } else if (key === 'prerequisites') {
    const rt = sec.runtime || sec.environment;
    if (rt && hasContent(rt)) content += `<p><strong>${t.runtime}:</strong> ${escapeHtml(rt)}</p>`;
    const validLangs = (sec.languages || sec.languageVersions || []).filter(hasContent);
    if (validLangs.length) content += `<p><strong>${t.requiredLanguages}:</strong> ${validLangs.map(formatItem).join(', ')}</p>`;
    const validTools = (sec.tools || sec.systemTools || []).filter(hasContent);
    if (validTools.length) content += `<h3>${t.requiredTools}</h3><ul>${validTools.map(t => `<li>${formatItem(t)}</li>`).join('')}</ul>`;
    const validSys = (sec.system || []).filter(hasContent);
    if (validSys.length) content += `<h3>${t.systemRequirements}</h3><ul>${validSys.map(s => `<li>${formatItem(s)}</li>`).join('')}</ul>`;
  } else if (key === 'installation') {
    const validSteps = (sec.steps || []).filter(hasContent);
    if (validSteps.length) {
      validSteps.forEach((st, idx) => {
        const stepNum = st.step || st.stepNumber || (idx + 1);
        const stepTitle = st.title || st.name || st.description || (`${lang === 'id' ? 'Langkah' : 'Step'} ${stepNum}`);
        const stepInstructions = st.instructions || (st.title && st.description ? st.description : '');

        content += `
          <div class="install-step-item">
            <div class="install-step-header">
              <span class="install-step-num">${stepNum}</span>
              <span class="install-step-title">${escapeHtml(stepTitle)}</span>
            </div>
            ${stepInstructions && hasContent(stepInstructions) ? `<p class="text-sm text-text-secondary my-1.5">${escapeHtml(stepInstructions)}</p>` : ''}
            ${st.command && hasContent(st.command) ? `
              <div class="code-block-wrapper my-4 rounded border border-border-default bg-surface-canvas overflow-hidden">
                <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 border-b border-border-default bg-surface-subtle text-xs font-mono text-text-subtle">
                  <span class="code-block-lang uppercase font-medium text-[11px]">BASH</span>
                  <button type="button" class="copy-code-btn inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-text-subtle hover:text-text-primary" data-code="${encodeURIComponent(st.command)}">
                    <span class="copy-text">${t.copyCode}</span>
                  </button>
                </div>
                <pre class="p-4 overflow-x-auto text-sm font-mono leading-relaxed"><code class="hljs">${escapeHtml(st.command)}</code></pre>
              </div>
            ` : ''}
            ${st.verification && hasContent(st.verification) ? `<p class="text-xs text-text-secondary"><strong>${t.verification}</strong> ${escapeHtml(st.verification)}</p>` : ''}
          </div>
        `;
      });
    }
    const validCaveats = (sec.caveats || []).filter(hasContent);
    if (validCaveats.length) {
      content += `<div class="callout-recommendation"><div class="callout-title">${t.setupCaveats}</div><ul>${validCaveats.map(c => `<li>${formatItem(c)}</li>`).join('')}</ul></div>`;
    }
  } else if (key === 'configuration') {
    const validConfigs = (sec.configFiles || []).filter(hasContent);
    if (validConfigs.length) {
      content += `<h3>${t.configFiles}</h3><ul>${validConfigs.map(cf => `<li><code>${escapeHtml(cf.path || cf.name || '')}</code>${cf.purpose || cf.description ? ': ' + escapeHtml(cf.purpose || cf.description) : ''}</li>`).join('')}</ul>`;
    }
    const validEnvs = (sec.environmentVariables || []).filter(hasContent);
    if (validEnvs.length) {
      content += `<h3>${t.envVars}</h3><ul>${validEnvs.map(ev => `<li><code>${escapeHtml(ev.name)}</code>${ev.description ? ': ' + escapeHtml(ev.description) : ''}${ev.default ? ` <em>(default: <code>${escapeHtml(ev.default)}</code>)</em>` : ''}</li>`).join('')}</ul>`;
    }
    const validSecrets = (sec.secrets || []).filter(hasContent);
    if (validSecrets.length) {
      content += `<h3>${t.secrets}</h3><ul>${validSecrets.map(s => `<li><code>${formatItem(s)}</code></li>`).join('')}</ul>`;
    }
    if (sec.setupNotes && hasContent(sec.setupNotes)) {
      content += `<p>${escapeHtml(sec.setupNotes)}</p>`;
    }
  } else if (key === 'usage') {
    if (sec.quickStart && hasContent(sec.quickStart)) content += `<h3>${t.quickStart}</h3><p>${escapeHtml(sec.quickStart)}</p>`;
    const validCmds = (sec.commonCommands || []).filter(hasContent);
    if (validCmds.length) {
      content += `<h3>${t.commonCommands}</h3><ul>${validCmds.map(c => `<li>${c.description ? `<strong>${escapeHtml(c.description)}:</strong> ` : ''}${c.command ? `<code>${escapeHtml(c.command)}</code>` : ''}</li>`).join('')}</ul>`;
    }
    const validExamples = (sec.examples || sec.codeExamples || []).filter(hasContent);
    if (validExamples.length) {
      content += `<ul>${validExamples.map(ex => `<li>${formatItem(ex)}</li>`).join('')}</ul>`;
    }
  } else if (key === 'techStack') {
    const validLangs = (sec.languages || []).filter(hasContent);
    if (validLangs.length) content += `<p><strong>${t.languages}:</strong> ${validLangs.map(formatItem).join(', ')}</p>`;
    const validFw = (sec.frameworks || []).filter(hasContent);
    if (validFw.length) content += `<p><strong>${t.frameworks}:</strong> ${validFw.map(formatItem).join(', ')}</p>`;
    const validLibs = (sec.libraries || sec.primaryLibraries || []).filter(hasContent);
    if (validLibs.length) {
      content += `<h3>${t.libraries}</h3><ul>${validLibs.map(l => `<li><code>${escapeHtml(l.name || '')}</code>${l.purpose || l.description ? ': ' + escapeHtml(l.purpose || l.description) : ''}</li>`).join('')}</ul>`;
    }
    const validInfra = (sec.infrastructure || []).filter(hasContent);
    if (validInfra.length) content += `<p><strong>${t.infrastructure}:</strong> ${validInfra.map(formatItem).join(', ')}</p>`;
  } else if (key === 'limitations') {
    const validLim = (sec.knownLimitations || sec.documentedLimitations || []).filter(hasContent);
    if (validLim.length) content += `<h3>${t.limitations}</h3><ul>${validLim.map(l => `<li>${formatItem(l)}</li>`).join('')}</ul>`;
    const compNotes = sec.compatibilityNotes || sec.compatibility;
    if (compNotes && hasContent(compNotes)) {
      content += `<h3>${t.compatibility}</h3><p>${escapeHtml(compNotes)}</p>`;
    }
    const secNotes = sec.securityNotes || sec.securityCaveats;
    if (secNotes && hasContent(secNotes)) {
      content += `<h3>${t.security}</h3><p>${escapeHtml(secNotes)}</p>`;
    }
    if (sec.productionReadiness && hasContent(sec.productionReadiness)) {
      content += `<div class="callout-recommendation"><div class="callout-title">${t.productionReadiness}</div><p>${escapeHtml(sec.productionReadiness)}</p></div>`;
    }
  } else if (key === 'alternatives') {
    const validAlts = (sec.comparableProjects || sec.similarProjects || []).filter(hasContent);
    if (validAlts.length) {
      content += `<h3>${t.comparableProjects}</h3><ul>${validAlts.map(p => `<li>${formatItem(p)}</li>`).join('')}</ul>`;
    }
    if (sec.distinctions && hasContent(sec.distinctions)) {
      content += `<p>${escapeHtml(sec.distinctions)}</p>`;
    }
  } else if (key === 'resources') {
    const repoUrl = item?.url || sec.repositoryUrl;
    content += `<ul>`;
    if (repoUrl) {
      content += `<li><strong>${t.repository}:</strong> <a href="${escapeHtml(repoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repoUrl)}</a></li>`;
    }
    if (sec.documentationUrl && hasContent(sec.documentationUrl)) {
      content += `<li><strong>${t.documentation}:</strong> <a href="${escapeHtml(sec.documentationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sec.documentationUrl)}</a></li>`;
    }
    const issues = sec.issueTrackerUrl || sec.issuesUrl;
    if (issues && hasContent(issues)) {
      content += `<li><strong>${t.issues}:</strong> <a href="${escapeHtml(issues)}" target="_blank" rel="noopener noreferrer">${escapeHtml(issues)}</a></li>`;
    }
    content += `</ul>`;
    const validComm = (sec.communityLinks || []).filter(hasContent);
    if (validComm.length) {
      content += `<h3>${t.community}</h3><ul>${validComm.map(c => `<li><a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.title || c.url)}</a></li>`).join('')}</ul>`;
    }
  }

  // Render sources if available
  if (sec.sources?.length) {
    content += `
      <div class="section-sources-row">
        <span class="sources-label">${t.sources}</span>
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
    btn.onclick = async (e) => {
      e.preventDefault();
      const encodedCode = btn.getAttribute('data-code');
      const textToCopy = decodeURIComponent(encodedCode || '');

      if (!textToCopy) return;

      const copyTextSpan = btn.querySelector('.copy-text');
      const t = I18N[currentLang] || I18N.en;
      const originalText = copyTextSpan ? copyTextSpan.textContent : t.copyCode;

      try {
        await navigator.clipboard.writeText(textToCopy);
        if (copyTextSpan) copyTextSpan.textContent = t.copiedCode;
        btn.classList.add('text-primary-citrus');
        showToast(currentLang === 'id' ? 'Kode disalin ke papan klip' : 'Code copied to clipboard');

        setTimeout(() => {
          if (copyTextSpan) copyTextSpan.textContent = originalText;
          btn.classList.remove('text-primary-citrus');
        }, 2000);
      } catch (err) {
        console.error('[GitEx] Failed to copy code:', err);
        showToast(currentLang === 'id' ? 'Gagal menyalin kode' : 'Failed to copy to clipboard');
      }
    };
  });
}

/**
 * Initializes copy full markdown button
 */
function initCopyMarkdownButton() {
  const btn = document.getElementById('btn-copy-markdown');
  if (!btn) return;

  btn.onclick = async () => {
    const record = currentRecord;
    const activeAnalysis = (currentLang === 'id' && record?.translations?.id) ? record.translations.id : (originalAnalysis || record?.analysis);

    if (!record || !activeAnalysis) {
      showToast(currentLang === 'id' ? 'Analisis tidak tersedia untuk disalin' : 'No analysis available to copy');
      return;
    }

    let md = `# ${record.fullName}\n\n`;
    md += `> Source: ${record.url} | Revision: ${record.revision || 'latest'} | Analyzed with GitEx\n\n`;

    const titles = currentLang === 'id' ? {
      overview: '01. Ringkasan Repositori',
      purpose: '02. Tujuan & Skenario Penggunaan',
      features: '03. Fitur Utama',
      howItWorks: '04. Cara Kerja',
      prerequisites: '05. Prasyarat',
      installation: '06. Panduan Instalasi',
      configuration: '07. Konfigurasi',
      usage: '08. Penggunaan & Contoh',
      techStack: '09. Tech Stack',
      limitations: '10. Batasan & Pertimbangan',
      alternatives: '11. Alternatif Proyek',
      resources: '12. Sumber Daya Resmi',
    } : {
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

    for (const [key, title] of Object.entries(titles)) {
      const sec = activeAnalysis[key];
      md += `## ${title}\n\n`;
      if (!sec) {
        md += `*${currentLang === 'id' ? 'Tidak terdokumentasi.' : 'Not documented.'}*\n\n`;
        continue;
      }

      if (key === 'overview') {
        md += `${sec.summary || ''}\n\n`;
        if (sec.problemSolved) md += `**${currentLang === 'id' ? 'Masalah yang Diselesaikan:' : 'Problem Solved:'}**\n${sec.problemSolved}\n\n`;
        if (sec.mainGoal) md += `**${currentLang === 'id' ? 'Tujuan Utama:' : 'Main Goal:'}**\n${sec.mainGoal}\n\n`;
      } else if (key === 'installation' && sec.steps) {
        sec.steps.forEach((st, idx) => {
          md += `${idx + 1}. **${st.title || st.description || (currentLang === 'id' ? 'Langkah' : 'Step')}**\n`;
          if (st.command) md += `   \`\`\`bash\n   ${st.command}\n   \`\`\`\n`;
        });
        md += '\n';
      } else {
        md += `${JSON.stringify(sec, null, 2)}\n\n`;
      }
    }

    try {
      await navigator.clipboard.writeText(md);
      showToast(currentLang === 'id' ? 'Markdown lengkap disalin ke papan klip' : 'Full Markdown copied to clipboard');
    } catch {
      showToast(currentLang === 'id' ? 'Gagal menyalin markdown' : 'Failed to copy markdown');
    }
  };
}

/**
 * Initializes re-analyze button
 */
function initReanalyzeButton(record) {
  const btn = document.getElementById('btn-reanalyze');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const url = record?.url || currentRecord?.url;

    // Check daily quota before navigating
    try {
      const quotaRaw = localStorage.getItem('gitex_daily_quota');
      if (quotaRaw) {
        const parsed = JSON.parse(quotaRaw);
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (parsed && parsed.date === today && parsed.count >= 5) {
          window.location.href = '/app?quota=exceeded';
          return;
        }
      }
    } catch {}

    if (url) {
      window.location.href = `/app?url=${encodeURIComponent(url)}&reanalyze=true`;
    } else {
      window.location.href = '/app';
    }
  });
}

/**
 * Initializes delete analysis button
 */
function initDeleteButton(record) {
  const btn = document.getElementById('btn-delete-analysis');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const isId = currentLang === 'id';
    const confirmMsg = isId
      ? 'Hapus analisis ini dari riwayat dan mulai dari awal?'
      : 'Delete this analysis from history and start fresh?';

    if (!confirm(confirmMsg)) return;

    const id = record?.id || currentRecord?.id || window.__RECORD_ID__;
    const url = record?.url || currentRecord?.url;

    // 1. Delete from LocalStorage
    if (window.GitExHistory) {
      if (id) window.GitExHistory.delete(id);
      if (url) window.GitExHistory.deleteByUrl(url);
    }
    try {
      const raw = localStorage.getItem('gitex_history');
      if (raw) {
        const list = JSON.parse(raw).filter(item => item.id !== id && (!url || item.url !== url));
        localStorage.setItem('gitex_history', JSON.stringify(list));
      }
    } catch {}

    // 2. Delete from server cache
    if (id) {
      try {
        const query = url ? `?url=${encodeURIComponent(url)}` : '';
        await fetch(`/api/analysis/${encodeURIComponent(id)}${query}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('[GitEx] Failed to delete analysis from server cache:', err);
      }
    }

    // 3. Redirect back to dashboard
    window.location.href = '/app';
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
        const tocRail = document.getElementById('toc-rail');
        if (tocRail && tocRail.scrollHeight > tocRail.clientHeight && !tocRail.classList.contains('open')) {
          const railRect = tocRail.getBoundingClientRect();
          const linkRect = link.getBoundingClientRect();
          if (linkRect.bottom > railRect.bottom) {
            tocRail.scrollTop += (linkRect.bottom - railRect.bottom + 12);
          } else if (linkRect.top < railRect.top) {
            tocRail.scrollTop -= (railRect.top - linkRect.top + 12);
          }
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

  tocRail.addEventListener('click', (e) => {
    const link = e.target.closest('.toc-link');
    if (!link) return;

    e.preventDefault();
    const sectionKey = link.getAttribute('data-section');
    if (!sectionKey) return;

    const targetEl = document.getElementById(`section-${sectionKey}`);
    if (!targetEl) return;

    setActiveTocLink(sectionKey);

    isProgrammaticScroll = true;
    clearTimeout(programmaticScrollTimer);

    if (typeof window.toggleGitExMobileToc === 'function') {
      window.toggleGitExMobileToc(false);
    } else {
      tocRail.classList.remove('open');
      const toggleBtn = document.getElementById('btn-toggle-mobile-toc');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-toc-open');
      document.body.style.overflow = '';
    }

    const headerEl = document.querySelector('.analysis-header-bar');
    const headerOffset = (headerEl ? headerEl.offsetHeight : 240) + 20;
    const elementPosition = targetEl.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    });

    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', `#section-${sectionKey}`);
    }

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

    if (window.scrollY < 80) {
      const firstKey = sections[0].id.replace('section-', '');
      setActiveTocLink(firstKey);
      return;
    }

    const scrollPos = window.innerHeight + window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollPos >= docHeight - 60) {
      const lastKey = sections[sections.length - 1].id.replace('section-', '');
      setActiveTocLink(lastKey);
      return;
    }

    const headerEl = document.querySelector('.analysis-header-bar');
    const threshold = (headerEl ? headerEl.offsetHeight : 240) + 40;
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
 * Mobile Table of Contents drawer toggle (keyboard shortcuts & fallback)
 */
function initMobileToc() {
  const tocRail = document.getElementById('toc-rail');
  if (!tocRail) return;

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocRail.classList.contains('open')) {
      if (typeof window.toggleGitExMobileToc === 'function') {
        window.toggleGitExMobileToc(false);
      } else {
        tocRail.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
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
