// GitEx Dashboard Shell Client (GITEX-002, 003, 011, 012)
import GitExHistory from './history.storage.js';

if (typeof window !== 'undefined' && !window.GitExHistory) {
  window.GitExHistory = GitExHistory;
}

(function () {
  'use strict';

  const DAILY_QUOTA_LIMIT = 5;

  const STORAGE_KEYS = {
    HISTORY: 'gitex_history',
    DAILY_QUOTA: 'gitex_daily_quota',
  };

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDailyQuotaUsage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY_QUOTA);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === getTodayDateString()) {
          return typeof parsed.count === 'number' ? parsed.count : 0;
        }
      }
    } catch {}
    return 0;
  }

  function incrementDailyQuotaUsage() {
    const today = getTodayDateString();
    let count = getDailyQuotaUsage();
    count += 1;
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_QUOTA, JSON.stringify({ date: today, count }));
    } catch {}
    return count;
  }

  function isDailyQuotaExceeded() {
    return getDailyQuotaUsage() >= DAILY_QUOTA_LIMIT;
  }

  // -------------------------------------------------------------
  // Provider Detection & URL Form Interaction
  // -------------------------------------------------------------
  const repoForm = document.getElementById('repo-form');
  const urlInput = document.getElementById('repo-url');
  const providerBadge = document.getElementById('provider-badge');
  const analyzeBtn = document.getElementById('btn-analyze');
  const pasteBtn = document.getElementById('btn-paste');
  const validationMsg = document.getElementById('validation-msg');

  // Progress modal elements
  const progressModal = document.getElementById('progress-modal');
  const progressRepoBadge = document.getElementById('progress-repo-badge');
  const stageCurrentMsg = document.getElementById('stage-current-message');
  const progressErrorContainer = document.getElementById('progress-error-container');
  const progressErrorText = document.getElementById('progress-error-text');
  const btnProgressDismiss = document.getElementById('btn-progress-dismiss');

  // Quota modal elements
  const quotaModal = document.getElementById('quota-modal');
  const quotaTitle = document.getElementById('quota-title');
  const quotaMessage = document.getElementById('quota-message');
  const quotaCountBadge = document.getElementById('quota-count-badge');
  const btnQuotaDismiss = document.getElementById('btn-quota-dismiss');

  function showQuotaModal() {
    if (!quotaModal) return;

    const currentLang = localStorage.getItem('gitex_lang') || 'en';
    const isId = (currentLang === 'id');

    if (quotaTitle) {
      quotaTitle.textContent = isId ? 'Batas Harian Tercapai' : 'Daily Limit Reached';
    }
    if (quotaMessage) {
      quotaMessage.textContent = isId
        ? `Anda telah mencapai batas maksimum ${DAILY_QUOTA_LIMIT} kali hit analisis repositori per hari (${DAILY_QUOTA_LIMIT}/${DAILY_QUOTA_LIMIT} kuota harian terpakai). Penjagaan ini diterapkan untuk menjaga performa server dan efisiensi kuota API. Silakan coba kembali besok!`
        : `You have reached your daily limit of ${DAILY_QUOTA_LIMIT} repository explanations for today (${DAILY_QUOTA_LIMIT}/${DAILY_QUOTA_LIMIT} daily quota used). This guard preserves server stability and API quota. Please try again tomorrow!`;
    }
    if (quotaCountBadge) {
      quotaCountBadge.textContent = isId
        ? `${DAILY_QUOTA_LIMIT} / ${DAILY_QUOTA_LIMIT} Kuota Terpakai`
        : `${DAILY_QUOTA_LIMIT} / ${DAILY_QUOTA_LIMIT} Quota Used`;
    }
    if (btnQuotaDismiss) {
      btnQuotaDismiss.textContent = isId ? 'Mengerti' : 'Understood';
    }

    quotaModal.classList.remove('hidden');
    quotaModal.style.display = 'flex';
  }

  function hideQuotaModal() {
    if (!quotaModal) return;
    quotaModal.classList.add('hidden');
    quotaModal.style.display = 'none';
  }

  if (btnQuotaDismiss) {
    btnQuotaDismiss.addEventListener('click', hideQuotaModal);
  }

  if (quotaModal) {
    quotaModal.addEventListener('click', (e) => {
      if (e.target === quotaModal) {
        hideQuotaModal();
      }
    });
  }

  const STAGES_ORDER = ['Validating', 'Fetching', 'Processing', 'Analyzing', 'Generating'];

  function updateBadge(provider) {
    if (!providerBadge) return;
    providerBadge.className = 'provider-detect-badge';
    if (provider === 'github') {
      providerBadge.textContent = 'GITHUB';
      providerBadge.classList.add('is-github');
      providerBadge.style.display = 'inline-block';
      if (urlInput) urlInput.classList.add('has-badge');
    } else if (provider === 'gitlab') {
      providerBadge.textContent = 'GITLAB';
      providerBadge.classList.add('is-gitlab');
      providerBadge.style.display = 'inline-block';
      if (urlInput) urlInput.classList.add('has-badge');
    } else if (provider === 'invalid') {
      providerBadge.textContent = 'UNSUPPORTED';
      providerBadge.style.display = 'inline-block';
      if (urlInput) urlInput.classList.add('has-badge');
    } else {
      providerBadge.textContent = '';
      providerBadge.style.display = 'none';
      if (urlInput) urlInput.classList.remove('has-badge');
    }
  }

  function detectProviderPreview(val) {
    const trimmed = (val || '').trim().toLowerCase();
    if (!trimmed) return null;
    if (trimmed.includes('github.com')) return 'github';
    if (trimmed.includes('gitlab.com')) return 'gitlab';
    return null;
  }

  function showValidationError(message) {
    if (!validationMsg || !urlInput) return;
    validationMsg.textContent = message;
    validationMsg.className = 'validation-message is-error';
    urlInput.classList.add('is-invalid');
    urlInput.setAttribute('aria-invalid', 'true');
  }

  function showValidationSuccess(message) {
    if (!validationMsg || !urlInput) return;
    validationMsg.textContent = message;
    validationMsg.className = 'validation-message is-success';
    urlInput.classList.remove('is-invalid');
    urlInput.removeAttribute('aria-invalid');
  }

  function clearValidation() {
    if (!validationMsg || !urlInput) return;
    validationMsg.textContent = '';
    validationMsg.className = 'validation-message';
    urlInput.classList.remove('is-invalid');
    urlInput.removeAttribute('aria-invalid');
  }

  function setLoadingState(isLoading) {
    if (!analyzeBtn || !urlInput) return;
    if (isLoading) {
      analyzeBtn.disabled = true;
      if (pasteBtn) pasteBtn.disabled = true;
      urlInput.disabled = true;
      analyzeBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Explaining...</span>';
    } else {
      analyzeBtn.disabled = false;
      if (pasteBtn) pasteBtn.disabled = false;
      urlInput.disabled = false;
      analyzeBtn.innerHTML = '<span>Explain repository</span>';
    }
  }

  let currentActiveStage = 'Validating';

  function updateStageUI(activeStage, message) {
    if (activeStage === 'Failed') {
      if (stageCurrentMsg) {
        stageCurrentMsg.classList.add('hidden');
        stageCurrentMsg.style.display = 'none';
        stageCurrentMsg.textContent = '';
      }

      const failIdx = STAGES_ORDER.indexOf(currentActiveStage);
      STAGES_ORDER.forEach((stage, idx) => {
        const el = document.getElementById(`stage-${stage.toLowerCase()}`);
        if (!el) return;

        el.classList.remove('pending', 'active', 'complete', 'failed');
        const icon = el.querySelector('.stage-icon-circle');

        if (idx === failIdx) {
          el.classList.add('failed');
          if (icon) icon.textContent = '✕';
        } else if (idx < failIdx) {
          el.classList.add('complete');
          if (icon) icon.textContent = '✓';
        } else {
          el.classList.add('pending');
          if (icon) icon.textContent = String(idx + 1);
        }
      });
      return;
    }

    if (stageCurrentMsg && message) {
      stageCurrentMsg.classList.remove('hidden');
      stageCurrentMsg.style.display = 'block';
      stageCurrentMsg.textContent = message;
    }

    currentActiveStage = activeStage;
    const activeIdx = STAGES_ORDER.indexOf(activeStage);

    STAGES_ORDER.forEach((stage, idx) => {
      const el = document.getElementById(`stage-${stage.toLowerCase()}`);
      if (!el) return;

      el.classList.remove('pending', 'active', 'complete', 'failed');
      const icon = el.querySelector('.stage-icon-circle');

      if (activeStage === 'Completed' || idx < activeIdx) {
        el.classList.add('complete');
        if (icon) icon.textContent = '✓';
      } else if (idx === activeIdx) {
        el.classList.add('active');
        if (icon) icon.textContent = '';
      } else {
        el.classList.add('pending');
        if (icon) icon.textContent = String(idx + 1);
      }
    });
  }

  function showProgressModal(repoUrl) {
    if (!progressModal) return;
    if (progressRepoBadge) {
      progressRepoBadge.textContent = repoUrl;
    }
    if (stageCurrentMsg) {
      stageCurrentMsg.classList.remove('hidden');
      stageCurrentMsg.style.display = 'block';
      stageCurrentMsg.textContent = 'Validating repository URL...';
    }
    if (progressErrorContainer) {
      progressErrorContainer.classList.add('hidden');
      progressErrorContainer.style.display = 'none';
    }
    if (progressErrorText) {
      progressErrorText.textContent = '';
    }
    updateStageUI('Validating', 'Validating repository URL...');
    progressModal.classList.remove('hidden');
  }

  function hideProgressModal() {
    if (!progressModal) return;
    progressModal.classList.add('hidden');
    if (progressErrorContainer) {
      progressErrorContainer.classList.add('hidden');
      progressErrorContainer.style.display = 'none';
    }
  }

  function showProgressError(errorMsg) {
    const text = (typeof errorMsg === 'string' && errorMsg.trim()) ? errorMsg.trim() : 'An error occurred during analysis. Please try again.';
    if (stageCurrentMsg) {
      stageCurrentMsg.classList.add('hidden');
      stageCurrentMsg.style.display = 'none';
      stageCurrentMsg.textContent = '';
    }
    if (progressErrorContainer && progressErrorText) {
      progressErrorText.textContent = text;
      progressErrorContainer.classList.remove('hidden');
      progressErrorContainer.style.display = 'flex';
    }
    updateStageUI('Failed', text);
  }

  if (btnProgressDismiss) {
    btnProgressDismiss.addEventListener('click', () => {
      hideProgressModal();
      setLoadingState(false);
      if (urlInput) urlInput.focus();
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      clearValidation();
      const detected = detectProviderPreview(urlInput.value);
      updateBadge(detected);
    });
  }

  if (pasteBtn && urlInput) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && typeof text === 'string') {
          urlInput.value = text.trim();
          urlInput.focus();
          urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } catch (err) {
        console.warn('[GitEx] Clipboard read denied or unsupported:', err);
        urlInput.focus();
      }
    });
  }

  /**
   * Runs the full analysis pipeline using Server-Sent Events (SSE)
   */
  async function startAnalysis(rawUrl) {
    if (isDailyQuotaExceeded()) {
      showQuotaModal();
      return;
    }

    // Increment daily quota count for this session
    incrementDailyQuotaUsage();

    // Purge any existing LocalStorage record for this URL so analysis starts 100% fresh
    if (window.GitExHistory) {
      window.GitExHistory.deleteByUrl(rawUrl);
    }

    showProgressModal(rawUrl);
    setLoadingState(true);
    clearValidation();

    const streamUrl = `/api/analyze/stream?url=${encodeURIComponent(rawUrl)}&fresh=true`;
    let eventSource = null;
    let isCompleted = false;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('stage', (event) => {
        try {
          const payload = JSON.parse(event.data);
          updateStageUI(payload.stage, payload.message);
        } catch (e) {
          console.warn('[GitEx] Stage event parse error:', e);
        }
      });

      eventSource.addEventListener('complete', (event) => {
        isCompleted = true;
        // Close eventSource immediately to prevent browser from firing 'error' on stream end
        try { eventSource.close(); } catch {}

        try {
          if (progressErrorContainer) {
            progressErrorContainer.classList.add('hidden');
            progressErrorContainer.style.display = 'none';
          }
          const payload = JSON.parse(event.data);
          const record = payload.record;
          updateStageUI('Completed', 'Analysis complete! Redirecting...');

          // Save fresh record to local history
          saveRecordToHistory(record);

          // Redirect to analysis viewer after a brief pause
          setTimeout(() => {
            window.location.href = `/analysis/${encodeURIComponent(record.id)}`;
          }, 450);
        } catch (e) {
          console.error('[GitEx] Complete event parse error:', e);
          showProgressError('Failed to process completed analysis record.');
        }
      });

      // Custom pipeline error event from server
      eventSource.addEventListener('pipeline-error', (event) => {
        let msg = 'Analysis failed.';
        try {
          if (event.data) {
            const data = JSON.parse(event.data);
            msg = data.message || msg;
          }
        } catch {}
        showProgressError(msg);
        try { eventSource.close(); } catch {}
      });

      // Native browser EventSource error (triggers on network disconnect / drop)
      let sseErrorCount = 0;
      let recoveryPolling = false;

      const attemptRecoveryPolling = async () => {
        if (recoveryPolling || isCompleted) return;
        recoveryPolling = true;

        for (let attempt = 1; attempt <= 8; attempt++) {
          if (isCompleted) break;
          await new Promise((resolve) => setTimeout(resolve, 2500));
          if (isCompleted) break;

          try {
            const checkRes = await fetch(`/api/analysis?url=${encodeURIComponent(rawUrl)}`, {
              headers: { Accept: 'application/json' },
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.success && checkData.data && checkData.data.status === 'completed') {
                isCompleted = true;
                try { eventSource.close(); } catch {}
                updateStageUI('Completed', 'Analysis complete! Redirecting...');
                saveRecordToHistory(checkData.data);
                setTimeout(() => {
                  window.location.href = `/analysis/${encodeURIComponent(checkData.data.id)}`;
                }, 400);
                return;
              }
            }
          } catch {}
        }

        if (!isCompleted) {
          showProgressError('Connection to analysis stream lost. Please check your network or try again.');
          try { eventSource.close(); } catch {}
        }
      };

      eventSource.addEventListener('error', () => {
        if (isCompleted) return;
        sseErrorCount++;

        // If the browser is still attempting native reconnect (readyState 0), allow it up to 5s before polling fallback
        if (eventSource && eventSource.readyState === 0 && sseErrorCount <= 2) {
          return;
        }

        // Trigger polling recovery to check if server completed or is completing the analysis
        attemptRecoveryPolling();
      });
    } catch (err) {
      // Fallback to standard POST endpoint
      console.warn('[GitEx] SSE not available or failed, falling back to POST /api/analyze:', err);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl, fresh: true }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Analysis failed.');
        }
        saveRecordToHistory(data.data);
        window.location.href = `/analysis/${encodeURIComponent(data.data.id)}`;
      } catch (postErr) {
        showProgressError(postErr.message);
      }
    }
  }

  if (repoForm) {
    repoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (isDailyQuotaExceeded()) {
        showQuotaModal();
        return;
      }

      const rawUrl = (urlInput ? urlInput.value : '').trim();
      if (!rawUrl) {
        showValidationError('Please enter a repository URL.');
        if (urlInput) urlInput.focus();
        return;
      }

      await startAnalysis(rawUrl);
    });
  }

  // -------------------------------------------------------------
  // Recent Analyses (LocalStorage Engine via GitExHistory)
  // -------------------------------------------------------------
  const historyContainer = document.getElementById('history-container');
  const historyCountEl = document.getElementById('history-count');
  const clearHistoryBtn = document.getElementById('btn-clear-history');

  function getHistory() {
    if (window.GitExHistory) {
      return window.GitExHistory.getAll();
    }
    try {
      const raw = localStorage.getItem('gitex_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveRecordToHistory(record) {
    if (window.GitExHistory) {
      window.GitExHistory.save(record);
    } else {
      let list = getHistory();
      list.unshift(record);
      try {
        localStorage.setItem('gitex_history', JSON.stringify(list));
      } catch {}
    }
    renderHistory();
  }

  async function deleteHistoryItem(id, url) {
    // 1. Delete from LocalStorage immediately
    if (window.GitExHistory) {
      window.GitExHistory.delete(id);
      if (url) window.GitExHistory.deleteByUrl(url);
    } else {
      let list = getHistory().filter(item => item.id !== id && (!url || item.url !== url));
      try {
        localStorage.setItem('gitex_history', JSON.stringify(list));
      } catch {}
    }
    renderHistory();

    // 2. Notify server to delete cache for this record and URL
    try {
      const query = url ? `?url=${encodeURIComponent(url)}` : '';
      await fetch(`/api/analysis/${encodeURIComponent(id)}${query}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[GitEx] Failed to delete analysis from server cache:', err);
    }
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your local analysis history?')) {
        if (window.GitExHistory) {
          window.GitExHistory.clear();
        } else {
          try {
            localStorage.removeItem('gitex_history');
          } catch {}
        }
        renderHistory();

        // Also purge all cached analyses on server
        try {
          await fetch('/api/analysis/all', { method: 'DELETE' });
        } catch (err) {
          console.warn('[GitEx] Failed to purge server cache:', err);
        }
      }
    });
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  }

  function renderHistory() {
    if (!historyContainer) return;
    const items = getHistory();

    if (historyCountEl) {
      historyCountEl.textContent = String(items.length);
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.style.display = items.length > 0 ? 'inline-block' : 'none';
    }

    if (items.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-history-card">
          <div class="empty-icon" aria-hidden="true">📋</div>
          <h3 class="empty-title">No repositories analyzed yet</h3>
          <p class="empty-desc">
            Enter a public repository URL above to generate an architecture breakdown, prerequisites, installation commands, and usage guide.
          </p>
          <div class="storage-notice">
            <span aria-hidden="true">🔒</span>
            <span>Analysis history is stored locally in this browser</span>
          </div>
        </div>
      `;
      return;
    }

    const listHtml = items.map((item) => {
      const fullName = item.fullName || (item.owner && item.name ? `${item.owner}/${item.name}` : item.name) || 'Repository';
      const provider = item.provider || 'git';
      const language = item.language || 'Unknown';
      const timeStr = formatRelativeTime(item.analyzedAt);

      return `
        <div class="history-item" data-id="${item.id}">
          <div class="history-main-info">
            <div class="history-repo-title">
              <span>${escapeHtml(fullName)}</span>
            </div>
            <div class="history-repo-meta">
              <span class="font-mono" style="text-transform: capitalize;">${escapeHtml(provider)}</span>
              <span>•</span>
              <span>${escapeHtml(language)}</span>
              ${timeStr ? `<span>•</span><span>${escapeHtml(timeStr)}</span>` : ''}
              ${item.status === 'partial' ? '<span>•</span><span class="badge badge-amber" style="padding:0 4px;font-size:10px;">Partial</span>' : ''}
            </div>
          </div>
          <div class="history-actions">
            <button type="button" class="btn-action-small btn-view-history" data-id="${item.id}" aria-label="View analysis for ${escapeHtml(fullName)}">
              View Analysis
            </button>
            <button type="button" class="btn-remove-item" data-id="${item.id}" data-url="${escapeHtml(item.url || '')}" aria-label="Remove ${escapeHtml(fullName)} from history" title="Remove from history">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    historyContainer.innerHTML = `<div class="history-list">${listHtml}</div>`;

    // Attach remove handlers
    historyContainer.querySelectorAll('.btn-remove-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const url = btn.getAttribute('data-url');
        deleteHistoryItem(id, url);
      });
    });

    // Attach view handlers
    historyContainer.querySelectorAll('.btn-view-history').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.href = `/analysis/${encodeURIComponent(id)}`;
      });
    });
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

  // Handle ?url=...&reanalyze=true from viewer or ?quota=exceeded
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('quota') === 'exceeded' || isDailyQuotaExceeded()) {
    if (urlParams.get('quota') === 'exceeded') {
      showQuotaModal();
    }
  }

  const reanalyzeUrl = urlParams.get('url');
  if (reanalyzeUrl && urlInput) {
    urlInput.value = reanalyzeUrl;
    const detected = detectProviderPreview(reanalyzeUrl);
    updateBadge(detected);
    if (urlParams.get('reanalyze') === 'true') {
      if (isDailyQuotaExceeded()) {
        showQuotaModal();
      } else {
        startAnalysis(reanalyzeUrl);
      }
    }
  }

  // Initial render of history
  renderHistory();
})();
