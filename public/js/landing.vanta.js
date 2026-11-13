/**
 * GitEx — Vanta.js NET Background Controller
 * Synchronized with dark/light theme tokens and responsive breakpoints
 */
(function () {
  'use strict';

  let vantaEffect = null;

  function parseColor(cssColor, fallback) {
    if (!cssColor) return fallback;
    const trimmed = cssColor.trim();
    if (trimmed.startsWith('#')) {
      const hex = trimmed.slice(1);
      if (hex.length === 3) {
        return parseInt(hex.split('').map(c => c + c).join(''), 16);
      }
      return parseInt(hex, 16);
    }
    return fallback;
  }

  function getThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const computed = window.getComputedStyle(document.documentElement);
    const canvasColor = parseColor(computed.getPropertyValue('--color-canvas'), isLight ? 0xf8fafc : 0x0e0f11);
    const accentColor = parseColor(computed.getPropertyValue('--color-accent'), isLight ? 0x84cc16 : 0xbbf451);
    return {
      backgroundColor: canvasColor,
      color: accentColor,
    };
  }

  function initVantaNet() {
    const container = document.getElementById('vanta-net-bg');
    if (!container) return;

    if (typeof window.THREE === 'undefined' || typeof window.VANTA === 'undefined' || typeof window.VANTA.NET !== 'function') {
      console.warn('[GitEx] Three.js or Vanta.NET not loaded yet, retrying...');
      return;
    }

    // Destroy existing instance if any
    if (vantaEffect && typeof vantaEffect.destroy === 'function') {
      try { vantaEffect.destroy(); } catch {}
    }

    const colors = getThemeColors();
    const isMobile = window.innerWidth < 768;

    try {
      vantaEffect = window.VANTA.NET({
        el: container,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 0.85,
        color: colors.color,
        backgroundColor: colors.backgroundColor,
        points: isMobile ? 8.0 : 12.0,
        maxDistance: isMobile ? 18.0 : 22.0,
        spacing: isMobile ? 18.0 : 15.0,
        showDots: true,
      });
    } catch (err) {
      console.warn('[GitEx] Vanta initialization notice:', err);
    }
  }

  function updateColors() {
    if (!vantaEffect) return;
    const colors = getThemeColors();
    if (typeof vantaEffect.setOptions === 'function') {
      vantaEffect.setOptions({
        color: colors.color,
        backgroundColor: colors.backgroundColor,
      });
    }
  }

  // Observe theme changes on documentElement
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        updateColors();
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true });

  // Listen to window theme toggle clicks
  window.addEventListener('gitex-theme-change', updateColors);

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVantaNet);
  } else {
    initVantaNet();
  }

  // Clean resize handler
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (vantaEffect && typeof vantaEffect.resize === 'function') {
        vantaEffect.resize();
      }
    }, 150);
  });
})();
