# GitEx — MVP User Stories

**Version:** 1.0  
**Source:** GitEx PRD v1.1 and DESIGN.md  
**Estimation:** Fibonacci Story Points (1, 2, 3, 5, 8)  
**Status:** Planned — all stories are not started

> Story points estimate relative effort, complexity, and uncertainty. They are not hours or calendar days. Acceptance criteria define the expected outcome.

## Phase 1 — Foundation & Dashboard

### GITEX-001 — Initialize Node.js MVC Application

**Summary**  
Set up the GitEx monolithic Node.js application with a clear MVC structure and local development workflow.

**User Story**  
As a developer, I want a structured Node.js MVC project, so that I can build and maintain GitEx features in clearly separated modules.

**Points:** 3

**Acceptance Criteria**
- Express application starts using documented commands.
- Controllers, services, models, routes, views, config, and public assets have clear locations.
- Environment configuration uses an example file and secrets are excluded from version control.
- Basic error handling and health endpoint are available.
- Test runner and basic test command are configured.
- README explains setup and local execution.

### GITEX-002 — Build GitEx Dashboard Shell

**Summary**  
Create the main dashboard layout and navigation based on DESIGN.md.

**User Story**  
As a user, I want a clean developer-focused GitEx dashboard, so that I can quickly start analyzing a repository and access my recent analyses.

**Points:** 5

**Acceptance Criteria**
- GitEx branding and compact navigation are visible.
- Repository URL input is the primary dashboard action.
- Recent analysis area has a useful empty state.
- Layout is responsive on mobile and desktop.
- Typography, palette, spacing, and component styling follow DESIGN.md.
- UI implementation follows the Anti-Slop workflow and Delivery Gate.
- No fake metrics, testimonials, or decorative feature grids are shown.

### GITEX-003 — Submit and Validate Repository URL in UI

**Summary**  
Build the repository URL input interaction, including client-side format feedback and submission/loading states.

**User Story**  
As a user, I want to enter a GitHub or GitLab repository URL and receive clear validation feedback, so that I know whether the repository can be analyzed.

**Points:** 3

**Acceptance Criteria**
- User can submit using the Analyze button or Enter.
- Input value remains available when validation fails.
- Empty and malformed URLs show clear feedback.
- Loading and disabled states prevent accidental duplicate submissions.
- The UI displays the provider detected by the server or validation layer.
- Server-side validation remains authoritative.

## Phase 2 — Repository Ingestion

### GITEX-004 — Validate Repository URL and Detect Provider

**Summary**  
Implement server-side URL parsing, allowlisting, and GitHub/GitLab provider detection.

**User Story**  
As a user, I want GitEx to validate the repository URL and identify its provider, so that the correct repository integration is used safely.

**Points:** 3

**Acceptance Criteria**
- Supports public GitHub and GitLab repository URL formats.
- Normalizes supported URL forms without changing repository identity.
- Rejects unsupported hosts, malformed paths, and invalid repository URLs.
- Prevents SSRF by restricting outbound requests to approved provider hosts and safe URL patterns.
- Does not trust client-supplied provider identifiers.
- Unit tests cover valid, invalid, and malicious URL cases.

### GITEX-005 — Fetch Repository Metadata and README

**Summary**  
Retrieve repository metadata and README through the relevant GitHub/GitLab provider API.

**User Story**  
As a user, I want GitEx to retrieve repository metadata and its README, so that the analysis starts with authoritative project information.

**Points:** 5

**Acceptance Criteria**
- GitHub public repositories can be queried.
- GitLab public repositories can be queried.
- Captures repository name, owner, description, URL, default branch, revision/commit SHA when available, languages, stars/forks, license, and last updated where supported.
- Retrieves README content when present.
- Missing or unavailable fields are represented explicitly.
- Handles not found, rate limit, timeout, and provider errors.
- Provider-specific logic remains isolated in provider services.

### GITEX-006 — Retrieve Repository Tree and Relevant Files

**Summary**  
Retrieve the repository directory tree and identify files useful for understanding the project.

**User Story**  
As a user, I want GitEx to inspect the repository structure and important configuration files, so that the AI can understand how the project is organized and installed.

**Points:** 5

**Acceptance Criteria**
- Retrieves repository tree for the analyzed revision where provider APIs allow it.
- Identifies dependency manifests, lockfiles, environment examples, build/config files, and relevant source files.
- Excludes binary files, generated artifacts, vendor folders, build outputs, and irrelevant large files.
- Applies configurable file-count and size limits.
- Preserves file paths and revision metadata for traceability.
- Handles missing README or partial tree retrieval without crashing.

## Phase 3 — AI Analysis Pipeline

### GITEX-007 — Process Source Code with Repomix

**Summary**  
Integrate Repomix to bundle selected repository source files into bounded context for AI analysis.

**User Story**  
As a user, I want GitEx to process relevant source files into a structured repository context, so that the AI can explain the project beyond what its README says.

**Points:** 5

**Acceptance Criteria**
- Repomix runs from the Node.js application using a controlled process invocation.
- Only files selected by the ingestion stage are included.
- Exclusion rules and size limits are applied.
- Process timeout, output size, and process errors are handled.
- Repository code is never executed.
- Raw Repomix output is not persisted in LocalStorage.
- Output retains source paths or file references where possible.

### GITEX-008 — Configure Gemini API Provider

**Summary**  
Implement Gemini Developer API integration and secure server-side configuration.

**User Story**  
As a user, I want GitEx to connect to Gemini using my configured API credentials, so that repository context can be analyzed by an LLM.

**Points:** 3

**Acceptance Criteria**
- Gemini provider is implemented behind a provider interface.
- API key is read server-side from environment or secure local configuration.
- API key is never sent to browser JavaScript, stored in LocalStorage, or written to logs.
- Model selection is configurable.
- Invalid key, quota, rate limit, timeout, and provider errors are handled.
- Documentation distinguishes Google AI Pro subscription from Gemini Developer API billing/quota.

### GITEX-009 — Define Analysis Template and Generate Structured Output

**Summary**  
Create the canonical 12-section analysis schema and prompts, then generate repository documentation through Gemini.

**User Story**  
As a user, I want every analyzed repository to follow the same 12-section template, so that I can understand and compare projects consistently.

**Points:** 8

**Acceptance Criteria**
- Schema includes Repository Overview, Purpose & Use Cases, Key Features, How It Works, Prerequisites, Installation Guide, Configuration, Usage & Examples, Tech Stack, Limitations & Considerations, Alternatives & Similar Projects, and Official Resources.
- All sections are present in every result.
- Prompt includes repository metadata and bounded source context.
- AI distinguishes verified facts, inferences, and recommendations.
- Missing information is marked Not documented or Unable to verify.
- Commands, versions, compatibility, and security claims must not be invented.
- Relevant claims include source path or URL references where possible.
- Output is returned in machine-validated structured JSON.

### GITEX-010 — Validate AI Output and Handle Incomplete Analysis

**Summary**  
Validate generated JSON against the schema and handle malformed, missing, or partial AI responses.

**User Story**  
As a user, I want GitEx to validate AI-generated analysis before displaying it, so that I receive a consistent guide and can identify incomplete sections.

**Points:** 5

**Acceptance Criteria**
- JSON parsing and schema validation run before rendering.
- Missing required sections are identified.
- Invalid output is retried or repaired within a bounded retry policy.
- Unrecoverable sections are marked incomplete rather than fabricated.
- Processing status accurately distinguishes completed, partially completed, and failed results.
- Provider errors and validation errors are logged safely without secrets.
- Automated tests cover valid, malformed, incomplete, and unexpected model output.

## Phase 4 — Analysis Experience

### GITEX-011 — Build Repository Analysis Viewer

**Summary**  
Render the validated analysis as a readable technical document with metadata and section navigation.

**User Story**  
As a user, I want to read the repository analysis in a structured documentation view, so that I can quickly find the information relevant to my evaluation or implementation.

**Points:** 5

**Acceptance Criteria**
- Repository identity and available metadata are displayed.
- Analyzed revision/commit SHA is displayed when available.
- All 12 sections appear in a fixed order.
- Table of contents or section navigation is available.
- Markdown is rendered safely with HTML sanitization.
- Code blocks have syntax highlighting.
- Source references appear close to supported claims.
- Facts, inferences, and recommendations are visually distinguishable.
- Responsive layout follows DESIGN.md.

### GITEX-012 — Add Copy Actions and Analysis Progress/Error States

**Summary**  
Provide copy interactions for commands/code and clear feedback throughout the analysis lifecycle.

**User Story**  
As a user, I want to copy installation commands and understand the current analysis status, so that I can use the guide and recover from failures confidently.

**Points:** 3

**Acceptance Criteria**
- Copy action is available for relevant code and command blocks.
- Copy success and failure feedback is visible and accessible.
- Processing stages include Validating, Fetching, Processing, Analyzing, Generating, Completed, and Failed.
- No fabricated percentage progress is displayed.
- Errors explain the cause when known and provide retry or recovery guidance.
- Incomplete analysis is not presented as fully successful.

## Phase 5 — Local History & Hardening

### GITEX-013 — Persist Analysis History in LocalStorage

**Summary**  
Save analysis records and user preferences in browser LocalStorage without storing raw repository bundles or secrets.

**User Story**  
As a user, I want my analyzed repositories to remain available after refreshing the browser, so that I can revisit previous research without running analysis again.

**Points:** 5

**Acceptance Criteria**
- Completed analysis records are saved with unique IDs.
- Stored fields include provider, repository identity, URL, revision, timestamp, status, metadata, and structured analysis.
- Raw source code and Repomix output are not stored.
- Gemini API key is not stored.
- Stored records are validated before being read or rendered.
- Quota exceeded and corrupted data errors are handled gracefully.
- History remains available after browser refresh in the same browser profile.

### GITEX-014 — Manage History and Re-analyze Repository

**Summary**  
Allow users to reopen, delete, clear, and re-analyze saved repository records.

**User Story**  
As a user, I want to manage my analysis history and re-analyze a repository when it changes, so that my saved research stays useful.

**Points:** 3

**Acceptance Criteria**
- User can open an existing analysis from history.
- User can delete one analysis record.
- Clear-all action requires confirmation.
- User can re-run analysis for a saved repository.
- Re-analysis records the new revision and timestamp.
- Duplicate repository/revision behavior is deterministic and documented.
- Empty history state is displayed when no records exist.

### GITEX-015 — MVP Security, Integration, and UX Validation

**Summary**  
Validate the complete MVP against security, reliability, accessibility, responsive behavior, and acceptance criteria.

**User Story**  
As a user, I want GitEx to analyze repositories reliably and safely, so that I can trust the generated guide and use the application without unexpected failures.

**Points:** 5

**Acceptance Criteria**
- End-to-end flow works for representative public GitHub and GitLab repositories.
- SSRF protections, host allowlisting, input validation, timeout, payload, and concurrency limits are tested.
- Repository content is treated as untrusted input and cannot override system instructions.
- No repository code or install scripts are executed.
- Secrets are not exposed in frontend assets, logs, or committed files.
- Markdown output is sanitized against script injection.
- API failures, rate limits, oversized repositories, and partial processing are tested.
- Keyboard access, visible focus, contrast, and reduced motion are reviewed.
- Phone, tablet, laptop, and wide desktop layouts are checked.
- Anti-Slop Delivery Gate is completed for UI work.
- README and setup instructions reflect the final MVP.

## Story point summary

| Story | Summary | Points |
|---|---|---:|
| GITEX-001 | Initialize Node.js MVC Application | 3 |
| GITEX-002 | Build GitEx Dashboard Shell | 5 |
| GITEX-003 | Submit and Validate Repository URL in UI | 3 |
| GITEX-004 | Validate Repository URL and Detect Provider | 3 |
| GITEX-005 | Fetch Repository Metadata and README | 5 |
| GITEX-006 | Retrieve Repository Tree and Relevant Files | 5 |
| GITEX-007 | Process Source Code with Repomix | 5 |
| GITEX-008 | Configure Gemini API Provider | 3 |
| GITEX-009 | Define Analysis Template and Generate Structured Output | 8 |
| GITEX-010 | Validate AI Output and Handle Incomplete Analysis | 5 |
| GITEX-011 | Build Repository Analysis Viewer | 5 |
| GITEX-012 | Add Copy Actions and Analysis Progress/Error States | 3 |
| GITEX-013 | Persist Analysis History in LocalStorage | 5 |
| GITEX-014 | Manage History and Re-analyze Repository | 3 |
| GITEX-015 | MVP Security, Integration, and UX Validation | 5 |
| **Total** | **15 MVP stories** | **66** |

## Phase 2 — Not included in MVP estimate

Potential future stories:
- Repository chatbot conversation UI.
- PageIndex evaluation and integration OR custom Python indexing prototype.
- Repository tree indexing and retrieval.
- Source-grounded Q&A with file path/line citations.
- Conversation context and follow-up questions.
- Retrieval quality, latency, and cost evaluation.

These stories should be estimated after the MVP and Phase 2 technical discovery.