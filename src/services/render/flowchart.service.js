/**
 * Flowchart Service — Universal Execution Flow Visualizer for GitEx
 * Generates semantic, dark-and-green themed Mermaid flowchart syntax
 * from repository analysis data (dataFlow, components, architecture).
 */

/**
 * Escapes characters for Mermaid node labels
 */
function sanitizeMermaidText(str) {
  if (!str) return '';
  return String(str)
    .replace(/"/g, "'")
    .replace(/[<>{}[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncates text cleanly at word boundaries
 */
function truncateText(str, maxLen = 70) {
  if (!str || str.length <= maxLen) return str;
  const sub = str.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 30 ? sub.slice(0, lastSpace) : sub) + '...';
}

/**
 * Parses dataFlow text or components into structured flow steps
 */
export function extractFlowSteps(howItWorks = {}) {
  const steps = [];
  const hw = howItWorks || {};
  const rawFlow = (hw.dataFlow || '').trim();

  // Pattern 1: Arrow-separated flow (e.g. Prompt -> Context -> Generation -> Output)
  if (rawFlow.includes('->')) {
    const rawNodes = rawFlow
      .split('->')
      .map((s) => s.trim().replace(/^\d+\.\s*/, '').replace(/\.$/, ''))
      .filter((s) => s.length > 0);

    if (rawNodes.length >= 2) {
      rawNodes.forEach((nodeText, idx) => {
        steps.push({
          stepNum: idx + 1,
          label: truncateText(nodeText, 60),
          detail: nodeText,
          edgeLabel: idx === 0 ? 'Initiates' : 'Next',
        });
      });
      return steps;
    }
  }

  // Pattern 2: Numbered steps or bullet list
  const stepRegex = /(?:^|\n|\.\s+)(?:(\d+)[\.\)]|\*|-)\s+([^\n.]+)/g;
  let m;
  while ((m = stepRegex.exec(rawFlow)) !== null) {
    const text = m[2].trim();
    if (text.length > 5) {
      steps.push({
        stepNum: steps.length + 1,
        label: truncateText(text, 65),
        detail: text,
      });
    }
  }

  // Pattern 3: Multi-sentence paragraph if no explicit list
  if (steps.length < 2 && rawFlow.length > 20 && rawFlow !== 'Not documented') {
    const sentences = rawFlow
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim().replace(/^\d+[\.\)]\s*/, ''))
      .filter((s) => s.length > 15);

    if (sentences.length >= 2) {
      sentences.slice(0, 8).forEach((sen, idx) => {
        steps.push({
          stepNum: idx + 1,
          label: truncateText(sen, 65),
          detail: sen,
        });
      });
      return steps;
    }
  }

  // Pattern 4: Fallback to Key Components if dataFlow was empty
  if (steps.length < 2 && Array.isArray(hw.components) && hw.components.length >= 2) {
    hw.components.slice(0, 6).forEach((comp, idx) => {
      const name = typeof comp === 'string' ? comp : comp.name || `Component ${idx + 1}`;
      const purpose = typeof comp === 'object' && comp.purpose ? comp.purpose : '';
      steps.push({
        stepNum: idx + 1,
        label: sanitizeMermaidText(name),
        detail: purpose,
        isComponent: true,
      });
    });
    return steps;
  }

  return steps;
}

/**
 * Checks whether an analysis record has sufficient information for a flowchart
 */
export function hasFlowchartData(analysis) {
  if (!analysis) return false;
  if (analysis.flowchart && typeof analysis.flowchart === 'string' && analysis.flowchart.trim().length > 10) {
    return true;
  }
  const howItWorks = analysis.howItWorks || {};
  const dataFlow = (howItWorks.dataFlow || '').trim();
  if (dataFlow && dataFlow !== 'Not documented' && dataFlow.length > 15) return true;
  if (Array.isArray(howItWorks.components) && howItWorks.components.length >= 2) return true;
  return false;
}

/**
 * Generates standard Mermaid flowchart TD syntax with dark & citrus styling
 * @param {object} analysis - Analysis record
 * @param {string} lang - 'en' | 'id'
 * @returns {string} Mermaid diagram definition
 */
export function generateFlowchartDefinition(analysis, lang = 'en') {
  if (!analysis) return '';

  // 1. Direct flowchart override if provided
  if (analysis.flowchart && typeof analysis.flowchart === 'string' && analysis.flowchart.trim().startsWith('flowchart')) {
    return analysis.flowchart.trim();
  }

  const howItWorks = analysis.howItWorks || {};
  const steps = extractFlowSteps(howItWorks);

  const isId = lang === 'id';
  const startTitle = isId ? 'Mulai: Alur Masukan' : 'Start: Input Flow';
  const completeTitle = isId ? 'Selesai: Hasil Eksekusi' : 'Complete: Execution Output';

  if (steps.length < 2) {
    // Graceful fallback diagram
    return [
      'flowchart TD',
      '    classDef default fill:#20231F,stroke:#3A4038,stroke-width:1.5px,color:#F1F2EA,rx:6px,ry:6px;',
      '    classDef highlight fill:#292D28,stroke:#C7F36B,stroke-width:2px,color:#F1F2EA,rx:6px,ry:6px;',
      `    A["${sanitizeMermaidText(analysis.overview?.summary ? truncateText(analysis.overview.summary, 50) : startTitle)}"]:::highlight`,
      `    B["${sanitizeMermaidText(howItWorks.architecture ? truncateText(howItWorks.architecture, 50) : (isId ? 'Pemrosesan Sistem' : 'System Processing'))}"]:::default`,
      `    C["${completeTitle}"]:::highlight`,
      '    A --> B',
      '    B --> C',
    ].join('\n');
  }

  const lines = [
    'flowchart TD',
    '    %% GitEx Theme Classes (Charcoal & Citrus Green)',
    '    classDef default fill:#20231F,stroke:#3A4038,stroke-width:1.5px,color:#F1F2EA,rx:6px,ry:6px;',
    '    classDef startNode fill:#292D28,stroke:#C7F36B,stroke-width:2px,color:#F1F2EA,rx:8px,ry:8px;',
    '    classDef activeNode fill:#20231F,stroke:#C7F36B,stroke-width:1.5px,color:#F1F2EA,rx:6px,ry:6px;',
    '    classDef endNode fill:#171916,stroke:#65C58B,stroke-width:2px,color:#F1F2EA,rx:8px,ry:8px;',
  ];

  // Define nodes
  steps.forEach((step, idx) => {
    const nodeId = `Step_${idx + 1}`;
    const cleanLabel = sanitizeMermaidText(step.label).replace(/^\d+[\.\)]\s*/, '');
    const nodeText = `${idx + 1}. ${cleanLabel}`;

    let nodeClass = 'default';
    if (idx === 0) nodeClass = 'startNode';
    else if (idx === steps.length - 1) nodeClass = 'endNode';
    else if (idx % 2 === 1) nodeClass = 'activeNode';

    lines.push(`    ${nodeId}["${nodeText}"]:::${nodeClass}`);
  });

  // Define sequential edges
  for (let i = 0; i < steps.length - 1; i++) {
    const fromId = `Step_${i + 1}`;
    const toId = `Step_${i + 2}`;
    const edgeLabel = steps[i].edgeLabel;
    if (edgeLabel) {
      lines.push(`    ${fromId} -->|"${sanitizeMermaidText(edgeLabel)}"| ${toId}`);
    } else {
      lines.push(`    ${fromId} --> ${toId}`);
    }
  }

  return lines.join('\n');
}

export default {
  extractFlowSteps,
  hasFlowchartData,
  generateFlowchartDefinition,
};
