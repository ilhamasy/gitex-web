/**
 * Canonical 12-section analysis schema and validator.
 * Source: docs/PRD.md & docs/DESIGN.md
 */

export const SECTION_KEYS = [
  'overview',
  'purpose',
  'features',
  'howItWorks',
  'prerequisites',
  'installation',
  'configuration',
  'usage',
  'techStack',
  'limitations',
  'alternatives',
  'resources',
];

export const SECTION_TITLES = {
  overview: 'Repository Overview',
  purpose: 'Purpose & Use Cases',
  features: 'Key Features',
  howItWorks: 'How It Works',
  prerequisites: 'Prerequisites',
  installation: 'Installation Guide',
  configuration: 'Configuration',
  usage: 'Usage & Examples',
  techStack: 'Tech Stack',
  limitations: 'Limitations & Considerations',
  alternatives: 'Alternatives & Similar Projects',
  resources: 'Official Resources',
};

export const SECTION_TITLES_ID = {
  overview: 'Ringkasan Repositori',
  purpose: 'Tujuan & Skenario Penggunaan',
  features: 'Fitur Utama',
  howItWorks: 'Cara Kerja',
  prerequisites: 'Prasyarat',
  installation: 'Panduan Instalasi',
  configuration: 'Konfigurasi',
  usage: 'Penggunaan & Contoh',
  techStack: 'Tumpukan Teknologi',
  limitations: 'Batasan & Pertimbangan',
  alternatives: 'Alternatif & Proyek Sejenis',
  resources: 'Sumber Daya Resmi',
};

/**
 * Creates a clean default fallback object for an analysis section.
 */
export function createDefaultSection(key, title = SECTION_TITLES[key]) {
  switch (key) {
    case 'overview':
      return {
        title,
        summary: 'Not documented',
        problemSolved: 'Not documented',
        mainGoal: 'Not documented',
        sources: [],
      };
    case 'purpose':
      return {
        title,
        targetUsers: [],
        capabilities: [],
        scenarios: [],
        sources: [],
      };
    case 'features':
      return {
        title,
        coreFeatures: [],
        uniqueCapabilities: [],
        sources: [],
      };
    case 'howItWorks':
      return {
        title,
        architecture: 'Not documented',
        components: [],
        dataFlow: 'Not documented',
        dependencies: [],
        sources: [],
      };
    case 'prerequisites':
      return {
        title,
        runtimes: [],
        languageVersions: [],
        systemTools: [],
        environment: 'Not documented',
        sources: [],
      };
    case 'installation':
      return {
        title,
        steps: [],
        sources: [],
      };
    case 'configuration':
      return {
        title,
        configFiles: [],
        environmentVariables: [],
        setupNotes: 'Not documented',
        sources: [],
      };
    case 'usage':
      return {
        title,
        quickStart: 'Not documented',
        examples: [],
        sources: [],
      };
    case 'techStack':
      return {
        title,
        languages: [],
        frameworks: [],
        primaryLibraries: [],
        infrastructure: [],
        sources: [],
      };
    case 'limitations':
      return {
        title,
        documentedLimitations: [],
        compatibilityNotes: 'Not documented',
        securityNotes: 'Not documented',
        productionReadiness: 'Not documented',
        sources: [],
      };
    case 'alternatives':
      return {
        title,
        similarProjects: [],
        distinctions: 'Not documented',
        sources: [],
      };
    case 'resources':
      return {
        title,
        repositoryUrl: '',
        documentationUrl: null,
        issuesUrl: null,
        releasesUrl: null,
        sources: [],
      };
    default:
      return { title: title || key, content: 'Not documented', sources: [] };
  }
}

/**
 * Creates an empty analysis object ensuring all 12 sections exist.
 */
export function createEmptyAnalysis() {
  const analysis = {};
  for (const key of SECTION_KEYS) {
    analysis[key] = createDefaultSection(key);
  }
  return analysis;
}

/**
 * Validates that an analysis object has all required 12 sections.
 * Returns { valid: boolean, missingSections: string[], normalized: object }
 */
export function validateAndNormalizeAnalysis(rawAnalysis) {
  if (!rawAnalysis || typeof rawAnalysis !== 'object') {
    return {
      valid: false,
      missingSections: [...SECTION_KEYS],
      normalized: createEmptyAnalysis(),
    };
  }

  const missingSections = [];
  const normalized = {};

  for (const key of SECTION_KEYS) {
    const rawSection = rawAnalysis[key];
    if (!rawSection || typeof rawSection !== 'object') {
      missingSections.push(key);
      normalized[key] = createDefaultSection(key);
    } else {
      // Ensure title and sources exist
      normalized[key] = {
        ...createDefaultSection(key),
        ...rawSection,
        title: rawSection.title || SECTION_TITLES[key],
        sources: Array.isArray(rawSection.sources) ? rawSection.sources : [],
      };
    }
  }

  return {
    valid: missingSections.length === 0,
    missingSections,
    normalized,
  };
}

export default {
  SECTION_KEYS,
  SECTION_TITLES,
  createDefaultSection,
  createEmptyAnalysis,
  validateAndNormalizeAnalysis,
};

