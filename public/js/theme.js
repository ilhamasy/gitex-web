/**
 * GitEx — Persistent Theme Manager
 * Ensures instant theme application before paint and seamless toggle on all views
 */
(function () {
  const STORAGE_KEY = 'gitex_theme';

  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'dark'; // Default dark mode
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}

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
  }

  // 1. Immediately apply theme to avoid FOUC / flash of wrong theme
  applyTheme(getPreferredTheme());

  // 2. Attach click handler to theme-toggle button
  function setupThemeToggle() {
    applyTheme(getPreferredTheme());
    const toggle = document.getElementById('theme-toggle');
    if (toggle && !toggle._hasThemeListener) {
      toggle._hasThemeListener = true;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    setupThemeToggle();
  }
})();

