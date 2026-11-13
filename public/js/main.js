// GitEx Dashboard Shell Client
(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'gitex.theme',
    HISTORY: 'gitex.history',
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
      const current = document.documentElement.getAttribute('data-theme') || 'light';
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
      analyzeBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Validating...</span>';
    } else {
      analyzeBtn.disabled = false;
      urlInput.disabled = false;
      analyzeBtn.innerHTML = '<span>Analyze repository</span>';
    }
  }

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      clearValidation();
      const detected = detectProviderPreview(urlInput.value);
      updateBadge(detected);
    });
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

      setLoadingState(true);
      clearValidation();

      try {
        const response = await fetch('/api/repository/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ url: rawUrl }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          // Input value remains visible and editable!
          showValidationError(data.error || 'Failed to validate repository URL.');
          updateBadge('invalid');
          if (urlInput) urlInput.focus();
          return;
        }

        // Successfully validated by server
        const repo = data.data;
        updateBadge(repo.provider);
        showValidationSuccess(`✓ Valid ${repo.provider === 'github' ? 'GitHub' : 'GitLab'} repository: ${repo.fullName}`);
      } catch (err) {
        showValidationError('Network error while validating repository. Please try again.');
        if (urlInput) urlInput.focus();
      } finally {
        setLoadingState(false);
      }
    });
  }


  // -------------------------------------------------------------
  // Recent Analyses (LocalStorage)
  // -------------------------------------------------------------
  const historyContainer = document.getElementById('history-container');
  const historyCountEl = document.getElementById('history-count');
  const clearHistoryBtn = document.getElementById('btn-clear-history');

  function getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse history from localStorage', e);
      return [];
    }
  }

  function saveHistory(historyList) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyList));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
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
      const repo = item.repository || {};
      const fullName = repo.fullName || repo.name || 'Unknown Repository';
      const provider = repo.provider || 'git';
      const language = repo.language || 'Unknown';
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

  function deleteHistoryItem(id) {
    const items = getHistory().filter((item) => item.id !== id);
    saveHistory(items);
    renderHistory();
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your local analysis history?')) {
        saveHistory([]);
        renderHistory();
      }
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

  // Initial render
  renderHistory();
})();
