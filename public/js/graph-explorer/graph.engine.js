/**
 * GitEx — Interactive Graph Visualization Engine
 * High-performance Canvas renderer supporting Pan, Zoom, Drag, Fit-to-Screen,
 * Minimap, and Node/Edge selection with GitEx Dark & Citrus styling.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GitExGraphEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const THEME = {
    bg: '#0e100e',
    grid: 'rgba(199, 243, 107, 0.04)',
    nodeBg: '#20231f',
    nodeBorder: '#3a4038',
    nodeHoverBorder: '#c7f36b',
    nodeSelectedBorder: '#c7f36b',
    nodeSelectedGlow: 'rgba(199, 243, 107, 0.35)',
    textPrimary: '#f1f2ea',
    textSecondary: '#a8aea2',
    edge: '#3a4038',
    edgeHover: '#c7f36b',
    edgeSelected: '#c7f36b',
    citrus: '#c7f36b',
    badgeBg: 'rgba(199, 243, 107, 0.15)',
  };

  class GraphEngine {
    constructor(containerElement, options = {}) {
      this.container = containerElement;
      this.options = options;
      this.onNodeSelect = options.onNodeSelect || (() => {});
      this.onEdgeSelect = options.onEdgeSelect || (() => {});
      this.onCanvasClick = options.onCanvasClick || (() => {});

      this.nodes = [];
      this.edges = [];
      this.selectedNode = null;
      this.selectedEdge = null;
      this.hoveredNode = null;
      this.hoveredEdge = null;
      this.draggedNode = null;

      // Camera transform
      this.camera = {
        x: 0,
        y: 0,
        zoom: 1,
      };

      this.isPanning = false;
      this.panStart = { x: 0, y: 0 };
      this.dragStart = { x: 0, y: 0 };
      this.hasDragged = false;

      this.initDom();
      this.bindEvents();
      this.startRenderLoop();
    }

    initDom() {
      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
      this.container.style.backgroundColor = 'transparent';
      this.container.style.minHeight = '580px';
      this.container.style.flex = '1';
      this.container.style.width = '100%';

      // Main Canvas
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.inset = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.cursor = 'grab';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      // Minimap Canvas
      this.minimap = document.createElement('canvas');
      this.minimap.className = 'graph-minimap';
      this.minimap.style.position = 'absolute';
      this.minimap.style.right = '20px';
      this.minimap.style.bottom = '20px';
      this.minimap.style.width = '180px';
      this.minimap.style.height = '110px';
      this.minimap.style.borderRadius = '10px';
      this.minimap.style.border = '1px solid #3a4038';
      this.minimap.style.backgroundColor = 'rgba(23, 25, 22, 0.85)';
      this.minimap.style.backdropFilter = 'blur(10px)';
      this.minimap.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
      this.minimap.style.zIndex = '10';
      this.minimap.style.pointerEvents = 'none';
      this.container.appendChild(this.minimap);
      this.miniCtx = this.minimap.getContext('2d');

      this.resize();
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.width = Math.max(300, rect.width || this.container.clientWidth || 800);
      this.height = Math.max(520, rect.height || this.container.clientHeight || 580);

      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.minimap.width = 180 * dpr;
      this.minimap.height = 110 * dpr;
      this.miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.requestRender();
    }

    setData(nodes, edges) {
      this.nodes = nodes.map((n, idx) => ({
        ...n,
        x: n.x || (Math.cos((idx / nodes.length) * Math.PI * 2) * 280),
        y: n.y || (Math.sin((idx / nodes.length) * Math.PI * 2) * 200),
        vx: 0,
        vy: 0,
        w: 190,
        h: 70,
      }));

      // Map edges to actual node references
      const nodeMap = new Map(this.nodes.map((n) => [n.id, n]));
      this.edges = edges
        .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
        .map((e) => ({
          ...e,
          sourceNode: nodeMap.get(e.source),
          targetNode: nodeMap.get(e.target),
        }));

      this.selectedNode = null;
      this.selectedEdge = null;
      this.hoveredNode = null;

      this.runLayout();
      this.fitToScreen();
    }

    runLayout() {
      if (this.nodes.length === 0) return;

      // Force-directed simulation steps
      const root = this.nodes.find((n) => n.id === 'root-system') || this.nodes[0];
      if (root) {
        root.x = 0;
        root.y = 0;
      }

      for (let step = 0; step < 60; step++) {
        // Node repulsion
        for (let i = 0; i < this.nodes.length; i++) {
          for (let j = i + 1; j < this.nodes.length; j++) {
            const a = this.nodes[i];
            const b = this.nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = 220;

            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.15;
              if (a !== root) {
                a.x -= dx * force;
                a.y -= dy * force;
              }
              if (b !== root) {
                b.x += dx * force;
                b.y += dy * force;
              }
            }
          }
        }

        // Edge attraction
        for (const edge of this.edges) {
          const a = edge.sourceNode;
          const b = edge.targetNode;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 200;
          const force = (dist - targetDist) * 0.05;

          if (a !== root) {
            a.x += (dx / dist) * force;
            a.y += (dy / dist) * force;
          }
          if (b !== root) {
            b.x -= (dx / dist) * force;
            b.y -= (dy / dist) * force;
          }
        }
      }

      this.requestRender();
    }

    fitToScreen(padding = 80) {
      if (this.nodes.length === 0) return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of this.nodes) {
        minX = Math.min(minX, n.x - n.w / 2);
        maxX = Math.max(maxX, n.x + n.w / 2);
        minY = Math.min(minY, n.y - n.h / 2);
        maxY = Math.max(maxY, n.y + n.h / 2);
      }

      const graphW = maxX - minX;
      const graphH = maxY - minY;
      const availW = Math.max(100, this.width - padding * 2);
      const availH = Math.max(100, this.height - padding * 2);

      const zoom = Math.min(1.2, Math.max(0.35, Math.min(availW / graphW, availH / graphH)));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      this.camera.zoom = zoom;
      this.camera.x = this.width / 2 - cx * zoom;
      this.camera.y = this.height / 2 - cy * zoom;

      this.requestRender();
    }

    zoomIn() {
      this.zoomAt(this.width / 2, this.height / 2, 1.25);
    }

    zoomOut() {
      this.zoomAt(this.width / 2, this.height / 2, 0.8);
    }

    zoomAt(screenX, screenY, factor) {
      const newZoom = Math.min(2.5, Math.max(0.2, this.camera.zoom * factor));
      const worldX = (screenX - this.camera.x) / this.camera.zoom;
      const worldY = (screenY - this.camera.y) / this.camera.zoom;

      this.camera.zoom = newZoom;
      this.camera.x = screenX - worldX * newZoom;
      this.camera.y = screenY - worldY * newZoom;

      this.requestRender();
    }

    screenToWorld(sx, sy) {
      return {
        x: (sx - this.camera.x) / this.camera.zoom,
        y: (sy - this.camera.y) / this.camera.zoom,
      };
    }

    findNodeAt(wx, wy) {
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        if (
          wx >= n.x - n.w / 2 &&
          wx <= n.x + n.w / 2 &&
          wy >= n.y - n.h / 2 &&
          wy <= n.y + n.h / 2
        ) {
          return n;
        }
      }
      return null;
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        this.zoomAt(e.offsetX, e.offsetY, factor);
      }, { passive: false });

      this.canvas.addEventListener('mousedown', (e) => {
        const { x: wx, y: wy } = this.screenToWorld(e.offsetX, e.offsetY);
        const clickedNode = this.findNodeAt(wx, wy);

        this.hasDragged = false;
        if (clickedNode) {
          this.draggedNode = clickedNode;
          this.dragStart = { x: wx - clickedNode.x, y: wy - clickedNode.y };
          this.canvas.style.cursor = 'grabbing';
        } else {
          this.isPanning = true;
          this.panStart = { x: e.clientX - this.camera.x, y: e.clientY - this.camera.y };
          this.canvas.style.cursor = 'grabbing';
        }
      });

      window.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const ox = e.clientX - rect.left;
        const oy = e.clientY - rect.top;

        if (this.draggedNode) {
          this.hasDragged = true;
          const { x: wx, y: wy } = this.screenToWorld(ox, oy);
          this.draggedNode.x = wx - this.dragStart.x;
          this.draggedNode.y = wy - this.dragStart.y;
          this.requestRender();
          return;
        }

        if (this.isPanning) {
          this.hasDragged = true;
          this.camera.x = e.clientX - this.panStart.x;
          this.camera.y = e.clientY - this.panStart.y;
          this.requestRender();
          return;
        }

        if (ox >= 0 && ox <= this.width && oy >= 0 && oy <= this.height) {
          const { x: wx, y: wy } = this.screenToWorld(ox, oy);
          const hovered = this.findNodeAt(wx, wy);
          if (hovered !== this.hoveredNode) {
            this.hoveredNode = hovered;
            this.canvas.style.cursor = hovered ? 'pointer' : 'grab';
            this.requestRender();
          }
        }
      });

      window.addEventListener('mouseup', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const ox = e.clientX - rect.left;
        const oy = e.clientY - rect.top;

        if (this.draggedNode && !this.hasDragged) {
          this.selectNode(this.draggedNode);
        } else if (this.isPanning && !this.hasDragged) {
          if (ox >= 0 && ox <= this.width && oy >= 0 && oy <= this.height) {
            this.selectNode(null);
            this.onCanvasClick();
          }
        }

        this.draggedNode = null;
        this.isPanning = false;
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
      });
    }

    selectNode(node) {
      this.selectedNode = node;
      this.selectedEdge = null;
      this.onNodeSelect(node);
      this.requestRender();
    }

    focusNode(nodeId) {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      this.selectNode(node);
      this.camera.x = this.width / 2 - node.x * this.camera.zoom;
      this.camera.y = this.height / 2 - node.y * this.camera.zoom;
      this.requestRender();
    }

    requestRender() {
      this.needsRender = true;
    }

    startRenderLoop() {
      const render = () => {
        if (this.needsRender) {
          this.drawMain();
          this.drawMinimap();
          this.needsRender = false;
        }
        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
    }

    drawMain() {
      const { ctx, width, height, camera } = this;
      ctx.clearRect(0, 0, width, height);

      // Background grid
      const gridSize = 36 * camera.zoom;
      const offsetX = camera.x % gridSize;
      const offsetY = camera.y % gridSize;

      ctx.save();
      ctx.strokeStyle = THEME.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = offsetX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      ctx.restore();

      // World transform
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);

      // Draw Edges
      for (const edge of this.edges) {
        this.drawEdge(ctx, edge);
      }

      // Draw Nodes
      for (const node of this.nodes) {
        this.drawNode(ctx, node);
      }

      ctx.restore();
    }

    drawEdge(ctx, edge) {
      const a = edge.sourceNode;
      const b = edge.targetNode;
      if (!a || !b) return;

      const isConnected =
        (this.selectedNode && (this.selectedNode.id === a.id || this.selectedNode.id === b.id)) ||
        (this.hoveredNode && (this.hoveredNode.id === a.id || this.hoveredNode.id === b.id));

      const isSelected = this.selectedEdge === edge;

      ctx.save();
      ctx.strokeStyle = isSelected ? THEME.edgeSelected : isConnected ? THEME.citrus : THEME.edge;
      ctx.lineWidth = isSelected || isConnected ? 2.5 : 1.5;

      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(midX, midY - 20, b.x, b.y);
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(b.y - midY, b.x - midX);
      const arrowLength = 8;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(b.x - Math.cos(angle) * (b.w / 2), b.y - Math.sin(angle) * (b.h / 2));
      ctx.lineTo(
        b.x - Math.cos(angle) * (b.w / 2) - arrowLength * Math.cos(angle - Math.PI / 6),
        b.y - Math.sin(angle) * (b.h / 2) - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        b.x - Math.cos(angle) * (b.w / 2) - arrowLength * Math.cos(angle + Math.PI / 6),
        b.y - Math.sin(angle) * (b.h / 2) - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Relationship label tag in the middle
      if (edge.type && (isConnected || this.camera.zoom > 0.75)) {
        ctx.font = '10px ui-monospace, monospace';
        const tw = ctx.measureText(edge.type).width;
        ctx.fillStyle = 'rgba(23, 26, 22, 0.9)';
        ctx.fillRect(midX - tw / 2 - 4, midY - 18, tw + 8, 14);
        ctx.strokeStyle = isConnected ? THEME.citrus : THEME.nodeBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - tw / 2 - 4, midY - 18, tw + 8, 14);
        ctx.fillStyle = isConnected ? THEME.citrus : THEME.textSecondary;
        ctx.fillText(edge.type, midX - tw / 2, midY - 7);
      }

      ctx.restore();
    }

    drawNode(ctx, node) {
      const isSelected = this.selectedNode === node;
      const isHovered = this.hoveredNode === node;

      ctx.save();
      const x = node.x - node.w / 2;
      const y = node.y - node.h / 2;
      const r = 10;

      // Card shadow & selection glow
      if (isSelected) {
        ctx.shadowColor = THEME.nodeSelectedGlow;
        ctx.shadowBlur = 18;
      }

      // Rounded Card Background
      ctx.fillStyle = THEME.nodeBg;
      ctx.strokeStyle = isSelected
        ? THEME.nodeSelectedBorder
        : isHovered
        ? THEME.nodeHoverBorder
        : THEME.nodeBorder;
      ctx.lineWidth = isSelected ? 2 : 1.2;

      ctx.beginPath();
      ctx.roundRect(x, y, node.w, node.h, r);
      ctx.fill();
      ctx.stroke();

      // Left Accent Strip
      ctx.fillStyle = node.id === 'root-system' ? THEME.citrus : isSelected ? THEME.citrus : '#65c58b';
      ctx.beginPath();
      ctx.roundRect(x, y, 4, node.h, [r, 0, 0, r]);
      ctx.fill();

      // Type Badge
      ctx.font = '700 9px ui-monospace, monospace';
      ctx.fillStyle = THEME.citrus;
      ctx.fillText((node.type || 'COMPONENT').toUpperCase(), x + 14, y + 22);

      // Name label
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif';
      ctx.fillStyle = THEME.textPrimary;
      let displayName = node.name;
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 18) + '...';
      }
      ctx.fillText(displayName, x + 14, y + 42);

      // Sub-label (source file or category)
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillStyle = THEME.textSecondary;
      let subText = node.sourceFile || node.category || '';
      if (subText.length > 24) subText = subText.substring(0, 22) + '...';
      ctx.fillText(subText, x + 14, y + 58);

      ctx.restore();
    }

    drawMinimap() {
      const { miniCtx, minimap, nodes, camera, width, height } = this;
      const mw = 180;
      const mh = 110;
      miniCtx.clearRect(0, 0, mw, mh);

      if (nodes.length === 0) return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      }

      const padding = 120;
      minX -= padding; maxX += padding;
      minY -= padding; maxY += padding;
      const gw = maxX - minX || 1;
      const gh = maxY - minY || 1;

      const scale = Math.min(mw / gw, mh / gh);

      // Draw mini nodes
      for (const n of nodes) {
        const mx = (n.x - minX) * scale;
        const my = (n.y - minY) * scale;
        miniCtx.fillStyle = n === this.selectedNode ? THEME.citrus : '#65c58b';
        miniCtx.fillRect(mx - 3, my - 2, 6, 4);
      }

      // Draw camera viewport box
      const vx = (-camera.x - minX * camera.zoom) * (scale / camera.zoom);
      const vy = (-camera.y - minY * camera.zoom) * (scale / camera.zoom);
      const vw = width * (scale / camera.zoom);
      const vh = height * (scale / camera.zoom);

      miniCtx.strokeStyle = THEME.citrus;
      miniCtx.lineWidth = 1.2;
      miniCtx.strokeRect(vx, vy, vw, vh);
    }
  }

  return GraphEngine;
});

