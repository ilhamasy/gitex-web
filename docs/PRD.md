# GitEx — Product Requirements Document (PRD)

**Version:** 1.1  
**Status:** MVP Planning  
**Platform:** Local-first Web Application  
**Runtime:** Node.js  
**Architecture:** Monolithic MVC  
**Storage:** Browser LocalStorage  
**Initial AI Provider:** Google Gemini API

## 1. Product Overview

### 1.1 Background
GitHub and GitLab host many useful open-source repositories. Understanding an unfamiliar repository often requires reading its README, inspecting dependencies and source code, finding installation instructions, and understanding its architecture. GitEx reduces that effort by turning a repository URL into a consistent, evidence-backed technical guide.

### 1.2 Product Vision
**GitEx — Understand Any Repository, Without Reading Everything.**

Users submit a public GitHub or GitLab repository URL and receive an AI-generated guide using a predefined 12-section template.

### 1.3 Objectives
- Accelerate understanding of open-source repositories.
- Produce consistent documentation regardless of repository category or technology.
- Help developers evaluate relevance and implementation effort.
- Provide verifiable prerequisites, installation steps, configuration, and examples.
- Keep MVP history local without accounts or a cloud database.

## 2. Target Users
- Software developers evaluating or adopting open-source tools.
- IT engineers exploring technologies and project architecture.
- IT Business Analysts understanding technical capabilities and use cases.
- Technology enthusiasts exploring GitHub/GitLab projects.
- Beginner developers learning open-source projects.

## 3. MVP Scope

### In Scope
- Public GitHub and GitLab repository URL input.
- URL/provider validation.
- Repository metadata, README, tree, manifest, and relevant source-file fetching.
- Repomix source-code processing.
- Gemini API integration with structured output.
- Consistent 12-section repository analysis.
- Markdown rendering, syntax highlighting, and copyable commands.
- Analysis status and error handling.
- Local analysis history using browser LocalStorage.
- Re-analysis and deletion of history.
- Responsive dashboard and analysis viewer.

### Out of Scope
- Authentication and multi-user support.
- External database and cloud synchronization.
- Private repositories.
- Automated trending discovery.
- Repository comparison.
- PDF export.
- Webhooks.
- Running repository code or install scripts.
- Chatbot / conversational repository Q&A.
- PageIndex as a required MVP dependency.

## 4. System Architecture

GitEx is a single Node.js MVC application. There is no separately deployed backend service and no external database. The Node.js server handles provider API calls, Repomix processing, AI orchestration, and secret management. Browser LocalStorage stores completed analysis records and user preferences.

### Architecture flow
1. Browser UI submits a repository URL to the Node.js application.
2. Controller validates the URL and detects GitHub or GitLab.
3. Provider service fetches metadata, README, repository tree, and file content.
4. Repomix processes selected source files into structured repository context.
5. Context builder prepares bounded input for the LLM.
6. Gemini generates structured analysis.
7. Schema validation checks all required sections and fields.
8. The UI renders the result and persists it in LocalStorage.

### Technology Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | JavaScript |
| Architecture | MVC monolith |
| Server | Express.js |
| Frontend | HTML, CSS, JavaScript |
| Styling | Tailwind CSS |
| Repository providers | GitHub REST API, GitLab API |
| Source processing | Repomix |
| AI provider | Google Gemini Developer API |
| Markdown | Marked.js |
| Syntax highlighting | Highlight.js |
| Persistent browser storage | LocalStorage |

### Architecture principles
- Keep the MVP in one Node.js project.
- Separate controllers, provider services, processing, and AI provider modules.
- Keep Gemini-specific code behind a provider interface.
- Do not persist raw repository source or full Repomix output in LocalStorage.
- Never expose API secrets to browser JavaScript.
- Do not execute repository code.

## 5. Functional Requirements

### FR-01 — Repository Input
Users can enter public GitHub or GitLab repository URLs.
- Detect provider from hostname.
- Validate URL and repository path.
- Reject unsupported hosts and malformed URLs.
- Preserve input after validation errors.
- Show actionable errors for inaccessible or missing repositories.

### FR-02 — Repository Fetching
Collect, where available:
- Repository name, owner, description, URL, provider.
- Default branch and analyzed revision/commit SHA.
- Primary language and language breakdown.
- Stars, forks, license, last updated.
- README content.
- Repository directory tree.
- Dependency manifests and relevant configuration files.
- Relevant source files.

Use GitHub/GitLab APIs for metadata and file retrieval. Repomix is responsible for bundling selected source code for analysis. Record source paths and revision for traceability.

### FR-03 — Repository Processing
Processing pipeline:
1. Fetch repository metadata and revision.
2. Retrieve README and repository tree.
3. Identify manifests and relevant files.
4. Apply ignore rules for generated, binary, vendor, build, and irrelevant files.
5. Process source using Repomix.
6. Build bounded context for the LLM.

Requirements:
- Run asynchronously from the user interaction perspective.
- Show named processing stages.
- Apply timeouts, file-count/size limits, and concurrency limits.
- Handle oversized repositories and partial failures gracefully.
- Do not execute repository scripts or binaries.

### FR-04 — AI Repository Analysis
Generate all 12 sections in a stable, validated JSON schema:

1. **Repository Overview** — what it is, problem solved, main goal.
2. **Purpose & Use Cases** — capabilities, target users, real-world scenarios.
3. **Key Features** — core features and unique capabilities.
4. **How It Works** — architecture, components, flow, and dependencies.
5. **Prerequisites** — runtime, language versions, tools, libraries, environment.
6. **Installation Guide** — documented steps, commands, setup, verification.
7. **Configuration** — config files, environment variables, API keys, setup.
8. **Usage & Examples** — commands, API examples, code examples.
9. **Tech Stack** — languages, frameworks, libraries, infrastructure.
10. **Limitations & Considerations** — documented limitations, compatibility, security and production caveats.
11. **Alternatives & Similar Projects** — comparable projects and grounded distinctions.
12. **Official Resources** — repository, official docs, releases, issues, website.

Output rules:
- All 12 sections must exist, even when some content is unavailable.
- Use “Not documented” or “Unable to verify” rather than inventing facts.
- Distinguish verified facts, reasonable inferences, and AI recommendations.
- Attach source paths or URLs to claims wherever possible.
- Do not fabricate commands, dependencies, versions, compatibility, or security findings.
- Validate output against a JSON schema before rendering.
- If a section fails, mark it as incomplete rather than claiming the analysis fully succeeded.

### FR-05 — Analysis Viewer
- Show repository identity and metadata.
- Show analyzed revision/commit SHA.
- Display all 12 sections in a fixed order.
- Provide table of contents / section navigation.
- Render Markdown and syntax-highlighted code.
- Provide copy actions for commands and code.
- Show source references near relevant claims.
- Link to the original repository.
- Allow re-analysis.

### FR-06 — Local Analysis History
Persist in LocalStorage:
- Analysis ID.
- Provider, repository owner/name, URL.
- Description and selected metadata.
- Analyzed revision/commit SHA.
- Analysis timestamp and status.
- Generated structured analysis.

Requirements:
- Reopen a previously completed analysis.
- Delete an individual record.
- Clear history with confirmation.
- Avoid duplicate records for the same repository revision unless user chooses to re-analyze.
- Handle storage quota errors.
- Do not store raw source bundles or Repomix output.

### FR-07 — AI Provider Configuration
- Use Gemini Developer API as the initial provider.
- Allow the user to configure an API key for local use.
- Keep API keys on the Node.js server side; do not expose them to browser code or persist them in LocalStorage.
- Support session/environment-based configuration.
- Handle invalid keys, rate limits, quota errors, timeouts, and provider failures.
- Keep provider integration abstract so another LLM can be added later.

## 6. User Journey
1. User opens GitEx dashboard.
2. User enters a public GitHub/GitLab URL.
3. User selects **Analyze Repository**.
4. GitEx validates the URL and identifies the provider.
5. GitEx fetches metadata, README, tree, manifests, and selected files.
6. Repomix processes relevant source code.
7. Gemini generates the 12-section analysis.
8. GitEx validates the output schema and source references.
9. User reads the generated guide.
10. GitEx stores the analysis in LocalStorage for later access.

### Processing statuses
Validating → Fetching → Processing → Analyzing → Generating → Completed / Failed.

Do not display fabricated percentage progress if the underlying work cannot report it.

## 7. UI/UX Requirements

### Dashboard
- GitEx identity and compact navigation.
- Prominent repository URL input.
- GitHub/GitLab provider recognition.
- Analyze action and validation feedback.
- Recently analyzed repository list.
- Empty state explaining the workflow.
- Theme preference if included in MVP.

### Analysis page
- Repository identity and metadata.
- Analysis revision.
- Fixed 12-section navigation.
- Documentation-first reading layout.
- Source references and code snippets.
- Copy command actions.
- Re-analyze and delete actions.

### UX principles
- Responsive desktop and mobile layout.
- Accessible keyboard interactions and visible focus.
- Clear loading, empty, success, partial, and error states.
- No fake metrics or unsupported claims.

## 8. Local Storage Data Model

Suggested key: `gitex.repositories`

Example record:
```json
{
  "id": "uuid",
  "provider": "github",
  "owner": "owner",
  "name": "repository",
  "url": "https://github.com/owner/repository",
  "revision": "commit-sha",
  "description": "Repository description",
  "language": "TypeScript",
  "analyzedAt": "ISO-8601 timestamp",
  "status": "completed",
  "analysis": {
    "overview": {},
    "purpose": {},
    "features": {},
    "howItWorks": {},
    "prerequisites": {},
    "installation": {},
    "configuration": {},
    "usage": {},
    "techStack": {},
    "limitations": {},
    "alternatives": {},
    "resources": {}
  }
}
```

Use a separate key such as `gitex.settings` for non-secret preferences. Never store Gemini API keys in LocalStorage. Consider IndexedDB only if LocalStorage proves insufficient; do not add a database server for MVP.

## 9. Suggested Project Structure

```text
gitex/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   │   ├── repository/
│   │   │   ├── github.service.js
│   │   │   ├── gitlab.service.js
│   │   │   └── repomix.service.js
│   │   ├── ai/
│   │   │   ├── ai.provider.js
│   │   │   └── gemini.provider.js
│   │   └── context/
│   ├── models/
│   ├── routes/
│   ├── views/
│   ├── prompts/
│   ├── validators/
│   └── app.js
├── public/
│   ├── css/
│   ├── js/
│   └── assets/
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 10. Non-Functional Requirements
- Single Node.js application; no separately deployed backend.
- No external database in MVP.
- Repository URL validation and SSRF protections.
- Restrict outbound network destinations to supported provider APIs and required services.
- Apply timeouts, payload limits, concurrency limits, and resource limits.
- Never execute untrusted repository code.
- Keep secrets server-side and out of logs.
- Sanitize rendered Markdown and treat repository content as untrusted input.
- Validate all AI output before rendering.
- Handle LocalStorage quota and malformed data.
- Ensure responsive and keyboard-accessible UI.

## 11. Acceptance Criteria
- Valid public GitHub and GitLab URLs are accepted.
- Invalid or unsupported URLs are rejected with clear feedback.
- Metadata and repository revision are captured when available.
- Repomix processes relevant files without executing repository code.
- Gemini returns all 12 required sections in the expected schema.
- Missing information is explicitly marked.
- Technical claims include source references where possible.
- Commands and code snippets can be copied.
- Analysis persists after browser refresh.
- Existing analyses can be reopened and deleted.
- API errors, rate limits, timeouts, and processing failures are handled.
- Oversized repositories do not crash the application.

## 12. Development Milestones
1. Project initialization, MVC structure, dashboard shell.
2. URL validation and GitHub/GitLab provider services.
3. Repository metadata, README, tree, and manifest fetching.
4. Repomix integration and context preparation.
5. Gemini integration, prompts, and schema validation.
6. Analysis viewer, Markdown rendering, and source references.
7. LocalStorage history and re-analysis.
8. Security review, tests, responsive QA, and MVP release.

## 13. Success Metrics
- All generated analyses contain the 12 required sections.
- Installation instructions are traceable to repository documentation or configuration.
- No fabricated repository metadata or undocumented commands.
- Users can reopen saved analyses after refresh.
- Failed processing does not create misleading completed records.
- Users can identify repository purpose, prerequisites, and installation path without manually reading the entire source tree.

## 14. Phase 2 — Repository Chatbot
Phase 2 introduces repository-aware chatbot and question answering over the indexed codebase.

PageIndex is **optional and not part of the MVP critical path**. For Phase 2, evaluate:
- Official [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex) as the first candidate.
- A custom Python tree-indexing/retrieval implementation only if the official implementation does not fit the repository/code use case or integration constraints.

Phase 2 evaluation should measure retrieval quality, source-path citations, answer grounding, latency, cost, and Node.js/Python integration. Do not build a custom PageIndex clone during MVP.

## 15. Final Product Definition
GitEx is a local-first, AI-powered GitHub/GitLab repository analyzer built as a Node.js MVC monolith. Users submit a public repository URL and receive a consistent, evidence-backed technical guide with 12 predefined sections. Repomix processes relevant source code, Gemini generates the analysis, and LocalStorage keeps the user's analysis history. PageIndex and repository chatbot capabilities are deferred to Phase 2.

**Core principle: One repository URL in, one consistent and comprehensive repository guide out.**
