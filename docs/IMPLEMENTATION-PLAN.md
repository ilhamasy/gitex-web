# GitEx — Implementation Plan

**Version:** 1.0  
**Source:** GitEx PRD v1.1 and DESIGN.md  
**Delivery approach:** Incremental MVP, story-driven  
**Estimation:** Relative Fibonacci Story Points (1, 2, 3, 5, 8)  
**Status:** Planned — no implementation has started

## 1. Delivery strategy

Build GitEx as a single Node.js MVC application. Deliver a thin, working vertical slice early, then expand repository ingestion, AI analysis, documentation rendering, and local history.

The MVP is a structured repository analyzer, not a chatbot. PageIndex and repository-aware Q&A are Phase 2 and must not block MVP delivery.

## 2. MVP phases

| Phase | Goal | Stories |
|---|---|---|
| 1 — Foundation & Dashboard | Establish the Node.js MVC app and repository input experience | GITEX-001 to GITEX-003 |
| 2 — Repository Ingestion | Validate providers and fetch reliable repository context | GITEX-004 to GITEX-006 |
| 3 — AI Analysis Pipeline | Process source context and generate validated 12-section analysis | GITEX-007 to GITEX-010 |
| 4 — Analysis Experience | Render useful documentation and provide copy/navigation actions | GITEX-011 to GITEX-012 |
| 5 — Local History & Hardening | Persist analysis locally and complete security/reliability checks | GITEX-013 to GITEX-015 |

## 3. Story dependency map

- GITEX-001 is the foundation for all application stories.
- GITEX-002 and GITEX-003 establish the dashboard and input flow.
- GITEX-004 depends on the application foundation and URL input.
- GITEX-005 depends on provider validation and repository access.
- GITEX-006 depends on repository metadata/tree retrieval.
- GITEX-007 depends on source processing and context selection.
- GITEX-008 depends on Gemini configuration and the analysis schema.
- GITEX-009 depends on the prompt, provider, and schema validation.
- GITEX-010 depends on completed analysis output and source metadata.
- GITEX-011 depends on the validated analysis contract.
- GITEX-012 depends on the analysis viewer.
- GITEX-013 depends on the analysis record model and viewer.
- GITEX-014 depends on LocalStorage history.
- GITEX-015 validates the integrated MVP and addresses security/reliability requirements.

## 4. Suggested implementation order

1. Initialize project structure, configuration, linting, and tests.
2. Build dashboard shell and repository URL form.
3. Implement URL validation and provider detection.
4. Fetch GitHub/GitLab metadata, README, and repository tree.
5. Select relevant files and process source using Repomix.
6. Configure Gemini provider and API-key handling.
7. Define structured 12-section schema and prompt.
8. Generate, validate, and repair/mark incomplete AI output.
9. Render the analysis document with citations/source paths.
10. Add copy actions, navigation, and progress/error states.
11. Save, reopen, delete, and re-analyze LocalStorage records.
12. Run integration, security, responsive, and accessibility checks.

## 5. Definition of Ready

A story is ready to start when:
- Its summary and user story are understood.
- Dependencies are completed or explicitly available.
- Expected behavior and acceptance criteria are testable.
- Required provider/API assumptions are known.
- No unresolved decision blocks implementation.

## 6. Definition of Done

A story is done when:
- Acceptance criteria pass.
- Relevant automated tests are added or updated.
- Errors and loading/empty states are handled where applicable.
- No secrets are exposed to browser code or committed to source control.
- UI changes follow DESIGN.md and the Anti-Slop workflow.
- Documentation/configuration is updated when needed.
- Code review and the relevant validation checks are complete.

## 7. Scope guardrails

- One Node.js MVC application; no separately deployed backend.
- No external database, authentication, or cloud sync in MVP.
- LocalStorage stores analysis metadata and generated output, not raw source bundles.
- GitHub and GitLab public repositories are the initial scope.
- Repomix is used for source-code processing.
- Gemini Developer API is the initial LLM integration; a Google AI Pro subscription does not itself imply Developer API quota.
- PageIndex is optional and excluded from MVP.
- Phase 2 may evaluate official VectifyAI/PageIndex or a custom Python indexing approach for repository chatbot/Q&A.
- Never execute repository code or installation scripts.

## 8. Phase 2 — Separate roadmap

Not included in MVP story points or MVP acceptance:
- Repository-aware chatbot and question answering.
- PageIndex or custom Python tree indexing/retrieval.
- Retrieval evaluation, source-path citations, and conversational context.
- Chat-specific latency, cost, and indexing lifecycle.

Phase 2 should begin only after the MVP analysis pipeline produces reliable repository context and source references.
