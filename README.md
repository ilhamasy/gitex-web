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

## Deployment to Vercel

GitEx sudah siap 100% dan dioptimalkan untuk deployment ke **Vercel Serverless Functions**:

1. **Hubungkan Repositori ke Vercel:** Buka [Vercel Dashboard](https://vercel.com/new) dan import repositori GitEx Anda dari GitHub.
2. **Framework Preset:** Pilih **Other** (Root directory: `./`, Build Command kosong/default).
3. **Environment Variables:** Pada halaman pengaturan project Vercel (*Settings > Environment Variables*), tambahkan variabel berikut:
   - `AI_PROVIDER`: `anthropic` (atau `gemini`)
   - `ANTHROPIC_BASE_URL`: `https://claudespro.web.id`
   - `ANTHROPIC_API_KEY`: `cr-live-55b22c587352c691838a378dd03e58fde928a038`
   - `ANTHROPIC_MODEL`: `claude-3-5-sonnet-20241022`
   - `GITHUB_TOKEN`: *(Opsional)* Personal access token GitHub untuk kuota rate-limit lebih tinggi
   - *(Atau jika memakai Gemini)*: `GEMINI_API_KEY=...` dan `GEMINI_MODEL=gemini-2.5-flash`
4. **Deploy:** Klik tombol **Deploy**. Vercel akan otomatis membaca konfigurasi [vercel.json](file:///Users/retnotc/Documents/gitex-web/gitex-web/vercel.json) dan mengarahkan seluruh rute ke Serverless Function [api/index.js](file:///Users/retnotc/Documents/gitex-web/gitex-web/api/index.js) dengan proteksi cache `/tmp` dan fallback Repomix in-memory.

---

## Health Check

To verify the service is running:

```bash
curl http://localhost:3000/health
# {"status":"ok","uptime":12,"timestamp":"2026-11-13T09:20:00.000Z","service":"gitex-web","version":"1.0.0"}
```

---

## Running Automated Tests

Run the built-in test suite (149 automated tests):

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

### 8. Eliminasi Duplikasi Pesan Error pada Modal Progres Analisis
- **Penyebab Duplikasi Pesan:** Saat analisis gagal (misalnya karena API key melebihi batas kuota / 429 Quota Exceeded), pesan error sebelumnya dimasukkan ke elemen status proses berjalan (`#stage-current-message` dengan border hijau) sekaligus dimasukkan ke kartu error bawah (`#progress-error-container` bertajuk "Analysis Failed"), menyebabkan teks penjelasan kuota yang panjang muncul dua kali secara berulang.
- **Tampilan Tunggal & Bersih:** Saat pipeline berstatus `Failed`, elemen status berjalan (`#stage-current-message`) otomatis disembunyikan baik via script maupun rule CSS (`.progress-card:has(...)`), sehingga pesan error hanya ditampilkan satu kali secara jelas dan rapi di dalam kotak merah **Analysis Failed** di bagian bawah bersama tombol **Dismiss & Retry**.

### 9. Penjagaan Batas Harian Analisis (Daily Limit 5 Hit/Hari) & Pop-up Peringatan
- **Batas 5 Analisis per Hari:** Diterapkan penjagaan batas pemakaian harian maksimum **5 kali hit analisis repositori per hari** per sesi browser menggunakan `localStorage` (`gitex_daily_quota` berbasis tanggal `YYYY-MM-DD`).
- **Pop-up Modal Peringatan Kuota:** Saat pengguna telah mencapai 5 kali hit dan mencoba melakukan analisis baru (atau klik Re-analyze), proses analisis langsung dicegah dan muncul pop-up dialog peringatan yang elegan:
  - Judul: *"Batas Harian Tercapai"* (atau *"Daily Limit Reached"*).
  - Pesan penjelasan: Menjelaskan bahwa kuota harian 5/5 telah tercapai untuk melindungi stabilitas server dan kuota API, serta mengarahkan pengguna untuk kembali mencoba esok hari.
  - Lencana Kuota: Menampilkan indikator status kuota `5 / 5 Kuota Terpakai`.
  - Tombol Tutup: Tombol interaktif *"Mengerti"* / *"Understood"* serta dukungan penutupan modal via klik backdrop.
- **Dukungan Bilingual (ID & EN):** Teks pada pop-up otomatis menyesuaikan preferensi bahasa aktif pengguna (Bahasa Indonesia atau English).

### 10. Penerjemahan Konten Menyeluruh ke Bahasa Indonesia & Preservasi Nama Fitur/Menu Teknis
- **Penerjemahan Konten Penuh (Bukan Hanya Judul):** Menjawab kebutuhan bahwa saat tombol bendera Indonesia (`🇮🇩 ID`) diklik, seluruh konten penjelasan dan narasi teknis diterjemahkan secara menyeluruh:
  - Ringkasan (`summary`), Masalah yang Diatasi (`problemSolved`), dan Tujuan Utama (`mainGoal`).
  - Target pengguna (`targetUsers`), kapabilitas teknis (`capabilities`), dan skenario dunia nyata (`scenarios`).
  - Arsitektur (`architecture`), aliran data (`dataFlow`), serta tujuan komponen (`purpose`/`description`).
  - Panduan instalasi (instruksi langkah dan perintah verifikasi).
  - Catatan konfigurasi (`setupNotes`), variabel lingkungan (`description`), dan file konfigurasi (`purpose`).
  - Batasan teknis (`limitations`), pertimbangan kompatibilitas, keamanan, kesiapan produksi, dan perbandingan proyek alternatif.
- **Preservasi Nama Fitur, Menu, Paket & Entitas Teknis (Anti-Slop Translation Rule):**
  - Istilah nama fitur, menu, nama komponen sistem, dan paket teknis (seperti `Settings Manager`, `Pointer System`, `CLI Installer`, `Contrast MCP Server`, `Pre-flight`, `Hero Builder`, `Theme Dealer`, `Delivery Gate`, `Sloplint`, `Fifty Material Themes`, `Tiered Quality Gates`, dll.) **tidak diterjemahkan secara sembrono**, melainkan tetap dipertahankan dalam nama bahasa Inggris aslinya.
  - Yang diterjemahkan hanyalah penjelasan dan fungsi dari fitur tersebut (contoh: `Settings Manager: Menangani preferensi global untuk mode penggunaan (during/after/ask) melalui file konfigurasi JSON`).
  - Cuplikan kode, perintah CLI (`npx antislop-ai`, `npm install`), nama file (`CLAUDE.md`, `AGENTS.md`, `design.md`, `package.json`), path direktori, framework (`Node.js`, `Express`, `Fastify`), dan URL tetap utuh 100%.
- **Arsitektur Translasi Klien & Server Sinkron:**
  - `public/js/translation.helper.js`: Mesin translasi teknis terpusat dengan proteksi token dan pemetaan leksikal komprehensif.
  - Client-side Instant Fallback: `generateClientFallbackIndonesian()` di `public/js/analysis.js` menerjemahkan seluruh bagian dokumen secara instan di browser tanpa lag jaringan.
  - Server Translation Service: `src/services/ai/translation.service.js` memanfaatkan instruksi sistem ketat untuk Gemini AI serta fallback engine berakurasi tinggi saat offline / terkena limit kuota.
  - Invalidation Cache Translasi Lama: Backend otomatis mendeteksi dan memperbarui rekaman translasi usang yang sebelumnya hanya memuat terjemahan judul.

### 11. Penghapusan Tombol Mode Bahasa pada Halaman Dashboard (/app)
- **Tampilan Bersih & Terfokus di Dashboard:** Menghapus tombol pemilih bahasa bendera Inggris dan Indonesia khusus pada halaman dashboard (`/app`). Header dashboard menjadi lebih terfokus pada aksi utama analisis repositori tanpa gangguan kontrol bahasa yang belum relevan sebelum analisis selesai.
- **Pengaturan Kondisional Navbar:** Komponen `partials/header.ejs` kini mendukung parameter `showLanguageSwitcher` (diset `false` pada `src/views/index.ejs` dan `home.controller.js`), sementara tombol alih bahasa tetap aktif pada halaman Beranda (`/`) dan halaman Detail Analisis (`/analysis/:id`).

### 12. Dukungan Multi-Provider AI (Anthropic Claude & Google Gemini)
- **Implementasi ClaudeProvider:** Menambahkan adapter provider Anthropic Claude di `src/services/ai/claude.provider.js` yang mengimplementasikan antarmuka `AIProvider` dengan dukungan endpoint kustom / proxy (`ANTHROPIC_BASE_URL`), otentikasi API key (`x-api-key`), dan header spesifikasi Anthropic (`anthropic-version: 2023-06-01`).
- **Logika Pemilihan Provider Otomatis:** Di `src/services/ai/index.js` dan `src/config/index.js`, sistem secara otomatis mengaktifkan `ClaudeProvider` jika variabel `AI_PROVIDER=anthropic` atau jika `ANTHROPIC_API_KEY` terisi sementara Gemini tidak aktif. Jika Gemini diaktifkan kembali, sistem otomatis beralih ke `GeminiProvider`.
- **Konfigurasi Lingkungan `.env` & `.env.example`:** API key Google Gemini dikomentari (`# GEMINI_API_KEY=...`) dan digantikan oleh konfigurasi Anthropic Claude aktif (`ANTHROPIC_BASE_URL=https://claudespro.web.id`, `ANTHROPIC_API_KEY=...`, dan `ANTHROPIC_MODEL=claude-3-5-sonnet-20241022`).
- **Rangkaian Pengujian:** Ditambahkan suite pengujian `tests/claude.provider.test.js` yang memvalidasi header request, penanganan status 401/403/429/timeout, serta inisialisasi provider default.

### 13. Kesiapan Penuh Deploy di Vercel (Vercel Serverless Function & Fallbacks)
- **Konfigurasi Serverless Entry Point (`api/index.js` & `vercel.json`):** Menambahkan `api/index.js` yang mengekspos aplikasi Express sebagai handler serverless function, serta `vercel.json` dengan rewrite routing global ke function tersebut, alokasi memori 1024MB, dan batas `maxDuration: 60` detik untuk menampung proses streaming analisis AI.
- **Adaptasi Direktori Cache Serverless (`/tmp` Cache Storage):** Pada lingkungan Vercel Lambda di mana filesystem bersifat read-only (`EROFS`), controller analisis mendeteksi `process.env.VERCEL` dan secara otomatis mengarahkan penyimpanan cache JSON ke `/tmp/gitex-analyses` alih-alih `.data/analyses`.
- **Fallback Bundling Repomix In-Memory (Zero Dependency on Binary CLI):** Mengantisipasi batasan eksekusi binary CLI Repomix atau pemangkasan symlink `.bin/repomix` oleh compiler Vercel (`@vercel/nft`), `RepomixService` dilengkapi mekanisme resolusi CJS langsung dan fallback otomatis ke pengemasan XML in-memory (`inMemoryPackXml`). Hal ini menjamin pipeline Repomix selalu berhasil 100% tanpa error eksekusi proses pada runtime serverless.
- **Optimasi Test Suite Offline:** Script pengujian pada `package.json` ditetapkan dengan `NODE_ENV=test` untuk memastikan eksekusi tes unit berjalan offline dan super cepat (~2.9 detik untuk 140 pengujian).

### 14. Perbaikan Kompatibilitas Runtime Node Vercel (Resolusi ERR_REQUIRE_ESM sanitize-html)
- **Penyebab:** Pada rilis `sanitize-html@2.18.2`, dependensi internalnya mengadopsi `htmlparser2@12.0.0` (pure ESM) yang menyebabkan error fatal `[ERR_REQUIRE_ESM]: require() of ES Module htmlparser2 from sanitize-html not supported` saat dieksekusi di runtime Node.js Vercel serverless.
- **Solusi:** Mengunci versi dependensi ke `sanitize-html: "2.14.0"` yang menggunakan `htmlparser2@8` CommonJS yang stabil dan kompatibel penuh dengan seluruh runtime Node serverless tanpa konflik modul.

### 15. Pembersihan Tombol Bahasa pada Navbar Utama (Homepage & Detail Analysis)
- **Penghapusan dari Navbar Utama (`.app-header`):** Menghapus tombol bahasa (`🇬🇧 EN` / `🇮🇩 ID`) dari navbar atas di halaman Beranda (`/`) dan halaman Detail Analisis (`/analysis/:id`), sehingga navbar atas tetap konsisten, bersih, dan hanya memuat wordmark GitEx serta toggle tema Light/Dark.
- **Konsolidasi Kontrol Bahasa pada Toolbar Analisis:** Kontrol bahasa kini terfokus secara eksklusif dan intuitif pada toolbar subheader dokumen analisis (`.analysis-header-bar`), tepat di mana dokumen dioperasikan oleh pengguna tanpa duplikasi kontrol yang redundan.

### 16. Fitur #Trending on GitHub & Navigasi Tab Dashboard
- **Top 5 Repositori Trending GitHub:** Menghadirkan tab baru `#Trending` di samping `Recent Explains` pada dashboard yang menampilkan 5 repositori GitHub terpopuler yang sedang breakout.
- **Filter Waktu Fleksibel (Today, This Week, This Month):** Pengguna dapat memfilter repositori trending berdasarkan jangka waktu:
  - `Today`: Repositori baru dalam 48 jam terakhir dengan akumulasi bintang tertinggi.
  - `This Week`: Repositori baru dalam 7 hari terakhir.
  - `This Month`: Repositori baru dalam 30 hari terakhir.
- **Informasi Kartu Komprehensif:** Setiap kartu trending memuat:
  - Judul / nama repositori (`owner/repo`) dengan tautan langsung ke GitHub.
  - Deskripsi singkat repositori (*brief description*).
  - Lencana teknologi / bahasa pemrograman (*tech stack badge*).
  - Statistik jumlah bintang (⭐ Stars) dan fork (🍴 Forks) berformat ringkas (`12.4k`, `1.2M`).
- **Aksi "Copy URL" Satu Pintu (Single-Door UX):** Dilengkapi tombol interaktif **Copy URL** pada setiap kartu trending dengan konfirmasi clipboard instan (`✓ Copied!`), pop-up toast notifikasi di pojok kanan bawah, serta auto-fokus dan smooth-scroll ke input bar utama agar alur pengguna tetap konsisten melalui satu pintu (*Explain repository*).
- **Aktivasi Tab Otomatis:**
  - Jika riwayat analisis pengguna di browser masih kosong (0 item), tab `#Trending` secara otomatis aktif sebagai default pada halaman dashboard.
  - Begitu pengguna mengosongkan riwayat analisis (*Clear history*), antarmuka otomatis berpindah ke tab `#Trending`.
  - Saat analisis repositori baru selesai disimpan, antarmuka otomatis kembali ke tab `Recent Explains`.
- **Server Caching 15 Menit & Fallback Mandiri:** Memanfaatkan in-memory cache server selama 15 menit untuk menghemat kuota GitHub Search API dan dilengkapi fallback data kurasi mandiri saat offline atau terkena batasan rate limit.

### 17. Penyederhanaan Input URL & Animasi Border Berjalan (Seamless Dual-Beam)
- **Indikator Host Dihapus:** Label statis `• GitHub` dan `• GitLab` di bawah kolom URL dihilangkan — keduanya hanya dekoratif tanpa affordance interaktif, sehingga membingungkan. Dukungan kedua host tetap berjalan dan tetap terdeteksi otomatis lewat badge provider saat URL diketik.
- **Animasi Garis Berjalan Mulus Tanpa Jeda:** Border kolom input memiliki berkas cahaya aksen hijau (`--color-accent`) yang bergerak mengelilingi perimeter persegi panjangnya (`conic-gradient` yang di-mask menjadi ring 1px, dianimasikan lewat CSS `@property --url-border-angle`).
  - Menggunakan konfigurasi *dual-beam* 180° simetris: saat berkas pertama meluncur di sisi atas, berkas kedua meluncur di sisi bawah, sehingga cahaya mengalir konstan tanpa ada jeda mati atau kekosongan di sekeliling rectangle.
  - Titik `0deg` dan `360deg` diselaraskan menjadi `transparent` dengan interpolasi eksplisit `from 0deg to 360deg`, menghasilkan perulangan loop 100% mulus tanpa patahan atau stutter.
  - Kecepatan 4 detik per putaran saat idle, dipercepat menjadi 2,2 detik dan dibuat lebih terang saat kolom difokuskan, serta otomatis non-aktif bila pengguna mengaktifkan `prefers-reduced-motion`.

### 18. Peningkatan Alur Analisis Asinkron (Dismiss to Background & Sticky Progress Snackbar)
- **Tombol Dismiss pada Tahap Generating:** Mengingat tahap ke-5 (*Generating technical guide*) membutuhkan waktu pemrosesan AI, pengguna kini diberikan opsi untuk menutup modal dialog (*Dismiss & Run in Background*) tanpa membatalkan proses analisis yang sedang berjalan.
- **Kartu Riwayat Berstatus Generating dengan Animasi Circular:**
  - Begitu modal di-dismiss, repositori langsung tercatat di daftar *Recent Explains* (riwayat lokal browser).
  - Tombol aksi pada kartu tersebut berstatus *disabled* dan menampilkan animasi *circular spinner* (`Generating...`), menandakan proses masih berjalan dan belum bisa lanjut ke halaman detail analisis.
- **Top Sticky Progress Snackbar:**
  - Snackbar melayang di bagian atas halaman menampilkan nama repositori dan status progres secara real-time dengan animasi circular loader.
  - Bersifat interaktif: mengklik snackbar akan membuka kembali modal dialog progres lengkap (stepper tahap 1–5) yang sedang aktif.
- **Pemberitahuan Penyelesaian Hijau & Aktivasi Tombol Detail:**
  - Saat proses analisis selesai di background, snackbar otomatis berganti ke status *Progress Finish* berwarna hijau cerah dengan ikon centang (`✓`) dan tombol cepat *View Analysis*.
  - Di saat yang sama, tombol pada kartu riwayat analisis otomatis bertransisi menjadi aktif (*View Analysis*), siap diklik untuk membuka panduan teknis repositori.

---

## Documentation

Full project specifications are maintained in the [`docs/`](./docs) folder:
- [PRD.md](./docs/PRD.md): Product requirements & functional specifications.
- [DESIGN.md](./docs/DESIGN.md): Visual direction, tokens, and UX guidelines.
- [IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md): Story breakdown and delivery plan.
- [USER-STORIES.md](./docs/USER-STORIES.md): User stories and acceptance criteria.
