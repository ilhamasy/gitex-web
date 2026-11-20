/**
 * GitEx — Graph Explorer Controller
 * Manages top-level tabs, dynamic view switching, search, filters, and drawer state.
 */

(function () {
  'use strict';

  let graphEngine = null;
  let parsedData = null;
  let currentViewId = 'overview';
  let activeFilterType = 'ALL';
  let tabsBound = false;

  function initGraphExplorer() {
    const workspace = document.getElementById('graph-explorer-workspace');
    const canvasContainer = document.getElementById('graph-canvas-viewport');
    if (!workspace || !canvasContainer) return;

    if (!tabsBound) {
      bindTopNavTabs();
      tabsBound = true;
    }

    const record = window.__GITEX_RECORD__;
    if (!record || !record.analysis) {
      window.addEventListener('gitex:record-ready', (e) => {
        if (e.detail && !parsedData) {
          initGraphExplorer();
        }
      }, { once: true });
      return;
    }

    if (!window.GitExGraphParser || !window.GitExGraphEngine) {
      console.warn('[GitEx Graph] Missing dependencies');
      return;
    }

    parsedData = window.GitExGraphParser.parseAnalysis(record);
    if (!parsedData) return;

    // Initialize Engine
    if (!graphEngine) {
      graphEngine = new window.GitExGraphEngine(canvasContainer, {
        onNodeSelect: handleNodeSelected,
        onEdgeSelect: handleEdgeSelected,
        onCanvasClick: () => closeDrawer(),
      });
    }

    renderViewPills();
    renderFilterChips();
    bindSearch();
    bindHudButtons();
    bindDrawerClose();

    // Load initial view
    loadView(currentViewId);
    setTimeout(() => {
      if (graphEngine) {
        graphEngine.resize();
        graphEngine.fitToScreen();
      }
    }, 60);

    // Support opening views modal via URL query param
    if (new URLSearchParams(window.location.search).get('viewsModal') === 'open') {
      openViewsModal();
    }
  }

  function renderViewPills() {
    const list = document.getElementById('graph-views-list');
    const modalList = document.getElementById('graph-views-modal-list');
    if (!parsedData) return;

    if (list) {
      list.innerHTML = '';
      parsedData.availableViews.forEach((view) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `graph-view-pill ${view.id === currentViewId ? 'active' : ''}`;
        btn.setAttribute('data-view', view.id);
        btn.innerHTML = `
          <span>${view.title}</span>
          <span class="graph-view-count">(${view.count})</span>
        `;
        btn.addEventListener('click', () => loadView(view.id));
        li.appendChild(btn);
        list.appendChild(li);
      });
    }

    if (modalList) {
      modalList.innerHTML = '';
      parsedData.availableViews.forEach((view) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `graph-modal-view-item ${view.id === currentViewId ? 'active' : ''}`;
        btn.setAttribute('data-view', view.id);
        btn.innerHTML = `
          <span>${view.title}</span>
          <span class="item-count">(${view.count})</span>
        `;
        btn.addEventListener('click', () => {
          loadView(view.id);
          closeViewsModal();
        });
        li.appendChild(btn);
        modalList.appendChild(li);
      });
    }

    bindMobileViewsModal();
  }

  function openViewsModal() {
    const backdrop = document.getElementById('graph-views-modal-backdrop');
    const trigger = document.getElementById('btn-mobile-views-trigger');
    if (!backdrop) return;
    try { window.scrollTo(0, window.scrollY); } catch(e) {}
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeViewsModal() {
    const backdrop = document.getElementById('graph-views-modal-backdrop');
    const trigger = document.getElementById('btn-mobile-views-trigger');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function bindMobileViewsModal() {
    const trigger = document.getElementById('btn-mobile-views-trigger');
    const closeBtn = document.getElementById('btn-close-views-modal');
    const backdrop = document.getElementById('graph-views-modal-backdrop');

    if (trigger && !trigger._bound) {
      trigger._bound = true;
      trigger.addEventListener('click', () => openViewsModal());
    }

    if (closeBtn && !closeBtn._bound) {
      closeBtn._bound = true;
      closeBtn.addEventListener('click', () => closeViewsModal());
    }

    if (backdrop && !backdrop._bound) {
      backdrop._bound = true;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeViewsModal();
        }
      });
    }

    if (!window._viewsModalEscBound) {
      window._viewsModalEscBound = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeViewsModal();
        }
      });
    }
  }

  function loadView(viewId) {
    currentViewId = viewId;

    // Update active desktop pills
    document.querySelectorAll('.graph-view-pill').forEach((p) => {
      p.classList.toggle('active', p.getAttribute('data-view') === viewId);
    });

    // Update active modal items
    document.querySelectorAll('.graph-modal-view-item').forEach((p) => {
      p.classList.toggle('active', p.getAttribute('data-view') === viewId);
    });

    // Update mobile button current view label
    if (parsedData && parsedData.availableViews) {
      const activeObj = parsedData.availableViews.find((v) => v.id === viewId);
      const currentLabel = document.getElementById('mobile-views-btn-current');
      if (currentLabel && activeObj) {
        currentLabel.textContent = activeObj.title;
      }
    }

    // Build and set graph data
    const { nodes, edges } = parsedData.buildGraphForView(viewId);
    filterAndLoadGraph(nodes, edges);
    closeDrawer();
  }

  function filterAndLoadGraph(nodes, edges) {
    let filteredNodes = nodes;
    if (activeFilterType !== 'ALL') {
      filteredNodes = nodes.filter((n) => n.type.toUpperCase() === activeFilterType);
    }
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    graphEngine.setData(filteredNodes, filteredEdges);
  }

  function renderFilterChips() {
    const container = document.getElementById('graph-filter-chips');
    if (!container) return;

    const types = ['ALL', 'COMPONENT', 'PACKAGE', 'SERVICE', 'ENDPOINT', 'DATABASE'];
    container.innerHTML = '';

    types.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `graph-filter-chip ${t === activeFilterType ? 'active' : ''}`;
      btn.setAttribute('data-filter', t);
      btn.textContent = t.charAt(0) + t.slice(1).toLowerCase();
      btn.addEventListener('click', () => {
        activeFilterType = t;
        document.querySelectorAll('.graph-filter-chip').forEach((c) => {
          c.classList.toggle('active', c.getAttribute('data-filter') === t);
        });
        const { nodes, edges } = parsedData.buildGraphForView(currentViewId);
        filterAndLoadGraph(nodes, edges);
      });
      container.appendChild(btn);
    });
  }

  function bindSearch() {
    const input = document.getElementById('graph-search-input');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query || !graphEngine) return;

      const match = graphEngine.nodes.find(
        (n) => n.name.toLowerCase().includes(query) || (n.description && n.description.toLowerCase().includes(query))
      );
      if (match) {
        graphEngine.focusNode(match.id);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim().toLowerCase();
        const match = graphEngine.nodes.find(
          (n) => n.name.toLowerCase().includes(query) || (n.description && n.description.toLowerCase().includes(query))
        );
        if (match) {
          graphEngine.focusNode(match.id);
        }
      }
    });
  }

  function bindHudButtons() {
    const btnZoomIn = document.getElementById('btn-graph-zoom-in');
    const btnZoomOut = document.getElementById('btn-graph-zoom-out');
    const btnFit = document.getElementById('btn-graph-fit');
    const btnReset = document.getElementById('btn-graph-reset');

    if (btnZoomIn) btnZoomIn.addEventListener('click', () => graphEngine && graphEngine.zoomIn());
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => graphEngine && graphEngine.zoomOut());
    if (btnFit) btnFit.addEventListener('click', () => graphEngine && graphEngine.fitToScreen());
    if (btnReset) btnReset.addEventListener('click', () => graphEngine && graphEngine.runLayout());
  }

  function handleNodeSelected(node) {
    const drawer = document.getElementById('graph-detail-drawer');
    if (!drawer || !node) {
      closeDrawer();
      return;
    }

    const typeBadge = document.getElementById('drawer-type-badge');
    const title = document.getElementById('drawer-title');
    const desc = document.getElementById('drawer-desc');
    const sourceBox = document.getElementById('drawer-source-box');
    const sourceContainer = document.getElementById('drawer-source-container');
    const incomingList = document.getElementById('drawer-incoming-list');
    const outgoingList = document.getElementById('drawer-outgoing-list');

    if (typeBadge) typeBadge.textContent = node.type || 'NODE';
    if (title) title.textContent = node.name;
    if (desc) desc.textContent = node.description || 'No detailed purpose documented.';

    if (sourceContainer && sourceBox) {
      if (node.sourceFile) {
        sourceBox.textContent = node.sourceFile;
        sourceContainer.style.display = 'block';
      } else {
        sourceContainer.style.display = 'none';
      }
    }

    // Related edges
    if (incomingList && outgoingList && graphEngine) {
      const incoming = graphEngine.edges.filter((e) => e.targetNode && e.targetNode.id === node.id);
      const outgoing = graphEngine.edges.filter((e) => e.sourceNode && e.sourceNode.id === node.id);

      incomingList.innerHTML = incoming.length
        ? incoming
            .map(
              (e) => `
          <div class="relationship-card" data-focus="${e.sourceNode.id}">
            <span class="rel-badge">${e.type}</span>
            <span class="rel-target">${e.sourceNode.name}</span>
          </div>`
            )
            .join('')
        : '<div style="font-size: 0.8125rem; color: #686d63;">No incoming links</div>';

      outgoingList.innerHTML = outgoing.length
        ? outgoing
            .map(
              (e) => `
          <div class="relationship-card" data-focus="${e.targetNode.id}">
            <span class="rel-badge">${e.type}</span>
            <span class="rel-target">${e.targetNode.name}</span>
          </div>`
            )
            .join('')
        : '<div style="font-size: 0.8125rem; color: #686d63;">No outgoing links</div>';

      // Attach click events on relationship cards to focus related node
      drawer.querySelectorAll('.relationship-card').forEach((card) => {
        card.addEventListener('click', () => {
          const targetId = card.getAttribute('data-focus');
          if (targetId && graphEngine) {
            graphEngine.focusNode(targetId);
          }
        });
      });
    }

    drawer.classList.add('open');
  }

  function handleEdgeSelected(edge) {
    const drawer = document.getElementById('graph-detail-drawer');
    if (!drawer || !edge) return;

    const typeBadge = document.getElementById('drawer-type-badge');
    const title = document.getElementById('drawer-title');
    const desc = document.getElementById('drawer-desc');
    const sourceContainer = document.getElementById('drawer-source-container');

    if (typeBadge) typeBadge.textContent = 'RELATIONSHIP';
    if (title) title.textContent = `${edge.sourceNode.name} → ${edge.targetNode.name}`;
    if (desc) desc.textContent = edge.description || `Connection type: ${edge.type}`;
    if (sourceContainer) sourceContainer.style.display = 'none';

    drawer.classList.add('open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('graph-detail-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  function bindDrawerClose() {
    const btn = document.getElementById('btn-close-drawer');
    if (btn) btn.addEventListener('click', closeDrawer);
  }

  // Top-Level Navigation Switcher (Graph Explorer vs Documentation)
  function bindTopNavTabs() {
    const tabGraph = document.getElementById('tab-nav-graph');
    const tabDocs = document.getElementById('tab-nav-docs');
    const graphWorkspace = document.getElementById('graph-explorer-workspace');
    const docsWorkspace = document.getElementById('main-content');
    const mobileToc = document.querySelector('.mobile-toc-bar');

    if (!tabGraph || !tabDocs || !graphWorkspace || !docsWorkspace) return;

    function switchTopTab(targetTab) {
      const isGraph = targetTab === 'graph';

      if (isGraph) {
        document.documentElement.classList.add('tab-graph-active');
      } else {
        document.documentElement.classList.remove('tab-graph-active');
      }

      tabGraph.classList.toggle('active', isGraph);
      tabGraph.setAttribute('aria-selected', isGraph ? 'true' : 'false');

      tabDocs.classList.toggle('active', !isGraph);
      tabDocs.setAttribute('aria-selected', !isGraph ? 'true' : 'false');

      graphWorkspace.style.display = isGraph ? 'flex' : 'none';
      docsWorkspace.style.display = !isGraph ? 'grid' : 'none';
      if (mobileToc) {
        mobileToc.style.display = isGraph ? 'none' : '';
      }

      if (isGraph && graphEngine) {
        setTimeout(() => {
          graphEngine.resize();
          graphEngine.fitToScreen();
        }, 50);
      }

      // Update URL query state
      try {
        const url = new URL(window.location.href);
        if (isGraph) {
          url.searchParams.delete('tab');
        } else {
          url.searchParams.set('tab', 'docs');
        }
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }

    tabGraph.addEventListener('click', () => switchTopTab('graph'));
    tabDocs.addEventListener('click', () => switchTopTab('docs'));

    // Check initial tab from URL param or default to graph
    const initialTab = new URLSearchParams(window.location.search).get('tab');
    if (initialTab === 'docs') {
      switchTopTab('docs');
    } else {
      switchTopTab('graph');
    }
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphExplorer);
  } else {
    initGraphExplorer();
  }
})();
