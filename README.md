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
├── tests/                    # 133 automated tests (node:test)
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

Run the built-in test suite (133 automated tests):

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
- `tests/translation.test.js`: Multi-language translation engine (EN/ID), schema preservation, and language switcher.
- `tests/pipeline.service.test.js`: Orchestrator named stages and error propagation.
- `tests/markdown.service.test.js`: Syntax highlighting and XSS sanitization.
- `tests/analysis.viewer.test.js`: 12-section fixed order, metadata display, copy actions, and deletion endpoint.
- `tests/history.storage.test.js`: LocalStorage validation, secret stripping, deduplication, quota handling, and clean URL deletion.
- `tests/mvp.validation.test.js`: Security boundaries, prompt injection isolation, and end-to-end flows.

---

## Changelog & Recent Updates (Catatan Pembaruan)

Berikut adalah rekapitulasi perbaikan dan pembaruan fitur terbaru:

### 1. Multi-Language Support (English 🇬🇧 & Bahasa Indonesia 🇮🇩) & Perbaikan Tombol Bahasa
- **Penempatan Ganda di Navbar & Toolbar:** Menambahkan dua tombol bendera (`🇬🇧 EN` default dan `🇮🇩 ID`) baik di navbar utama (`.app-header` bersebelahan dengan toggle tema `☀️ Light / 🌙 Dark`) maupun di toolbar subheader dokumen analisis (`.analysis-header-bar`). Posisi ini memastikan tombol bahasa selalu terlihat jelas, tidak terhalang, dan langsung dapat diakses baik pada desktop maupun mobile viewport.
- **Responsivitas Klik Instan (Zero-Lag & Non-Blocking):** Saat user mengklik bendera Indonesia (`🇮🇩 ID`), status aktif tombol, URL query parameter (`?lang=id`), dan `localStorage` langsung diperbarui secara instan. Dokumen langsung dialihkan ke Bahasa Indonesia menggunakan mesin penerjemahan klien seketika (0ms delay) tanpa menunggu pemanggilan jaringan AI yang lambat atau terkena rate limit, sementara penerjemahan AI backend tetap disinkronkan di latar belakang.
- **Pencegahan Masalah Klik (Pointer Events & Event Delegation):** Menambahkan `pointer-events: none` pada elemen teks/emoji anak tombol, menyematkan inline `onclick` langsung pada tombol, serta menyediakan fallback global `window.switchLanguage` di navbar sebelum modul JavaScript selesai di-hydrate, memastikan tombol bahasa dijamin 100% responsif saat diklik.
- **Dynamic Content Translation:** Seluruh 12 judul seksi dokumen (Ringkasan Repositori, Tujuan & Skenario Penggunaan, Fitur Utama, Cara Kerja, dsb.), tabel daftar isi (TOC), ringkasan naratif, penjelasan arsitektur, dan label tombol UI otomatis beralih rapi ke Bahasa Indonesia tanpa merusak struktur dokumen atau blok kode bash.
- **Cache Invalidation:** Parameter aset diperbarui ke `?v=gitex-v6` untuk mencegah browser menahan cache CSS/HTML lama.
- **Persistent Preference:** Preferensi bahasa pengguna tersimpan di `localStorage` dan otomatis diterapkan saat membuka kembali halaman.
- **Backend Translation Engine:** Endpoint `GET /api/analysis/:id/translate?lang=id` menggunakan `TranslationService` yang didukung Gemini AI dengan kamus istilah teknis offline sebagai fallback andal.

### 2. Penghapusan Bersih Analisis (Clean LocalStorage & Server Cache Deletion)
- **Pembersihan Menyeluruh di LocalStorage:** `GitExHistory.delete(idOrUrl)` dan `deleteByUrl(url)` membersihkan rekaman riwayat berdasarkan `id`, `url`, dan `fullName`, menjamin tidak ada data lama yang tertinggal di browser pengguna.
- **Pembersihan Cache Server:** Endpoint `DELETE /api/analysis/:id?url=...` dan `DELETE /api/analysis/all` otomatis menghapus entri dari memory cache (`analysisCache`) dan disk storage (`.data/analyses/*.json`).
- **Tombol Hapus di Halaman Analisis:** Ditambahkan tombol **Delete** (`Hapus`) langsung pada toolbar halaman detail analisis (`/analysis/:id`) selain tombol `✕` pada daftar riwayat di dashboard.

### 3. Jaminan Analisis Ulang Mulai dari Awal (Fresh Pipeline Execution)
- **Reset Tahap Analisis ke 0:** Saat menempelkan kembali URL repositori dan mengklik **Explain repository**, riwayat lokal untuk URL tersebut langsung dibersihkan sebelum stream dimulai, dan stepper progres di-reset bersih ke Tahap 1 (Validating) aktif dengan nomor 2–5 berstatus pending.
- **Bypass Cache HTTP ke Provider:** Pada `GitHubService` dan `GitLabService`, ditambahkan header `Cache-Control: no-cache, no-store, must-revalidate` dan opsi `cache: 'no-store'`, memastikan GitEx selalu menarik commit SHA terbaru, tree terbaru, dan README terbaru langsung dari GitHub/GitLab tanpa terhalang cache lama.
- **Pembersihan Cache Sebelum Pipeline Berjalan:** Pada endpoint analisis (`/api/analyze` dan `/api/analyze/stream`), cache lama untuk URL terkait langsung dibersihkan dari server sebelum proses dimulai.

### 4. Perbaikan Race Condition "Analysis Failed" pada SSE Stream
- Memperbaiki race condition penutupan koneksi Server-Sent Events (SSE) di mana event `error` native browser sempat terpanggil setelah event `complete` terkirim, yang sebelumnya sempat memunculkan kotak peringatan *"Analysis Failed"* tepat sebelum halaman diarahkan ke detail analisis.

### 5. Homepage Interaktif & Latar Belakang Animasi Vanta.js (Net)
- Endpoint root `/` kini menjadi landing page interaktif dengan wordmark GitEx, navigasi bersih, dan animasi jaring 3D dinamis menggunakan Vanta.js (Net mode) dengan palet warna selaras tema field notebook (`#0d0e0d` background dan `#c7f36b` citrus dots). Dashboard eksplorasi dipindahkan ke `/app`.

### 6. Perbaikan Scroll & Tata Letak Mobile
- Memperbaiki scroll lock pada halaman detail analisis dengan mengganti `overflow-x: hidden` di level `html` dan `body` menjadi `overflow-x: clip`, memisahkan drawer mobile dari scroll lock jendela utama, dan memperhalus navigasi Table of Contents (TOC).

### 7. Perbaikan Tata Letak Mobile & Masalah Padding/Margin "Offside" (Anti-Slop & Long Tokens)
- **Penyebab Masalah Offside:** Pada repositori seperti `miqdadbadjuber/anti-slop`, terdapat string dan URL yang sangat panjang tanpa spasi (misalnya: `curl -o antislop.md https://raw.githubusercontent.com/miqdadbadjuber/anti-slop/main/antislop.md`, link issues `https://github.com/miqdadbadjuber/anti-slop/releases`, path file `.claude-plugin/contrast-mcp-launcher.mjs`, dsb.). Kolom konten utama sebelumnya memiliki default `min-width: auto`, sehingga elemen string panjang tersebut memaksa lebar kolom melar melebihi viewport mobile (393px menjadi >700px), menyebabkan konten terpotong ke kanan dan margin/padding tampak sangat mepet ("offside").
- **Penerapan Rantai `min-width: 0;` (CSS Grid/Flexbox):** Menambahkan `min-width: 0; max-width: 100%; box-sizing: border-box;` pada seluruh rantai kontainer: `.analysis-workspace-grid`, `.analysis-document-column`, `.analysis-section`, `.section-body`, `.code-block-wrapper`, dan `.install-step-item`.
- **Pemotongan dan Pembungkusan Teks Otomatis (Word Breaking):**
  - Menambahkan `overflow-wrap: break-word; word-break: break-word;` pada semua elemen teks (`p`, `li`, `h1`-`h4`, `.section-body`).
  - Menambahkan `overflow-wrap: anywhere; word-break: break-all;` pada link `<a>` dan inline `<code>` agar URL panjang dapat patah baris secara alami.
  - Memastikan blok kode `<pre>` tetap dapat di-scroll horizontal secara independen (`overflow-x: auto`) tanpa memperlebar kontainer induk.
  - Menambahkan `overflow-wrap: anywhere; word-break: break-all; white-space: normal;` pada lencana sumber `.source-badge`.
- **Harmonisasi Padding Mobile:** Mengatur padding `.container`, `.analysis-workspace-grid`, dan `.analysis-section` secara proporsional dan seimbang di sisi kiri dan kanan pada resolusi mobile (`max-width: 768px` dan `max-width: 480px`), menjamin padding simetris dan rapi.
- **Cache Invalidation:** Parameter versi stylesheet diperbarui ke `?v=gitex-v7`.

---

## Documentation

Full project specifications are maintained in the [`docs/`](./docs) folder:
- [PRD.md](./docs/PRD.md): Product requirements & functional specifications.
- [DESIGN.md](./docs/DESIGN.md): Visual direction, tokens, and UX guidelines.
- [IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md): Story breakdown and delivery plan.
- [USER-STORIES.md](./docs/USER-STORIES.md): User stories and acceptance criteria.
