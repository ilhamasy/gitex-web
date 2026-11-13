/**
 * GitEx — Persistent Theme Manager
 * Ensures instant theme application before paint and seamless toggle on all views
 */
(function () {
  const STORAGE_KEYS = ['gitex_theme', 'gitex.theme'];

  function getPreferredTheme() {
    try {
      for (const key of STORAGE_KEYS) {
        const saved = localStorage.getItem(key);
        if (saved === 'dark' || saved === 'light') return saved;
      }
    } catch (e) {}
    return 'dark'; // Default dark mode
  }

  function applyTheme(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    if (save) {
      try {
        for (const key of STORAGE_KEYS) {
          localStorage.setItem(key, theme);
        }
      } catch (e) {}
    }

    const toggle = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');

    if (toggle && icon && label) {
      if (theme === 'dark') {
        icon.textContent = '☀️';
        label.textContent = 'Light';
        toggle.setAttribute('aria-label', 'Switch to light theme');
      } else {
        icon.textContent = '🌙';
        label.textContent = 'Dark';
        toggle.setAttribute('aria-label', 'Switch to dark theme');
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('gitex-theme-change', { detail: { theme } }));
    } catch (e) {}
  }

  // 1. Immediately apply stored theme to DOM
  const preferred = getPreferredTheme();
  applyTheme(preferred, false);

  // 2. Attach click handler to theme-toggle button
  function setupThemeToggle() {
    const currentTheme = getPreferredTheme();
    applyTheme(currentTheme, false);

    const toggle = document.getElementById('theme-toggle');
    if (toggle && !toggle._hasThemeListener) {
      toggle._hasThemeListener = true;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    setupThemeToggle();
  }
})();
