import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFlowSteps,
  hasFlowchartData,
  generateFlowchartDefinition,
} from '../src/services/render/flowchart.service.js';

describe('FlowchartService — Universal Execution Flow Visualizer', () => {
  describe('extractFlowSteps', () => {
    it('extracts numbered multi-line steps correctly', () => {
      const howItWorks = {
        dataFlow: '1. User enters API credentials.\n2. Request is validated.\n3. Server processes request.\n4. Database persists result.',
      };
      const steps = extractFlowSteps(howItWorks);
      assert.equal(steps.length, 4);
      assert.equal(steps[0].stepNum, 1);
      assert.ok(steps[0].label.includes('User enters API credentials'));
      assert.equal(steps[3].stepNum, 4);
      assert.ok(steps[3].label.includes('Database persists result'));
    });

    it('extracts arrow-separated chains correctly', () => {
      const howItWorks = {
        dataFlow: 'User -> Input Validation -> Processing Engine -> Result Store',
      };
      const steps = extractFlowSteps(howItWorks);
      assert.equal(steps.length, 4);
      assert.equal(steps[0].label, 'User');
      assert.equal(steps[1].label, 'Input Validation');
      assert.equal(steps[2].label, 'Processing Engine');
      assert.equal(steps[3].label, 'Result Store');
    });

    it('falls back to key components when dataFlow is absent or brief', () => {
      const howItWorks = {
        dataFlow: '',
        components: [
          { name: 'Gateway', purpose: 'Handles incoming API traffic' },
          { name: 'Auth Module', purpose: 'Validates JWT sessions' },
          { name: 'Worker Queue', purpose: 'Processes background jobs' },
        ],
      };
      const steps = extractFlowSteps(howItWorks);
      assert.equal(steps.length, 3);
      assert.equal(steps[0].label, 'Gateway');
      assert.equal(steps[1].label, 'Auth Module');
      assert.equal(steps[2].label, 'Worker Queue');
    });

    it('handles empty or missing howItWorks safely', () => {
      assert.deepEqual(extractFlowSteps(null), []);
      assert.deepEqual(extractFlowSteps({}), []);
    });
  });

  describe('hasFlowchartData', () => {
    it('returns true when valid dataFlow is provided', () => {
      const analysis = {
        howItWorks: {
          dataFlow: '1. Step one is initiated. 2. Step two is executed.',
        },
      };
      assert.equal(hasFlowchartData(analysis), true);
    });

    it('returns true when direct flowchart property exists', () => {
      const analysis = {
        flowchart: 'flowchart TD\nA --> B',
      };
      assert.equal(hasFlowchartData(analysis), true);
    });

    it('returns false when no dataFlow and insufficient components exist', () => {
      const analysis = {
        howItWorks: {
          dataFlow: 'Not documented',
          components: [],
        },
      };
      assert.equal(hasFlowchartData(analysis), false);
    });
  });

  describe('generateFlowchartDefinition', () => {
    it('generates complete dark-and-green styled Mermaid flowchart', () => {
      const analysis = {
        howItWorks: {
          dataFlow: '1. User submits input form.\n2. Server parses query.\n3. Cache provides result.',
        },
      };
      const mermaidCode = generateFlowchartDefinition(analysis, 'en');
      assert.ok(mermaidCode.startsWith('flowchart TD'));
      assert.ok(mermaidCode.includes('classDef default fill:#20231F'));
      assert.ok(mermaidCode.includes('stroke:#C7F36B'));
      assert.ok(mermaidCode.includes('Step_1 --> Step_2'));
      assert.ok(mermaidCode.includes('Step_2 --> Step_3'));
    });

    it('supports direct flowchart override definition', () => {
      const customDiagram = 'flowchart LR\n    Client --> Server';
      const analysis = {
        flowchart: customDiagram,
      };
      assert.equal(generateFlowchartDefinition(analysis), customDiagram);
    });

    it('returns fallback flowchart when steps are fewer than 2', () => {
      const analysis = {
        overview: { summary: 'CLI tool for analyzing repositories' },
        howItWorks: { architecture: 'Modular architecture' },
      };
      const mermaidCode = generateFlowchartDefinition(analysis, 'en');
      assert.ok(mermaidCode.startsWith('flowchart TD'));
      assert.ok(mermaidCode.includes('CLI tool for analyzing repositories'));
      assert.ok(mermaidCode.includes('Modular architecture'));
    });
  });
});

