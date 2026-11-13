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
│   ├── css/
│   ├── js/
│   └── assets/
├── src/
│   ├── config/               # App configuration & environment parsing
│   ├── controllers/          # HTTP request handlers
│   ├── models/               # Domain models & schema definitions
│   ├── prompts/              # LLM system prompts & analysis templates
│   ├── routes/               # Express routers
│   ├── services/             # Repository fetching & AI orchestration
│   ├── validators/           # Input validation & schema checking
│   ├── views/                # EJS server-rendered templates
│   ├── app.js                # Express app setup & middleware
│   └── server.js             # HTTP server entry point
├── tests/                    # Automated test suites (node:test)
├── .env.example              # Example environment configuration
├── .gitignore
├── package.json
└── README.md
```

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

## Running Tests

Run the built-in test suite:

```bash
npm test
```

---

## Documentation

Full project specifications are maintained in the [`docs/`](./docs) folder:
- [PRD.md](./docs/PRD.md): Product requirements & functional specifications.
- [DESIGN.md](./docs/DESIGN.md): Visual direction, tokens, and UX guidelines.
- [IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md): Story breakdown and delivery plan.
- [USER-STORIES.md](./docs/USER-STORIES.md): User stories and acceptance criteria.

