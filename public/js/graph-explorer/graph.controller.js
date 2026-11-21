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
    activeFilterType = 'ALL';
    document.querySelectorAll('.graph-filter-chip').forEach((c) => {
      c.classList.toggle('active', c.getAttribute('data-filter') === 'ALL');
    });

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
      filteredNodes = nodes.filter((n) => {
        const t = (n.type || '').toUpperCase();
        if (activeFilterType === 'DATABASE') {
          return t === 'DATABASE' || t === 'TABLE';
        }
        return t === activeFilterType;
      });
    }
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    graphEngine.setData(filteredNodes, filteredEdges);
  }

  function renderFilterChips() {
    const container = document.getElementById('graph-filter-chips');
    if (!container) return;

    // Endpoints and Database (ERD) are dedicated primary views at the top,
    // so we keep the toolbar filter chips focused on core structural elements.
    const types = ['ALL', 'COMPONENT', 'PACKAGE', 'SERVICE'];
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

  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

    const epPanel = document.getElementById('drawer-endpoint-panel');
    const dbPanel = document.getElementById('drawer-database-panel');
    const genericPanel = document.getElementById('drawer-generic-panel');

    // Reset visibility of specialized panels
    if (epPanel) epPanel.style.display = 'none';
    if (dbPanel) dbPanel.style.display = 'none';
    if (genericPanel) genericPanel.style.display = 'block';

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

    // Specialized Endpoint View
    if (node.type === 'Endpoint') {
      if (genericPanel) genericPanel.style.display = 'none';
      if (epPanel) {
        epPanel.style.display = 'flex';

        const epMethod = document.getElementById('drawer-ep-method');
        const epPath = document.getElementById('drawer-ep-path');
        const epSummary = document.getElementById('drawer-ep-summary');
        const epHeadersList = document.getElementById('drawer-ep-headers-list');
        const epBodyBlock = document.getElementById('drawer-ep-body-block');
        const epBodyType = document.getElementById('drawer-ep-body-type');
        const epBodyFields = document.getElementById('drawer-ep-body-fields');
        const epBodyExample = document.getElementById('drawer-ep-body-example');
        const epRespBlock = document.getElementById('drawer-ep-resp-block');
        const epRespStatus = document.getElementById('drawer-ep-resp-status');
        const epRespFields = document.getElementById('drawer-ep-resp-fields');
        const epRespExample = document.getElementById('drawer-ep-resp-example');

        const m = (node.method || 'GET').toUpperCase();
        if (epMethod) {
          epMethod.textContent = m;
          epMethod.className = `method-tag method-tag-${m.toLowerCase()}`;
        }
        if (epPath) epPath.textContent = node.path || node.name;
        if (epSummary) epSummary.textContent = node.summary || node.description || 'API endpoint specification';

        // Headers
        if (epHeadersList) {
          if (Array.isArray(node.headers) && node.headers.length > 0) {
            epHeadersList.innerHTML = node.headers
              .map(
                (h) => `
              <div class="header-item">
                <span class="header-name">${escapeHtml(h.name)}:</span>
                <span class="header-val">${escapeHtml(h.value)}</span>
                ${h.required ? '<span class="header-req">REQUIRED</span>' : ''}
              </div>`
              )
              .join('');
          } else {
            epHeadersList.innerHTML = '<div style="color: #a8aea2; font-size: 0.75rem;">None required</div>';
          }
        }

        // Request Body
        if (epBodyBlock) {
          if (node.requestBody) {
            epBodyBlock.style.display = 'flex';
            if (epBodyType) epBodyType.textContent = node.requestBody.contentType || 'application/json';

            if (epBodyFields) {
              const fields = Array.isArray(node.requestBody.fields) ? node.requestBody.fields : [];
              if (fields.length > 0) {
                epBodyFields.innerHTML = `
                  <table class="fields-table">
                    <thead>
                      <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      ${fields
                        .map(
                          (f) => `
                        <tr>
                          <td><span class="field-name-text">${escapeHtml(f.name)}</span>${f.required ? '<span class="field-req-badge">*</span>' : ''}</td>
                          <td><span class="field-type-badge">${escapeHtml(f.type || 'string')}</span></td>
                          <td>${escapeHtml(f.description || '')}</td>
                        </tr>`
                        )
                        .join('')}
                    </tbody>
                  </table>
                `;
              } else {
                epBodyFields.innerHTML = '';
              }
            }

            if (epBodyExample) {
              const rawEx = node.requestBody.example;
              epBodyExample.textContent =
                typeof rawEx === 'string' ? rawEx : JSON.stringify(rawEx, null, 2);
            }
          } else {
            epBodyBlock.style.display = 'none';
          }
        }

        // Response
        if (epRespBlock) {
          if (node.response) {
            epRespBlock.style.display = 'flex';
            if (epRespStatus) epRespStatus.textContent = node.response.status || '200 OK';

            if (epRespFields) {
              const fields = Array.isArray(node.response.fields) ? node.response.fields : [];
              if (fields.length > 0) {
                epRespFields.innerHTML = `
                  <table class="fields-table">
                    <thead>
                      <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      ${fields
                        .map(
                          (f) => `
                        <tr>
                          <td><span class="field-name-text">${escapeHtml(f.name)}</span></td>
                          <td><span class="field-type-badge">${escapeHtml(f.type || 'string')}</span></td>
                          <td>${escapeHtml(f.description || '')}</td>
                        </tr>`
                        )
                        .join('')}
                    </tbody>
                  </table>
                `;
              } else {
                epRespFields.innerHTML = '';
              }
            }

            if (epRespExample) {
              const rawEx = node.response.example;
              epRespExample.textContent =
                typeof rawEx === 'string' ? rawEx : JSON.stringify(rawEx, null, 2);
            }
          } else {
            epRespBlock.style.display = 'none';
          }
        }
      }
    }

    // Specialized Database / ERD Table View
    if (node.type === 'Database' || node.type === 'Table') {
      if (genericPanel) genericPanel.style.display = 'none';
      if (dbPanel) {
        dbPanel.style.display = 'flex';

        const dbTablePill = document.getElementById('drawer-db-table-pill');
        const dbModelPill = document.getElementById('drawer-db-model-pill');
        const dbDesc = document.getElementById('drawer-db-desc');
        const dbColCount = document.getElementById('drawer-db-col-count');
        const dbColsWrapper = document.getElementById('drawer-db-columns-wrapper');
        const dbRelList = document.getElementById('drawer-db-relationships-list');

        if (dbTablePill) dbTablePill.textContent = `table: ${node.tableName || node.name}`;
        if (dbModelPill) dbModelPill.textContent = `entity: ${node.modelName || 'Model'}`;
        if (dbDesc) dbDesc.textContent = node.description || 'Database entity schema and column definitions.';

        const columns = Array.isArray(node.columns) ? node.columns : [];
        if (dbColCount) dbColCount.textContent = columns.length;

        if (dbColsWrapper) {
          if (columns.length > 0) {
            dbColsWrapper.innerHTML = `
              <table class="db-columns-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Key / Constraint</th>
                  </tr>
                </thead>
                <tbody>
                  ${columns
                    .map(
                      (col) => `
                    <tr>
                      <td class="col-name-cell">
                        ${escapeHtml(col.name)}
                        ${col.isPk ? '<span class="key-badge key-pk">PK</span>' : ''}
                        ${col.isFk ? '<span class="key-badge key-fk">FK</span>' : ''}
                      </td>
                      <td class="col-type-cell"><code>${escapeHtml(col.type || 'text')}</code></td>
                      <td class="col-constraint-cell">
                        ${col.fkTarget ? `<span class="fk-target">&rarr; ${escapeHtml(col.fkTarget)}</span>` : ''}
                        ${col.isUnique ? '<span class="constraint-tag">UNIQUE</span>' : ''}
                        ${col.isNullable ? '<span class="constraint-tag" style="color:#a8aea2;background:rgba(255,255,255,0.06);">NULL</span>' : '<span class="constraint-tag" style="color:#f1f2ea;background:rgba(255,255,255,0.1);">NOT NULL</span>'}
                        ${col.description ? `<div class="col-desc">${escapeHtml(col.description)}</div>` : ''}
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            `;
          } else {
            dbColsWrapper.innerHTML = '<div style="padding: 10px; color: #a8aea2; font-size: 0.75rem;">No column schema parsed.</div>';
          }
        }

        // ERD Relationships
        if (dbRelList) {
          const rels = Array.isArray(node.relationships) ? node.relationships : [];
          if (rels.length > 0) {
            dbRelList.innerHTML = rels
              .map((rel) => {
                const targetNode = graphEngine?.nodes.find(
                  (n) =>
                    n.name === rel.targetTable ||
                    n.tableName === rel.targetTable ||
                    n.modelName?.toLowerCase() === rel.targetTable?.toLowerCase() ||
                    n.id === `tbl-${rel.targetTable}`
                );
                const targetId = targetNode ? targetNode.id : '';

                return `
                <div class="db-rel-card" data-focus="${targetId}">
                  <div class="db-rel-top">
                    <span class="rel-badge">${escapeHtml(rel.cardinality || rel.type || '1:N')}</span>
                    <span class="rel-target-table">${escapeHtml(rel.targetTable)}</span>
                    ${rel.foreignKey ? `<span class="rel-fk-pill">via ${escapeHtml(rel.foreignKey)}</span>` : ''}
                  </div>
                  ${rel.description ? `<div class="db-rel-desc">${escapeHtml(rel.description)}</div>` : ''}
                </div>`;
              })
              .join('');

            // Bind click to focus on target table
            dbRelList.querySelectorAll('.db-rel-card[data-focus]').forEach((card) => {
              card.addEventListener('click', () => {
                const fId = card.getAttribute('data-focus');
                if (fId && graphEngine) {
                  graphEngine.focusNode(fId);
                }
              });
            });
          } else {
            dbRelList.innerHTML = '<div style="color: #686d63; font-size: 0.8125rem;">No direct foreign key relationships mapped.</div>';
          }
        }
      }
    }

    // Related edges (only shown for generic components; specialized panels manage their own relations)
    const incomingContainer = document.getElementById('drawer-incoming-container');
    const outgoingContainer = document.getElementById('drawer-outgoing-container');

    if (node.type === 'Endpoint' || node.type === 'Database' || node.type === 'Table') {
      if (incomingContainer) incomingContainer.style.display = 'none';
      if (outgoingContainer) outgoingContainer.style.display = 'none';
    } else {
      if (incomingContainer) incomingContainer.style.display = 'block';
      if (outgoingContainer) outgoingContainer.style.display = 'block';
    }

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
    const epPanel = document.getElementById('drawer-endpoint-panel');
    const dbPanel = document.getElementById('drawer-database-panel');
    const genericPanel = document.getElementById('drawer-generic-panel');

    if (epPanel) epPanel.style.display = 'none';
    if (dbPanel) dbPanel.style.display = 'none';
    if (genericPanel) genericPanel.style.display = 'block';

    if (typeBadge) typeBadge.textContent = edge.type ? `RELATIONSHIP (${edge.type})` : 'RELATIONSHIP';
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
