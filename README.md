# GitEx

> **Understand any repository without reading everything.**

GitEx is a local-first, developer-focused web application that analyzes open-source GitHub and GitLab repositories and produces a structured, evidence-backed 12-section technical guide.

---

## Architecture

GitEx is built as a single monolithic **Node.js MVC** application using Express.js and browser LocalStorage.

```text
gitex-web/
├── docs/                     # Product requirements, design system, user stories
│   ├── PRD.md
│   ├── DESIGN.md
│   ├── IMPLEMENTATION-PLAN.md
│   └── USER-STORIES.md
├── public/                   # Static client assets
│   ├── css/                  # Field notebook design system & typography
│   └── js/                   # Dashboard, viewer interactions & LocalStorage history
├── src/
│   ├── config/               # App configuration & environment parsing
│   ├── controllers/          # HTTP & SSE pipeline request handlers
│   ├── models/               # Domain models & 12-section canonical schema
│   ├── prompts/              # LLM system prompts & grounded analysis templates
│   ├── routes/               # Express routers (web views & API endpoints)
│   ├── services/             # Pipeline orchestration, GitHub/GitLab, Repomix, Gemini AI
│   │   ├── ai/               # Gemini Developer API provider & analysis generation
│   │   ├── pipeline/         # Named stages analysis pipeline orchestrator
│   │   ├── render/           # Markdown service & syntax highlighting with HTML sanitization
│   │   └── repository/       # GitHub/GitLab API fetchers, tree filtering & Repomix
│   ├── utils/                # Safe logger with automatic secret redaction
│   ├── validators/           # Strict URL validation, SSRF guards & JSON schema repair
│   ├── views/                # EJS server-rendered templates (dashboard & viewer)
│   ├── app.js                # Express app setup & middleware
│   └── server.js             # HTTP server entry point
├── tests/                    # 119 automated test suites (node:test)
├── .env.example              # Example environment configuration
├── .gitignore
├── package.json
└── README.md
```

---

## Key Features & Capabilities

- **Strict URL & Provider Validation (GITEX-003, GITEX-004):** Supports public GitHub (`github.com`) and GitLab (`gitlab.com`) repositories. Deep links and SSH URLs are automatically normalized to canonical HTTPS endpoints.
- **SSRF & Malicious Host Defenses (GITEX-004, GITEX-015):** Blocks cloud metadata IP addresses (`169.254.169.254`), loopback/localhost IPs, internal network ranges, URL credentials, and non-standard ports.
- **Repository Ingestion & Tree Filtering (GITEX-005, GITEX-006):** Retrieves metadata, commit SHA, primary languages, README, and directory trees. Classifies manifests, configs, docs, entrypoints, and source files while ignoring binaries, lockfiles, node_modules, vendor, and build artifacts.
- **Controlled Repomix Bundling (GITEX-007):** Packs relevant source files into structured XML context in isolated temporary sandboxes with strict timeouts (15s), directory traversal guards, and zero repository code execution.
- **AI Analysis Engine (GITEX-008, GITEX-009, GITEX-010):** Uses Google Gemini Developer API with a canonical 12-section schema, strict JSON generation, bounded retry for recovery, and source attribution.
- **Canonical 12-Section Analysis Viewer (GITEX-011):**
  1. Repository Overview
  2. Purpose & Use Cases
  3. Key Features
  4. How It Works
  5. Prerequisites
  6. Installation Guide
  7. Configuration
  8. Usage & Examples
  9. Tech Stack
  10. Limitations & Considerations
  11. Alternatives & Similar Projects
  12. Official Resources
- **Evidence Differentiation:** Visually separates verified facts with file source badges, inferred patterns (`.badge-inference`), recommendations (`.callout-recommendation`), and unverified sections.
- **Named Stages Stepper (GITEX-012):** Explicit sequential stages (`Validating` → `Fetching` → `Processing` → `Analyzing` → `Generating` → `Completed`) over Server-Sent Events (SSE) with no fake percentage bars.
- **Accessible Code Copying (GITEX-012):** One-click copy actions for syntax-highlighted code blocks with visible and screen-reader accessible confirmation.
- **Local History Engine (GITEX-013, GITEX-014):** Browser `LocalStorage` persistence storing analysis records without raw source code bundles or secrets. Handles schema validation on read, deduplication on re-analysis, and graceful pruning when storage quotas are exceeded.

---

## Getting Started

### Prerequisites

- **Node.js** (v20+ recommended, tested with v26)
- **npm** (v10+)

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your `.env` variables:
- `PORT`: HTTP port (defaults to `3000`)
- `NODE_ENV`: `development` or `production`
- `GEMINI_API_KEY`: Google Gemini Developer API key (obtain from [Google AI Studio](https://aistudio.google.com))
- `GEMINI_MODEL`: *(Optional)* Gemini model (defaults to `gemini-1.5-flash`)
- `GITHUB_TOKEN`: *(Optional)* GitHub personal access token for higher API rate limits
- `GITLAB_TOKEN`: *(Optional)* GitLab API token

> [!IMPORTANT]
> **Gemini Developer API Quota vs. Google AI Pro Subscription**:
> GitEx uses the **Google Gemini Developer API**. Please note that a consumer **Google One AI Premium / Google AI Pro subscription** (for gemini.google.com) does **not** grant Developer API quota or an API key. You must obtain an API key with Developer API quota through [Google AI Studio](https://aistudio.google.com).
>
> All API credentials remain strictly server-side on the Node.js application and are never sent to browser code, stored in LocalStorage, or logged.

### 3. Running Locally

Start the development server with live watch:

```bash
npm run dev
```

Or start for production:

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Health Check

To verify the service is running:

```bash
curl http://localhost:3000/health
# {"status":"ok","uptime":12,"timestamp":"2026-11-13T09:20:00.000Z","service":"gitex-web","version":"1.0.0"}
```

---

## Running Automated Tests

Run the built-in test suite (119 automated tests):

```bash
npm test
```

Test coverage includes:
- `tests/url.validator.test.js`: URL parsing, format rejection, and SSRF defenses.
- `tests/repository.service.test.js`: GitHub/GitLab normalization and security allowlisting.
- `tests/github.service.test.js` & `gitlab.service.test.js`: API fetching and error handling.
- `tests/tree-filter.service.test.js`: File filtering, ignore rules, and manifest selection.
- `tests/repomix.service.test.js`: Repomix packaging, directory traversal safety, and buffer guards.
- `tests/gemini.provider.test.js`: Gemini Developer API transport and quota/auth error mapping.
- `tests/analysis.service.test.js` & `analysis.validator.test.js`: 12-section schema, JSON repair, and bounded retries.
- `tests/pipeline.service.test.js`: Orchestrator named stages and error propagation.
- `tests/markdown.service.test.js`: Syntax highlighting and XSS sanitization.
- `tests/analysis.viewer.test.js`: 12-section fixed order, metadata display, and copy actions.
- `tests/history.storage.test.js`: LocalStorage validation, secret stripping, deduplication, and quota handling.
- `tests/mvp.validation.test.js`: Security boundaries, prompt injection isolation, and end-to-end flows.

---

## Documentation

Full project specifications are maintained in the [`docs/`](./docs) folder:
- [PRD.md](./docs/PRD.md): Product requirements & functional specifications.
- [DESIGN.md](./docs/DESIGN.md): Visual direction, tokens, and UX guidelines.
- [IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md): Story breakdown and delivery plan.
- [USER-STORIES.md](./docs/USER-STORIES.md): User stories and acceptance criteria.
