/**
 * GitEx — Flowchart Controller (Mermaid.js Integration)
 * Renders dark & citrus green architecture flowcharts with zoom, pan, and copy capabilities.
 */

(function () {
  'use strict';

  let currentScale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let rawMermaidDefinition = '';

  const THEME_CONFIG = {
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: {
      darkMode: true,
      background: '#171916',
      primaryColor: '#20231F',
      primaryBorderColor: '#3A4038',
      primaryTextColor: '#F1F2EA',
      secondaryColor: '#292D28',
      secondaryBorderColor: '#3A4038',
      secondaryTextColor: '#F1F2EA',
      tertiaryColor: '#171916',
      tertiaryBorderColor: '#3A4038',
      tertiaryTextColor: '#F1F2EA',
      lineColor: '#C7F36B',
      textColor: '#F1F2EA',
      mainBkg: '#20231F',
      nodeBorder: '#C7F36B',
      clusterBkg: '#1A1D19',
      clusterBorder: '#3A4038',
      titleColor: '#F1F2EA',
      edgeLabelBackground: '#171916',
      fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
    },
  };

  /**
   * Initializes Mermaid with custom theme
   */
  function initMermaid() {
    if (typeof window.mermaid !== 'undefined' && !window._mermaidInitialized) {
      window.mermaid.initialize(THEME_CONFIG);
      window._mermaidInitialized = true;
    }
  }

  /**
   * Applies the current pan and zoom transforms
   */
  function applyTransform() {
    const target = document.querySelector('#mermaid-flowchart-canvas svg') || document.getElementById('mermaid-flowchart-canvas');
    if (target) {
      target.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
      target.style.transformOrigin = 'center center';
      target.style.transition = isDragging ? 'none' : 'transform 0.15s ease-out';
    }
  }

  /**
   * Zooms in or out
   */
  function zoom(delta) {
    currentScale = Math.min(Math.max(0.4, currentScale + delta), 2.5);
    applyTransform();
  }

  /**
   * Resets zoom and pan
   */
  function resetView() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }

  /**
   * Copies the raw Mermaid diagram definition
   */
  async function copyDefinition(btn) {
    if (!rawMermaidDefinition) {
      const el = document.getElementById('mermaid-flowchart-canvas');
      if (el && el.dataset.mermaid) {
        try {
          rawMermaidDefinition = atob(el.dataset.mermaid);
        } catch {
          rawMermaidDefinition = el.textContent.trim();
        }
      }
    }

    if (!rawMermaidDefinition) return;

    try {
      await navigator.clipboard.writeText(rawMermaidDefinition);
      if (btn) {
        const label = btn.querySelector('.btn-copy-label');
        const oldText = label ? label.textContent : '';
        if (label) label.textContent = 'Copied!';
        btn.classList.add('btn-copied');
        setTimeout(() => {
          if (label) label.textContent = oldText;
          btn.classList.remove('btn-copied');
        }, 2000);
      }
    } catch (err) {
      console.warn('[Flowchart] Failed to copy mermaid definition:', err);
    }
  }

  function decodeBase64Utf8(str) {
    try {
      return decodeURIComponent(
        atob(str)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      return atob(str);
    }
  }

  /**
   * Renders or re-renders the Mermaid flowchart diagram
   */
  async function renderDiagram(definition) {
    initMermaid();
    const container = document.getElementById('mermaid-flowchart-canvas');
    if (!container) return;

    if (definition) {
      rawMermaidDefinition = definition;
    } else if (container.dataset.mermaid) {
      try {
        rawMermaidDefinition = decodeBase64Utf8(container.dataset.mermaid);
      } catch {
        rawMermaidDefinition = container.textContent.trim();
      }
    } else {
      rawMermaidDefinition = container.textContent.trim();
    }

    if (!rawMermaidDefinition || typeof window.mermaid === 'undefined') {
      return;
    }

    try {
      const id = 'mermaid-flowchart-svg-' + Date.now();
      const { svg } = await window.mermaid.render(id, rawMermaidDefinition);
      container.innerHTML = svg;
      container.style.visibility = 'visible';

      const svgEl = container.querySelector('svg');
      if (svgEl) {
        svgEl.setAttribute('id', 'flowchart-rendered-svg');
        svgEl.style.maxWidth = '100%';
        svgEl.style.height = 'auto';
        svgEl.style.display = 'block';
        svgEl.style.margin = '0 auto';
      }

      resetView();
    } catch (err) {
      console.warn('[Flowchart] Mermaid rendering error:', err);
      // Fallback clean view with pre code
      container.innerHTML = `<div class="flowchart-fallback-notice p-4 text-xs font-mono text-text-secondary bg-surface-muted rounded border border-border-default">Unable to render interactive diagram. Raw definition:<pre class="mt-2 text-text-primary overflow-x-auto">${escapeHtml(rawMermaidDefinition)}</pre></div>`;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Sets up viewport panning and buttons
   */
  function bindControls() {
    const viewport = document.getElementById('flowchart-viewport');
    if (viewport && !viewport._controlsBound) {
      viewport._controlsBound = true;

      viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        viewport.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          if (viewport) viewport.style.cursor = 'grab';
        }
      });

      // Wheel zoom (with Ctrl or Meta key, or normal pinch)
      viewport.addEventListener(
        'wheel',
        (e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            zoom(delta);
          }
        },
        { passive: false }
      );
    }

    // Buttons
    const btnZoomIn = document.getElementById('btn-zoom-in-flowchart');
    if (btnZoomIn && !btnZoomIn._bound) {
      btnZoomIn._bound = true;
      btnZoomIn.addEventListener('click', () => zoom(0.15));
    }

    const btnZoomOut = document.getElementById('btn-zoom-out-flowchart');
    if (btnZoomOut && !btnZoomOut._bound) {
      btnZoomOut._bound = true;
      btnZoomOut.addEventListener('click', () => zoom(-0.15));
    }

    const btnReset = document.getElementById('btn-reset-flowchart');
    if (btnReset && !btnReset._bound) {
      btnReset._bound = true;
      btnReset.addEventListener('click', resetView);
    }

    const btnCopy = document.getElementById('btn-copy-flowchart');
    if (btnCopy && !btnCopy._bound) {
      btnCopy._bound = true;
      btnCopy.addEventListener('click', function () {
        copyDefinition(this);
      });
    }
  }

  // Auto initialize on DOMContentLoaded
  function init() {
    initMermaid();
    bindControls();
    renderDiagram();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GitExFlowchart = {
    initMermaid,
    renderDiagram,
    zoom,
    resetView,
    copyDefinition,
    bindControls,
  };
})();
