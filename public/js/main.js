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
  // Provider Detection Badge
  // -------------------------------------------------------------
  const urlInput = document.getElementById('repo-url');
  const providerBadge = document.getElementById('provider-badge');

  function detectProvider(val) {
    const trimmed = (val || '').trim().toLowerCase();
    if (!trimmed) return 'PUBLIC REPO';
    if (trimmed.includes('github.com')) return 'GITHUB';
    if (trimmed.includes('gitlab.com')) return 'GITLAB';
    return 'REPO URL';
  }

  if (urlInput && providerBadge) {
    urlInput.addEventListener('input', () => {
      providerBadge.textContent = detectProvider(urlInput.value);
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
