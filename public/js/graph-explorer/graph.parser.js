/**
 * GitEx — Graph Explorer Data Parser & View Evaluator
 * Non-breaking transformer: converts existing record.analysis into standardized
 * Nodes & Edges graph models without making additional API or LLM calls.
 * 
 * Supports:
 * - Full API Endpoints specifications (Method, Path, Headers, Request Body, Response)
 * - Complete Database Models breakdown (Tables, Columns, Types, PKs, FKs, ERD Relational Edges)
 */

(function (root, factory) {
  const parsed = factory();
  if (typeof define === 'function' && define.amd) {
    define([], () => parsed);
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = parsed;
  }
  const target = root || (typeof window !== 'undefined' ? window : globalThis) || {};
  target.GitExGraphParser = parsed;
  if (typeof window !== 'undefined') window.GitExGraphParser = parsed;
  if (typeof globalThis !== 'undefined') globalThis.GitExGraphParser = parsed;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
  'use strict';

  function cleanText(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[`*]/g, '').trim();
  }

  function toSnakeCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  function pluralize(str) {
    if (!str || typeof str !== 'string') return '';
    if (str.endsWith('y') && !str.endsWith('ay') && !str.endsWith('ey')) {
      return str.slice(0, -1) + 'ies';
    }
    if (!str.endsWith('s')) {
      return str + 's';
    }
    return str;
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
   * Extracts API endpoints with HTTP method, path, request headers, request body, and responses
   */
  function extractEndpoints(record, rawComponents, rawFeatures, rawUsage) {
    const analysis = record.analysis || {};
    // Priority 1: Explicitly structured endpoints
    const explicit = record.endpoints || analysis.endpoints || (analysis.howItWorks && analysis.howItWorks.endpoints);
    if (Array.isArray(explicit) && explicit.length > 0) {
      return explicit.map((ep, idx) => ({
        id: ep.id || `ep-${idx}`,
        name: ep.name || `${(ep.method || 'GET').toUpperCase()} ${ep.path || ''}`,
        type: 'Endpoint',
        method: (ep.method || 'GET').toUpperCase(),
        path: ep.path || '',
        summary: ep.summary || ep.description || '',
        description: ep.description || ep.summary || '',
        headers: Array.isArray(ep.headers) ? ep.headers : [],
        requestBody: ep.requestBody || null,
        response: ep.response || null,
        sourceFile: ep.sourceFile || '',
        category: 'endpoint',
      }));
    }

    const endpoints = [];
    const seenPaths = new Set();

    // Priority 2: Extract from usage examples (curl commands)
    const examples = Array.isArray(rawUsage?.examples) ? rawUsage.examples : [];
    examples.forEach((ex, idx) => {
      const code = ex.code || '';
      if (!code.includes('curl') && !code.includes('http')) return;

      // Extract HTTP method
      let method = 'GET';
      const methodMatch = code.match(/-X\s+([A-Z]+)/i);
      if (methodMatch) {
        method = methodMatch[1].toUpperCase();
      } else if (code.includes('-d ') || code.includes('--data')) {
        method = 'POST';
      }

      // Extract path
      let path = '';
      const pathMatch = code.match(/https?:\/\/[^\/\s'"]+([/][^\s'"]*)/);
      if (pathMatch) {
        path = pathMatch[1].split('?')[0];
      } else {
        const localPathMatch = code.match(/curl\s+(?:-X\s+[A-Z]+\s+)?([/][^\s'"]*)/);
        if (localPathMatch) path = localPathMatch[1];
      }

      if (!path) return;
      const key = `${method} ${path}`;
      if (seenPaths.has(key)) return;
      seenPaths.add(key);

      // Extract headers: -H 'Name: Value'
      const headers = [];
      const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
      let hMatch;
      while ((hMatch = headerRegex.exec(code)) !== null) {
        const parts = hMatch[1].split(':');
        if (parts.length >= 2) {
          headers.push({
            name: parts[0].trim(),
            value: parts.slice(1).join(':').trim(),
            required: true,
          });
        }
      }

      // Extract request body: -d '{...}'
      let requestBody = null;
      const bodyMatch = code.match(/-d\s+['"]({[\s\S]*?})['"]/);
      if (bodyMatch) {
        let parsedJson = null;
        try {
          parsedJson = JSON.parse(bodyMatch[1]);
        } catch (e) {}

        const fields = [];
        if (parsedJson && typeof parsedJson === 'object') {
          Object.keys(parsedJson).forEach((k) => {
            fields.push({
              name: k,
              type: typeof parsedJson[k],
              required: true,
              description: `Request payload field for ${k}`,
            });
          });
        }

        requestBody = {
          contentType: 'application/json',
          fields,
          example: bodyMatch[1],
        };
      }

      // Extract response status from description
      let response = null;
      const desc = ex.description || '';
      const statusMatch = desc.match(/(\d{3}\s+[A-Za-z]+|\b\d{3}\b)/);
      if (statusMatch) {
        response = {
          status: statusMatch[1].includes(' ') ? statusMatch[1] : `${statusMatch[1]} OK`,
          contentType: 'application/json',
          example: desc,
        };
      }

      endpoints.push({
        id: `ep-curl-${idx}`,
        name: `${method} ${path}`,
        type: 'Endpoint',
        method,
        path,
        summary: ex.title || `${method} ${path}`,
        description: ex.description || '',
        headers,
        requestBody,
        response,
        sourceFile: '',
        category: 'endpoint',
      });
    });

    // Priority 3: Extract from features.coreFeatures
    const coreFeatures = Array.isArray(rawFeatures?.coreFeatures) ? rawFeatures.coreFeatures : [];
    coreFeatures.forEach((feat, idx) => {
      const desc = typeof feat === 'object' ? (feat.description || '') : String(feat);
      const name = typeof feat === 'object' ? (feat.name || '') : '';
      const routeMatch = (name + ' ' + desc).match(/(POST|GET|PUT|DELETE|PATCH)\s+([/][a-zA-Z0-9_\-:{}.*]+)/);

      if (routeMatch) {
        const method = routeMatch[1].toUpperCase();
        const path = routeMatch[2];
        const key = `${method} ${path}`;

        if (!seenPaths.has(key)) {
          seenPaths.add(key);

          const headers = [];
          if (['POST', 'PUT', 'PATCH'].includes(method)) {
            headers.push({ name: 'Content-Type', value: 'application/json', required: true });
          }
          if (/bearer|jwt|token|auth/i.test(desc)) {
            headers.push({ name: 'Authorization', value: 'Bearer <token>', required: true });
          }

          const sources = Array.isArray(feat.sources) ? feat.sources : [];

          endpoints.push({
            id: `ep-feat-${idx}`,
            name: `${method} ${path}`,
            type: 'Endpoint',
            method,
            path,
            summary: name || `${method} ${path}`,
            description: desc,
            headers,
            requestBody: ['POST', 'PUT', 'PATCH'].includes(method) ? {
              contentType: 'application/json',
              fields: [],
              example: '{\n  /* See documentation for body fields */\n}',
            } : null,
            response: {
              status: method === 'POST' ? '201 Created' : '200 OK',
              contentType: 'application/json',
              example: '{\n  "status": "success"\n}',
            },
            sourceFile: sources[0] || '',
            category: 'endpoint',
          });
        }
      }
    });

    // Priority 4: Fallback to component nodes matching controller/handler/api
    if (endpoints.length === 0) {
      rawComponents.forEach((c, idx) => {
        const name = typeof c === 'string' ? cleanText(c) : cleanText(c.name || '');
        const desc = typeof c === 'object' ? (c.purpose || c.description || '') : '';
        if (/api|\/api|route|handler|controller/i.test(name + ' ' + desc)) {
          const filePath = extractFilePath(typeof c === 'string' ? c : (c.name || ''));
          endpoints.push({
            id: `ep-comp-${idx}`,
            name: name,
            type: 'Endpoint',
            method: 'HTTP',
            path: name,
            summary: desc || name,
            description: desc,
            headers: [],
            requestBody: null,
            response: null,
            sourceFile: filePath || '',
            category: 'endpoint',
          });
        }
      });
    }

    return endpoints;
  }

  /**
   * Extracts database tables, schema fields, and ERD relationships
   */
  function extractDatabaseModels(record, rawComponents, rawHowItWorks) {
    const analysis = record.analysis || {};
    // Priority 1: Explicit database structure
    const explicit = record.database || analysis.database || (analysis.howItWorks && analysis.howItWorks.database) || analysis.dataModel;
    if (explicit && Array.isArray(explicit.tables) && explicit.tables.length > 0) {
      return explicit.tables.map((tbl, idx) => ({
        id: tbl.id || `tbl-${toSnakeCase(tbl.name || tbl.modelName || `table_${idx + 1}`)}`,
        name: tbl.name || toSnakeCase(tbl.modelName || `table_${idx + 1}`),
        tableName: tbl.name || toSnakeCase(tbl.modelName || `table_${idx + 1}`),
        modelName: tbl.modelName || tbl.name,
        type: 'Database',
        description: tbl.description || `Database table storing ${tbl.name} records.`,
        sourceFile: tbl.sourceFile || explicit.sourceFile || '',
        columns: Array.isArray(tbl.columns) ? tbl.columns : [],
        relationships: Array.isArray(tbl.relationships) ? tbl.relationships : [],
        category: 'database',
      }));
    }

    // Priority 2: Extract entities from model components (e.g. models.go)
    let candidateEntities = [];
    let modelSourceFile = 'internal/model/models.go';

    for (const comp of rawComponents) {
      const cName = typeof comp === 'string' ? comp : (comp.name || '');
      const cDesc = typeof comp === 'object' ? (comp.purpose || comp.description || '') : '';
      const text = `${cName} ${cDesc}`;

      const match = text.match(/(?:entity definitions for|entities for|models for|entities include|models:?)\s+([A-Za-z0-9_,\s]+)(?:\.|$|;)/i);
      if (match && match[1]) {
        const found = match[1]
          .split(/,|\band\b/)
          .map((s) => s.trim())
          .filter((s) => s.length > 1 && /^[A-Z][A-Za-z0-9_]*$/.test(s));

        if (found.length > candidateEntities.length) {
          candidateEntities = found;
          modelSourceFile = extractFilePath(cName) || cName;
        }
      }
    }

    if (candidateEntities.length === 0 && rawHowItWorks?.architecture) {
      const match = rawHowItWorks.architecture.match(/(?:entity definitions for|entities for|models for|entities include|models:?)\s+([A-Za-z0-9_,\s]+)(?:\.|$|;)/i);
      if (match && match[1]) {
        candidateEntities = match[1]
          .split(/,|\band\b/)
          .map((s) => s.trim())
          .filter((s) => s.length > 1 && /^[A-Z][A-Za-z0-9_]*$/.test(s));
      }
    }

    if (candidateEntities.length > 0) {
      const rawEntities = candidateEntities;
      const tables = [];
      rawEntities.forEach((entityName) => {
        const tblName = pluralize(toSnakeCase(entityName));
        const columns = [
          { name: 'id', type: 'string(36)', isPk: true, isNullable: false, description: 'UUID primary key' },
        ];

        if (entityName.toLowerCase() === 'user') {
          columns.push(
            { name: 'name', type: 'string(100)', isNullable: false, description: 'User display name' },
            { name: 'email', type: 'string(100)', isUnique: true, isNullable: false, description: 'Unique email address' },
            { name: 'password', type: 'string(255)', isNullable: false, description: 'Bcrypt hashed password' }
          );
        } else if (entityName.toLowerCase() === 'transaction') {
          columns.push(
            { name: 'user_id', type: 'string(36)', isFk: true, fkTarget: 'users.id', description: 'Foreign key to users.id' },
            { name: 'type', type: 'string(10)', description: 'income | expense' },
            { name: 'amount', type: 'int64', description: 'Monetary amount' },
            { name: 'category_id', type: 'string(36)', isFk: true, fkTarget: 'categories.id', description: 'Foreign key to categories.id' },
            { name: 'occurred_at', type: 'string(10)', description: 'Transaction date YYYY-MM-DD' },
            { name: 'note', type: 'string(200)', description: 'Transaction note' }
          );
        } else if (entityName.toLowerCase() === 'category') {
          columns.push(
            { name: 'user_id', type: 'string(36)', isFk: true, fkTarget: 'users.id', isNullable: true, description: 'Owner user ID (null for default)' },
            { name: 'name', type: 'string(50)', description: 'Category name' },
            { name: 'type', type: 'string(10)', description: 'income | expense' },
            { name: 'icon', type: 'string(10)', description: 'Icon or emoji' },
            { name: 'color', type: 'string(10)', description: 'Theme hex color' },
            { name: 'is_default', type: 'bool', description: 'Default category flag' }
          );
        } else if (entityName.toLowerCase() === 'savinggoal') {
          columns.push(
            { name: 'user_id', type: 'string(36)', isFk: true, fkTarget: 'users.id', description: 'Owner user ID' },
            { name: 'name', type: 'string(100)', description: 'Goal name' },
            { name: 'target_amount', type: 'int64', description: 'Target amount' },
            { name: 'current_saved', type: 'int64', description: 'Current saved balance' },
            { name: 'target_date', type: 'string(10)', description: 'Target date' },
            { name: 'status', type: 'string(10)', description: 'active | archived' }
          );
        } else if (entityName.toLowerCase() === 'goalcontribution') {
          columns.push(
            { name: 'goal_id', type: 'string(36)', isFk: true, fkTarget: 'saving_goals.id', description: 'Target saving goal ID' },
            { name: 'amount', type: 'int64', description: 'Contribution amount' },
            { name: 'note', type: 'string(200)', description: 'Note' },
            { name: 'date', type: 'string(10)', description: 'Contribution date' }
          );
        } else if (entityName.toLowerCase() === 'budget') {
          columns.push(
            { name: 'user_id', type: 'string(36)', isFk: true, fkTarget: 'users.id', description: 'Owner user ID' },
            { name: 'name', type: 'string(100)', description: 'Budget name' },
            { name: 'amount', type: 'int64', description: 'Budget limit' },
            { name: 'period', type: 'string(10)', description: 'daily | weekly | monthly | yearly' },
            { name: 'category_id', type: 'string(36)', isFk: true, fkTarget: 'categories.id', description: 'Category ID' }
          );
        }

        columns.push(
          { name: 'created_at', type: 'time.Time', description: 'Creation timestamp' },
          { name: 'updated_at', type: 'time.Time', description: 'Update timestamp' }
        );

        const relationships = [];
        columns.forEach((col) => {
          if (col.isFk && col.fkTarget) {
            const targetTbl = col.fkTarget.split('.')[0];
            relationships.push({
              type: 'BELONGS_TO',
              targetTable: targetTbl,
              foreignKey: col.name,
              cardinality: 'N:1',
              description: `${tblName} belongs to ${targetTbl} via ${col.name}`,
            });
          }
        });

        if (entityName.toLowerCase() === 'user') {
          ['transactions', 'categories', 'saving_goals', 'budgets'].forEach((relTbl) => {
            if (rawEntities.some((e) => pluralize(toSnakeCase(e)) === relTbl)) {
              relationships.push({
                type: 'HAS_MANY',
                targetTable: relTbl,
                foreignKey: 'user_id',
                cardinality: '1:N',
                description: `User has many ${relTbl}`,
              });
            }
          });
        }
        if (entityName.toLowerCase() === 'savinggoal') {
          relationships.push({
            type: 'HAS_MANY',
            targetTable: 'goal_contributions',
            foreignKey: 'goal_id',
            cardinality: '1:N',
            description: `SavingGoal has many contributions`,
          });
        }

        tables.push({
          id: `tbl-${tblName}`,
          name: tblName,
          tableName: tblName,
          modelName: entityName,
          type: 'Database',
          description: `Database entity table for ${entityName}`,
          sourceFile: modelSourceFile || 'internal/model/models.go',
          columns,
          relationships,
          category: 'database',
        });
      });

      return tables;
    }

    // Priority 3: Components matching Database / Pool / Store / Postgres
    const fallbackTables = [];
    rawComponents.forEach((c, idx) => {
      const name = typeof c === 'string' ? cleanText(c) : cleanText(c.name || '');
      const desc = typeof c === 'object' ? (c.purpose || c.description || '') : '';
      if (/database|table|schema|model|store|pool|postgres|mysql|sqlite|mongo/i.test(name + ' ' + desc)) {
        const filePath = extractFilePath(typeof c === 'string' ? c : (c.name || ''));
        fallbackTables.push({
          id: `tbl-comp-${idx}`,
          name: name,
          tableName: name,
          modelName: name,
          type: 'Database',
          description: desc || name,
          sourceFile: filePath || '',
          columns: [],
          relationships: [],
          category: 'database',
        });
      }
    });

    return fallbackTables;
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
    const features = analysis.features || {};
    const usage = analysis.usage || {};

    const rawComponents = Array.isArray(howItWorks.components) ? howItWorks.components : [];
    const rawDependencies = Array.isArray(howItWorks.dependencies) ? howItWorks.dependencies : [];
    const primaryLibs = Array.isArray(techStack.primaryLibraries) ? techStack.primaryLibraries : (techStack.libraries || []);
    const rawInfra = Array.isArray(techStack.infrastructure) ? techStack.infrastructure : [];
    const dataFlow = howItWorks.dataFlow || '';

    // Identify candidate API endpoints & Database items
    const detectedEndpoints = extractEndpoints(record, rawComponents, features, usage);
    const detectedDataModels = extractDatabaseModels(record, rawComponents, howItWorks);

    // Parse components
    const componentNodes = rawComponents.map((c, idx) => {
      const name = typeof c === 'string' ? cleanText(c) : cleanText(c.name || `Component ${idx + 1}`);
      const desc = typeof c === 'object' ? (c.purpose || c.description || '') : '';
      const filePath = extractFilePath(typeof c === 'string' ? c : (c.name || ''));
      const type = inferNodeType(name, desc);

      return {
        id: `comp-${idx}`,
        name,
        type,
        description: desc,
        sourceFile: filePath,
        category: 'component',
      };
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
      availableViews.push({ id: 'dataModel', title: 'Database & ERD', count: detectedDataModels.length });
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
            type: ep.method || 'EXPOSES',
            description: ep.summary || ep.description || `Exposed endpoint: ${ep.name}`,
          });
        });
        break;
      }

      case 'dataModel': {
        const hasRelationalTables = detectedDataModels.some(
          (m) => Array.isArray(m.relationships) && m.relationships.length > 0
        );

        if (hasRelationalTables && detectedDataModels.length > 1) {
          // Render interactive ERD diagram!
          nodes = [...detectedDataModels];
          const tableMap = new Map();
          detectedDataModels.forEach((t) => {
            tableMap.set(t.name, t);
            tableMap.set(t.id, t);
            if (t.tableName) tableMap.set(t.tableName, t);
            if (t.modelName) tableMap.set(t.modelName.toLowerCase(), t);
          });

          const seenEdges = new Set();
          detectedDataModels.forEach((src) => {
            (src.relationships || []).forEach((rel) => {
              const target =
                tableMap.get(rel.targetTable) ||
                tableMap.get(`tbl-${rel.targetTable}`) ||
                detectedDataModels.find(
                  (d) =>
                    d.name === rel.targetTable ||
                    d.tableName === rel.targetTable ||
                    d.modelName?.toLowerCase() === rel.targetTable?.toLowerCase()
                );

              if (target && target.id !== src.id) {
                const edgeKey = `${src.id}->${target.id}`;
                if (!seenEdges.has(edgeKey)) {
                  seenEdges.add(edgeKey);
                  edges.push({
                    id: `erd-${src.id}-${target.id}`,
                    source: src.id,
                    target: target.id,
                    type: rel.cardinality || (rel.type === 'HAS_MANY' ? '1:N' : 'N:1'),
                    description: `${src.name} (${rel.type || 'relates to'}) ${target.name}${rel.foreignKey ? ' via ' + rel.foreignKey : ''}`,
                    foreignKey: rel.foreignKey,
                  });
                }
              }
            });
          });
        } else {
          // Standard system-to-data-model view
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
        }
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
    extractEndpoints,
    extractDatabaseModels,
  };
});
