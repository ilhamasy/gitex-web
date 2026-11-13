// GitEx Dashboard Shell Client (GITEX-002, 003, 011, 012)
(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'gitex.theme',
    HISTORY: 'gitex_history',
  };

  // -------------------------------------------------------------
  // Theme Management
  // -------------------------------------------------------------
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // Default is dark mode
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (themeIcon && themeLabel && themeToggle) {
      if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeLabel.textContent = 'Light';
        themeToggle.setAttribute('aria-label', 'Switch to light theme');
      } else {
        themeIcon.textContent = '🌙';
        themeLabel.textContent = 'Dark';
        themeToggle.setAttribute('aria-label', 'Switch to dark theme');
      }
    }
  }

  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // -------------------------------------------------------------
  // Provider Detection & URL Form Interaction
  // -------------------------------------------------------------
  const repoForm = document.getElementById('repo-form');
  const urlInput = document.getElementById('repo-url');
  const providerBadge = document.getElementById('provider-badge');
  const analyzeBtn = document.getElementById('btn-analyze');
  const validationMsg = document.getElementById('validation-msg');

  // Progress modal elements
  const progressModal = document.getElementById('progress-modal');
  const progressRepoBadge = document.getElementById('progress-repo-badge');
  const stageCurrentMsg = document.getElementById('stage-current-message');
  const progressErrorContainer = document.getElementById('progress-error-container');
  const progressErrorText = document.getElementById('progress-error-text');
  const btnProgressDismiss = document.getElementById('btn-progress-dismiss');

  const STAGES_ORDER = ['Validating', 'Fetching', 'Processing', 'Analyzing', 'Generating'];

  function updateBadge(provider) {
    if (!providerBadge) return;
    providerBadge.className = 'provider-detect-badge';
    if (provider === 'github') {
      providerBadge.textContent = 'GITHUB';
      providerBadge.classList.add('is-github');
    } else if (provider === 'gitlab') {
      providerBadge.textContent = 'GITLAB';
      providerBadge.classList.add('is-gitlab');
    } else if (provider === 'invalid') {
      providerBadge.textContent = 'UNSUPPORTED';
    } else {
      providerBadge.textContent = 'PUBLIC REPO';
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
      urlInput.disabled = true;
      analyzeBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Analyzing...</span>';
    } else {
      analyzeBtn.disabled = false;
      urlInput.disabled = false;
      analyzeBtn.innerHTML = '<span>Analyze repository</span>';
    }
  }

  function updateStageUI(activeStage, message) {
    if (stageCurrentMsg && message) {
      stageCurrentMsg.textContent = message;
    }

    const activeIdx = STAGES_ORDER.indexOf(activeStage);

    STAGES_ORDER.forEach((stage, idx) => {
      const el = document.getElementById(`stage-${stage.toLowerCase()}`);
      if (!el) return;

      el.classList.remove('pending', 'active', 'complete', 'failed');
      const icon = el.querySelector('.stage-icon-circle');

      if (activeStage === 'Failed') {
        if (idx === activeIdx) {
          el.classList.add('failed');
          if (icon) icon.textContent = '✕';
        } else if (idx < activeIdx) {
          el.classList.add('complete');
          if (icon) icon.textContent = '✓';
        } else {
          el.classList.add('pending');
          if (icon) icon.textContent = String(idx + 1);
        }
      } else if (activeStage === 'Completed' || idx < activeIdx) {
        el.classList.add('complete');
        if (icon) icon.textContent = '✓';
      } else if (idx === activeIdx) {
        el.classList.add('active');
        if (icon) icon.textContent = '→';
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
    if (progressErrorContainer) {
      progressErrorContainer.classList.add('hidden');
    }
    updateStageUI('Validating', 'Validating repository URL...');
    progressModal.classList.remove('hidden');
  }

  function hideProgressModal() {
    if (!progressModal) return;
    progressModal.classList.add('hidden');
  }

  function showProgressError(errorMsg) {
    const text = (typeof errorMsg === 'string' && errorMsg.trim()) ? errorMsg.trim() : 'An error occurred during analysis. Please try again.';
    if (progressErrorContainer && progressErrorText) {
      progressErrorText.textContent = text;
      progressErrorContainer.classList.remove('hidden');
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

  /**
   * Runs the full analysis pipeline using Server-Sent Events (SSE)
   */
  async function startAnalysis(rawUrl) {
    showProgressModal(rawUrl);
    setLoadingState(true);
    clearValidation();

    const streamUrl = `/api/analyze/stream?url=${encodeURIComponent(rawUrl)}`;
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
        try {
          const payload = JSON.parse(event.data);
          const record = payload.record;
          updateStageUI('Completed', 'Analysis complete! Redirecting...');

          // Save to local history
          saveRecordToHistory(record);

          // Redirect to analysis viewer after a brief pause
          setTimeout(() => {
            window.location.href = `/analysis/${encodeURIComponent(record.id)}`;
          }, 600);
        } catch (e) {
          console.error('[GitEx] Complete event parse error:', e);
          showProgressError('Failed to process completed analysis record.');
        } finally {
          eventSource.close();
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
        eventSource.close();
      });

      // Native browser EventSource error (triggers on network disconnect / drop)
      eventSource.addEventListener('error', () => {
        if (isCompleted) return; // Ignore normal connection close after completion
        showProgressError('Connection to analysis stream lost. Please check your network or try again.');
        eventSource.close();
      });
    } catch (err) {
      // Fallback to standard POST endpoint
      console.warn('[GitEx] SSE not available or failed, falling back to POST /api/analyze:', err);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl }),
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

  function deleteHistoryItem(id) {
    if (window.GitExHistory) {
      window.GitExHistory.delete(id);
    } else {
      let list = getHistory().filter(item => item.id !== id);
      try {
        localStorage.setItem('gitex_history', JSON.stringify(list));
      } catch {}
    }
    renderHistory();
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your local analysis history?')) {
        if (window.GitExHistory) {
          window.GitExHistory.clear();
        } else {
          try {
            localStorage.removeItem('gitex_history');
          } catch {}
        }
        renderHistory();
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
            <button type="button" class="btn-remove-item" data-id="${item.id}" aria-label="Remove ${escapeHtml(fullName)} from history" title="Remove from history">
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
        deleteHistoryItem(id);
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

  // Handle ?url=...&reanalyze=true from viewer
  const urlParams = new URLSearchParams(window.location.search);
  const reanalyzeUrl = urlParams.get('url');
  if (reanalyzeUrl && urlInput) {
    urlInput.value = reanalyzeUrl;
    const detected = detectProviderPreview(reanalyzeUrl);
    updateBadge(detected);
    if (urlParams.get('reanalyze') === 'true') {
      startAnalysis(reanalyzeUrl);
    }
  }

  // Initial render of history
  renderHistory();
})();
