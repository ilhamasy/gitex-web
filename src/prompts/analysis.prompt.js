/**
 * Analysis Prompts and Template Builder
 * Source: docs/PRD.md & docs/DESIGN.md
 */

export const SYSTEM_INSTRUCTION = `You are GitEx, a precise developer research workbench and technical field notebook.
Your job is to produce a rigorous, evidence-backed 12-section technical guide from a repository's metadata, README, directory tree, and source files.

CRITICAL RULES:
1. Grounding & Truthfulness: Base every claim exclusively on the provided repository facts, manifests, README, and source code.
2. No Inventions: Never hallucinate commands, dependencies, versions, compatibility flags, or security claims.
3. Explicit Absence: If any requested information is not documented or cannot be determined from the provided files, explicitly state "Not documented" or "Unable to verify". Do NOT guess or invent placeholders.
4. Source Attribution: For every section, attach relevant source file paths or URLs in the "sources" array (e.g. ["package.json", "README.md", "src/index.js"]).
5. Voice & Tone: Sound like an expert technical teammate — direct, precise, objective. Zero generic AI marketing filler (e.g., no "Unlock the power", "Supercharge", "Cutting-edge").
6. Distinguish Facts vs Inferences: Clearly delineate verified repository facts from reasonable inferences or architectural recommendations.
7. Output Format: Return a single valid JSON object containing all 12 sections matching the specified schema keys.`;

/**
 * Builds the user prompt containing bounded repository context.
 *
 * @param {object} repoMeta - Repository metadata (name, owner, provider, description, languages, etc.)
 * @param {object} repomixBundle - Repomix packed context (XML content, source paths)
 * @returns {string} - Assembled prompt text
 */
export function buildAnalysisPrompt(repoMeta, repomixBundle = null) {
  const {
    provider = 'github',
    owner = 'unknown',
    name = 'unknown',
    fullName = `${owner}/${name}`,
    url = '',
    description = '',
    defaultBranch = 'main',
    commitSha = 'HEAD',
    language = 'Unknown',
    languages = {},
    stars = 0,
    forks = 0,
    license = 'Not documented',
    readme = {},
    tree = {},
  } = repoMeta || {};

  const readmeContent = readme?.content || 'No README file found.';
  const treeSummary = tree?.summary || {};
  const packedSource = repomixBundle?.packedContent || 'No bundled source code available.';

  return `Please analyze the following repository and generate the comprehensive 12-section technical guide in JSON format.

=== REPOSITORY METADATA ===
Provider: ${provider}
Full Name: ${fullName}
URL: ${url}
Description: ${description || 'Not provided'}
Default Branch: ${defaultBranch}
Analyzed Revision (Commit SHA): ${commitSha || defaultBranch}
Primary Language: ${language || 'Not detected'}
Language Breakdown: ${JSON.stringify(languages)}
Stars: ${stars}
Forks: ${forks}
License: ${license || 'Not documented'}

=== DIRECTORY TREE SUMMARY ===
Manifests: ${JSON.stringify(treeSummary.manifests || [])}
Configuration Files: ${JSON.stringify(treeSummary.configs || [])}
Documentation Files: ${JSON.stringify(treeSummary.docs || [])}
Entry Points: ${JSON.stringify(treeSummary.entryPoints || [])}
Total Relevant Files: ${tree?.relevantFiles?.length || 0}

=== README CONTENT ===
${readmeContent.slice(0, 15000)}

=== BUNDLED SOURCE CONTEXT (REPOMIX) ===
${packedSource.slice(0, 60000)}

=== OUTPUT SCHEMA REQUIREMENT ===
Respond ONLY with a JSON object containing EXACTLY these 12 top-level keys:
{
  "overview": {
    "title": "Repository Overview",
    "summary": "Concise summary of what the project is",
    "problemSolved": "What specific technical or business problem it addresses",
    "mainGoal": "Primary objective of the project",
    "sources": ["files cited"]
  },
  "purpose": {
    "title": "Purpose & Use Cases",
    "targetUsers": ["Target user personas"],
    "capabilities": ["What the software can do"],
    "scenarios": ["Real-world application scenarios"],
    "sources": ["files cited"]
  },
  "features": {
    "title": "Key Features",
    "coreFeatures": [
      { "name": "Feature name", "description": "Technical description", "sources": ["file"] }
    ],
    "uniqueCapabilities": ["Standout capabilities compared to typical alternatives"],
    "sources": ["files cited"]
  },
  "howItWorks": {
    "title": "How It Works",
    "architecture": "High-level architectural pattern and system design",
    "components": [
      { "name": "Component name", "purpose": "What this module does" }
    ],
    "dataFlow": "How data moves through the system",
    "dependencies": ["Core runtime dependencies identified"],
    "sources": ["files cited"]
  },
  "prerequisites": {
    "title": "Prerequisites",
    "runtimes": ["Required runtimes, e.g. Node.js >= 18"],
    "languageVersions": ["Required compiler or language versions"],
    "systemTools": ["Required external tools, e.g. Docker, Git, Make"],
    "environment": "OS compatibility or environment notes",
    "sources": ["files cited"]
  },
  "installation": {
    "title": "Installation Guide",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Step title",
        "command": "npm install (or exact shell command, or empty string if none)",
        "instructions": "Clear step instructions",
        "verification": "How to verify this step succeeded"
      }
    ],
    "sources": ["files cited"]
  },
  "configuration": {
    "title": "Configuration",
    "configFiles": ["Config files used by the project, e.g. .env.example"],
    "environmentVariables": [
      { "name": "VAR_NAME", "required": true, "description": "Purpose" }
    ],
    "setupNotes": "Key configuration notes",
    "sources": ["files cited"]
  },
  "usage": {
    "title": "Usage & Examples",
    "quickStart": "Primary quick-start instructions",
    "examples": [
      {
        "title": "Example title",
        "code": "Code or CLI snippet",
        "language": "javascript/bash/etc",
        "description": "Explanation of snippet"
      }
    ],
    "sources": ["files cited"]
  },
  "techStack": {
    "title": "Tech Stack",
    "languages": ["Primary programming languages"],
    "frameworks": ["Frameworks identified from manifests"],
    "primaryLibraries": ["Key libraries identified"],
    "infrastructure": ["Docker/CI/CD tools identified"],
    "sources": ["files cited"]
  },
  "limitations": {
    "title": "Limitations & Considerations",
    "documentedLimitations": ["Explicitly documented constraints or limitations"],
    "compatibilityNotes": "Known compatibility issues or OS constraints",
    "securityNotes": "Security practices, permissions, or caveats",
    "productionReadiness": "Current maturity and production readiness assessment",
    "sources": ["files cited"]
  },
  "alternatives": {
    "title": "Alternatives & Similar Projects",
    "similarProjects": [
      { "name": "Comparable tool", "comparison": "How this project compares" }
    ],
    "distinctions": "What distinguishes this project in the ecosystem",
    "sources": ["files cited"]
  },
  "resources": {
    "title": "Official Resources",
    "repositoryUrl": "${url}",
    "documentationUrl": "Official documentation URL if found in README/manifest, otherwise null",
    "issuesUrl": "${url}/issues",
    "releasesUrl": "${url}/releases",
    "sources": ["README.md"]
  }
}`;
}

export default {
  SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
};

