/**
 * GitEx — Graph Explorer Data Parser & View Evaluator
 * Non-breaking transformer: converts existing record.analysis into standardized
 * Nodes & Edges graph models without making additional API or LLM calls.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const target = root || (typeof window !== 'undefined' ? window : globalThis);
    const parsed = factory();
    target.GitExGraphParser = parsed;
    if (typeof window !== 'undefined') window.GitExGraphParser = parsed;
    if (typeof globalThis !== 'undefined') globalThis.GitExGraphParser = parsed;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
  'use strict';

  function cleanText(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[`*]/g, '').trim();
  }

  function extractFilePath(name) {
    if (!name) return null;
    const match = name.match(/\(([^)]+\.[a-zA-Z0-9]+)\)/);
    if (match) return match[1].trim();
    if (/\.[a-zA-Z0-9]{1,5}$/.test(name.trim())) {
      return name.trim();
    }
    return null;
  }

  function inferNodeType(name, desc) {
    const text = (name + ' ' + (desc || '')).toLowerCase();
    if (text.includes('endpoint') || text.includes('api route') || text.includes('http') || text.includes('controller')) {
      return 'Endpoint';
    }
    if (text.includes('database') || text.includes('table') || text.includes('sql') || text.includes('schema') || text.includes('model')) {
      return 'Database';
    }
    if (text.includes('service') || text.includes('daemon') || text.includes('worker')) {
      return 'Service';
    }
    if (text.includes('hook') || text.includes('util') || text.includes('helper')) {
      return 'Function';
    }
    if (text.includes('layer') || text.includes('subsystem')) {
      return 'Layer';
    }
    if (text.includes('.tsx') || text.includes('.jsx') || text.includes('component') || text.includes('ui')) {
      return 'Component';
    }
    if (text.includes('module') || text.includes('engine') || text.includes('core')) {
      return 'Module';
    }
    return 'Component';
  }

  /**
   * Main Parser Entry Point
   */
  function parseAnalysis(record) {
    if (!record) return null;

    const analysis = record.analysis || {};
    const howItWorks = analysis.howItWorks || {};
    const techStack = analysis.techStack || {};
    const overview = analysis.overview || {};
    const configuration = analysis.configuration || {};

    const rawComponents = Array.isArray(howItWorks.components) ? howItWorks.components : [];
    const rawDependencies = Array.isArray(howItWorks.dependencies) ? howItWorks.dependencies : [];
    const primaryLibs = Array.isArray(techStack.primaryLibraries) ? techStack.primaryLibraries : (techStack.libraries || []);
    const rawInfra = Array.isArray(techStack.infrastructure) ? techStack.infrastructure : [];
    const dataFlow = howItWorks.dataFlow || '';

    // Identify candidate API endpoints & Database items
    const detectedEndpoints = [];
    const detectedDataModels = [];

    // Parse components
    const componentNodes = rawComponents.map((c, idx) => {
      const name = typeof c === 'string' ? cleanText(c) : cleanText(c.name || `Component ${idx + 1}`);
      const desc = typeof c === 'object' ? (c.purpose || c.description || '') : '';
      const filePath = extractFilePath(typeof c === 'string' ? c : (c.name || ''));
      const type = inferNodeType(name, desc);

      const node = {
        id: `comp-${idx}`,
        name,
        type,
        description: desc,
        sourceFile: filePath,
        category: 'component',
      };

      if (type === 'Endpoint' || /api|\/api|route|handler/i.test(name + ' ' + desc)) {
        detectedEndpoints.push(node);
      }
      if (type === 'Database' || /database|table|schema|model|store/i.test(name + ' ' + desc)) {
        detectedDataModels.push(node);
      }

      return node;
    });

    // Parse dependencies
    const allDepStrings = Array.from(new Set([...rawDependencies, ...primaryLibs]))
      .map(cleanText)
      .filter(Boolean);

    const depNodes = allDepStrings.map((dep, idx) => ({
      id: `dep-${idx}`,
      name: dep,
      type: 'Package',
      description: `External dependency / package utilized by the repository.`,
      category: 'dependency',
    }));

    // Parse infrastructure
    const infraNodes = rawInfra.map(cleanText).filter(Boolean).map((inf, idx) => ({
      id: `infra-${idx}`,
      name: inf,
      type: 'Infrastructure',
      description: `Deployment and infrastructure target.`,
      category: 'infrastructure',
    }));

    // Root system node
    const rootSystem = {
      id: 'root-system',
      name: record.fullName || 'Repository System',
      type: 'System',
      description: overview.summary || record.description || 'Core repository architecture and components.',
      category: 'system',
    };

    // Evaluate available views dynamically based on actual evidence
    const availableViews = [
      { id: 'overview', title: 'Overview', count: 1 + componentNodes.length + depNodes.length },
    ];

    if (howItWorks.architecture || componentNodes.length > 2) {
      availableViews.push({ id: 'architecture', title: 'Architecture', count: componentNodes.length });
    }

    if (depNodes.length > 0) {
      availableViews.push({ id: 'dependencies', title: 'Dependencies', count: depNodes.length });
    }

    if (componentNodes.length > 0) {
      availableViews.push({ id: 'components', title: 'Components', count: componentNodes.length });
    }

    if (detectedEndpoints.length > 0) {
      availableViews.push({ id: 'apiEndpoints', title: 'API Endpoints', count: detectedEndpoints.length });
    }

    if (detectedDataModels.length > 0) {
      availableViews.push({ id: 'dataModel', title: 'Data Model', count: detectedDataModels.length });
    }

    if (dataFlow && dataFlow.length > 20) {
      availableViews.push({ id: 'executionFlow', title: 'Execution Flow', count: componentNodes.length > 3 ? 4 : componentNodes.length });
    }

    if (infraNodes.length > 0) {
      availableViews.push({ id: 'infrastructure', title: 'Infrastructure', count: infraNodes.length });
    }

    const defaultOverview = generateGraphView('overview', {
      rootSystem,
      componentNodes,
      depNodes,
      infraNodes,
      detectedEndpoints,
      detectedDataModels,
      dataFlow,
    });

    return {
      repoName: record.fullName || 'Repository',
      description: overview.summary || record.description || '',
      availableViews,
      allComponents: componentNodes,
      nodes: defaultOverview.nodes,
      edges: defaultOverview.edges,
      buildGraphForView: function (viewId) {
        return generateGraphView(viewId, {
          rootSystem,
          componentNodes,
          depNodes,
          infraNodes,
          detectedEndpoints,
          detectedDataModels,
          dataFlow,
        });
      },
    };
  }

  /**
   * Generates nodes and edges for a specific selected view
   */
  function generateGraphView(viewId, data) {
    const {
      rootSystem,
      componentNodes,
      depNodes,
      infraNodes,
      detectedEndpoints,
      detectedDataModels,
      dataFlow,
    } = data;

    let nodes = [];
    let edges = [];

    switch (viewId) {
      case 'overview': {
        nodes = [rootSystem, ...componentNodes.slice(0, 8), ...depNodes.slice(0, 5)];
        componentNodes.slice(0, 8).forEach((c) => {
          edges.push({
            id: `edge-${rootSystem.id}-${c.id}`,
            source: rootSystem.id,
            target: c.id,
            type: 'CONTAINS',
            description: `${rootSystem.name} contains ${c.name}.`,
          });
        });
        depNodes.slice(0, 5).forEach((d) => {
          edges.push({
            id: `edge-${rootSystem.id}-${d.id}`,
            source: rootSystem.id,
            target: d.id,
            type: 'DEPENDS_ON',
            description: `${rootSystem.name} relies on package ${d.name}.`,
          });
        });
        break;
      }

      case 'architecture': {
        nodes = [rootSystem, ...componentNodes];
        componentNodes.forEach((c, idx) => {
          edges.push({
            id: `edge-arch-${rootSystem.id}-${c.id}`,
            source: rootSystem.id,
            target: c.id,
            type: 'CONTAINS',
            description: `Part of core architecture.`,
          });
          // Connect consecutive component layers
          if (idx > 0 && idx < 6) {
            edges.push({
              id: `edge-flow-${componentNodes[idx - 1].id}-${c.id}`,
              source: componentNodes[idx - 1].id,
              target: c.id,
              type: 'CONNECTS_TO',
              description: `Data & lifecycle connection.`,
            });
          }
        });
        break;
      }

      case 'dependencies': {
        nodes = [rootSystem, ...depNodes];
        depNodes.forEach((d) => {
          edges.push({
            id: `edge-dep-${d.id}`,
            source: rootSystem.id,
            target: d.id,
            type: 'DEPENDS_ON',
            description: `Required package dependency.`,
          });
        });
        break;
      }

      case 'components': {
        nodes = [...componentNodes];
        // Connect related components based on name or order
        for (let i = 0; i < componentNodes.length - 1; i++) {
          edges.push({
            id: `edge-comp-${componentNodes[i].id}-${componentNodes[i + 1].id}`,
            source: componentNodes[i].id,
            target: componentNodes[i + 1].id,
            type: 'CALLS',
            description: `Calls into downstream subsystem.`,
          });
        }
        break;
      }

      case 'apiEndpoints': {
        nodes = [rootSystem, ...detectedEndpoints];
        detectedEndpoints.forEach((ep) => {
          edges.push({
            id: `edge-ep-${ep.id}`,
            source: rootSystem.id,
            target: ep.id,
            type: 'EXPOSES',
            description: `Exposed endpoint / handler.`,
          });
        });
        break;
      }

      case 'dataModel': {
        nodes = [rootSystem, ...detectedDataModels];
        detectedDataModels.forEach((dm) => {
          edges.push({
            id: `edge-dm-${dm.id}`,
            source: rootSystem.id,
            target: dm.id,
            type: 'READS',
            description: `Interacts with persistent data model.`,
          });
        });
        break;
      }

      case 'executionFlow': {
        nodes = componentNodes.slice(0, 6);
        for (let i = 0; i < nodes.length - 1; i++) {
          edges.push({
            id: `edge-exec-${nodes[i].id}-${nodes[i + 1].id}`,
            source: nodes[i].id,
            target: nodes[i + 1].id,
            type: 'CALLS',
            description: `Sequential execution stage in data flow.`,
          });
        }
        break;
      }

      case 'infrastructure': {
        nodes = [rootSystem, ...infraNodes];
        infraNodes.forEach((inf) => {
          edges.push({
            id: `edge-infra-${inf.id}`,
            source: rootSystem.id,
            target: inf.id,
            type: 'CONNECTS_TO',
            description: `Configured infrastructure / cloud runtime.`,
          });
        });
        break;
      }

      default: {
        nodes = [rootSystem, ...componentNodes.slice(0, 6)];
        componentNodes.slice(0, 6).forEach((c) => {
          edges.push({
            id: `edge-def-${rootSystem.id}-${c.id}`,
            source: rootSystem.id,
            target: c.id,
            type: 'CONTAINS',
            description: `System component.`,
          });
        });
      }
    }

    return { nodes, edges };
  }

  return {
    parseAnalysis,
    inferNodeType,
  };
});
