# CLAUDE.md — CV Optima Builder

This file provides guidance for AI assistants working in this codebase.

---

## Project Overview

**CV Optima** is an AI-powered CV (resume) analysis SPA deployed on Vercel at `https://cvoptima.vercel.app`. Users upload their CV (PDF or DOCX), optionally provide a job description, and receive an AI-generated analysis with scoring, suggestions, keyword matching, cover letter generation, and interview prep questions.

The stack is intentionally simple: static HTML/CSS/JS frontend + Vercel serverless functions in `api/`. No build step, no framework. The backend calls Anthropic's Claude API.

---

## Repository Structure

```
/
├── index.html              # Main SPA entry point (732 lines)
├── script.js               # All frontend app logic (1,800+ lines)
├── style.css               # All styling (1,800+ lines)
├── server.js               # Local Express dev server (port 3000)
├── auth-manager.js         # Firebase auth wrapper (mock mode active)
├── storage-manager.js      # CV version history via localStorage
├── pricing.html            # Pricing page
├── sample-cv-data.ts       # TypeScript interface for CV data model
│
├── api/                    # Vercel serverless functions (Node.js)
│   ├── analyze.js          # POST /api/analyze — core CV analysis
│   ├── coverletter.js      # POST /api/coverletter — cover letter generation
│   ├── generate-bullet.js  # POST /api/generate-bullet — resume bullet generation
│   ├── extract-pdf.js      # POST /api/extract-pdf — server-side PDF fallback
│   ├── optimize-section.js # POST /api/optimize-section — section-level tuning
│   ├── scoring.js          # Scoring calibration logic (pure functions)
│   ├── models.js           # GET /api/models — available AI models
│   ├── health.js           # GET /api/health — health check
│   ├── log-client-error.js # POST /api/log-client-error — client error ingestion
│   └── utils.js            # Shared: rate limiting, Claude API calls, sanitization
│
├── js/                     # Frontend JS modules (loaded via <script> in index.html)
│   ├── api.js              # Client-side fetch wrappers for all /api/* endpoints
│   ├── file-processor.js   # PDF (pdf.js) and DOCX (mammoth.js) text/image extraction
│   ├── analyzer.js         # Local CV heuristics: word count, action verbs, sections
│   └── ui-helpers.js       # DOM helpers
│
├── tests/                  # Playwright E2E tests + Node test runner scoring tests
│   ├── smoke.spec.js
│   ├── analyze-mock.spec.js
│   ├── cv-download.spec.js
│   ├── dragdrop.spec.js
│   ├── pdf-extract.spec.js
│   ├── ui.spec.js
│   ├── scoring-calibration.test.js   # 25-case scoring validation
│   ├── scoring-benchmark.test.js     # Performance benchmarks
│   └── fixtures/
│
├── scripts/
│   ├── release.sh
│   └── run-scoring-benchmark.js
│
├── .github/workflows/
│   ├── playwright.yml      # Deploy gate: runs on push/PR to main
│   └── smoke.yml           # Daily 02:00 UTC production smoke test
│
├── vercel.json             # Vercel deployment config
├── playwright.config.js    # Playwright config (Chromium, port 3000)
├── package.json
└── .env.example            # Template for required env vars
```

---

## Development Workflow

### Starting the Local Server

```bash
node server.js
```

Serves the app at `http://127.0.0.1:3000`. The Express server proxies API calls and applies in-memory caching (1 hour TTL) and throttling (1 request/second to Claude).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
CLAUDE_API_KEY=<Anthropic API key>
PORT=3000                        # optional, defaults to 3000
```

The `CLAUDE_API_KEY` is required — all backend functions call the Claude API via `api/utils.js:callClaude()`.

### Running Tests

```bash
# Full deploy gate (run before pushing to main)
npm run test:gate

# Scoring unit tests only (fast, no browser)
npm run test:scoring

# All Playwright E2E tests
npm run test:ui

# Production smoke test
npm run test:smoke:prod
```

**`test:gate`** is the canonical pre-push check. It runs:
1. `test:scoring` — Node test runner against scoring-calibration and scoring-benchmark
2. Playwright tests: smoke, dragdrop, pdf-extract, analyze-mock, cv-download (Chromium only)

Tests require the local server to be running (Playwright config starts it automatically via `webServer`).

### Deployment

Deployment is automatic on push to `master` via Vercel GitHub integration. No build step is needed — Vercel picks up the `api/` directory as serverless functions and serves everything else as static files.

Manual deploy:
```bash
npx vercel --prod --yes
```

---

## Architecture & Key Conventions

### Frontend

- **No framework, no bundler.** Plain HTML, CSS, and ES module-style JS files loaded via `<script>` tags. Do not introduce React, Vue, webpack, etc.
- **`script.js` is the app shell.** It orchestrates UI state, event listeners, and calls into `js/api.js`. Keep feature logic in dedicated modules under `js/` where possible.
- **Third-party libraries via CDN only:** `pdf.js` (v3.11.174), `mammoth.js`. Do not add npm frontend dependencies; they won't be bundled.
- **localStorage for persistence.** `storage-manager.js` manages CV version history (up to 10 versions per CV, 5 CVs max). There is no database. Auth state is mocked.
- **File processing is client-side first.** `js/file-processor.js` extracts text and images in the browser using pdf.js and mammoth.js. The `POST /api/extract-pdf` endpoint is a fallback for when browser extraction fails.

### Backend (Vercel Serverless Functions)

- **All functions in `api/`** follow the Vercel function signature: `(req, res) => {}`.
- **Shared utilities live in `api/utils.js`:**
  - `callClaude(prompt, model, maxTokens)` — wraps the Claude API call
  - `checkRateLimit(req, res, limit, windowSec)` — per-IP rate limiting (in-memory)
  - `sanitizeInput(input, maxLen)` — always sanitize user text before sending to Claude
  - `parseClaudeJson(rawText)` — robustly parses JSON from Claude responses
- **Every API function must call `sanitizeInput`** on user-supplied CV and job description text before passing it to `callClaude`.
- **Rate limits:** Most endpoints are capped at 60 requests/minute/IP. Health and models endpoints allow 120/min. Enforce these at the top of each handler using `checkRateLimit`.
- **CORS:** All endpoints respond to `OPTIONS` preflight and include `Access-Control-Allow-Origin: *` headers. See any existing `api/*.js` for the pattern.

### Scoring System

`api/scoring.js` contains pure calibration logic (no I/O). The main function `calibrateScores(rawScore, rubric, riskFlags, cvText, jdText)` adjusts the raw Claude score using heuristics:
- Experience year estimation vs. JD requirements
- Risk flag penalties
- Rubric dimension weights

Scoring tests in `tests/scoring-calibration.test.js` cover 25 labeled cases. **Any change to scoring logic must pass all 25 cases before merging.**

### AI Model Usage

- The `GET /api/models` endpoint currently returns only **Claude 3 Haiku** as the available model.
- `api/utils.js:callClaude()` accepts a `model` parameter. Default in `server.js` is `claude-opus-4-1`.
- When adding new Claude-powered features, use `callClaude` from `api/utils.js` — do not create new Anthropic client instances.
- Always ask Claude for **JSON output** and parse with `parseClaudeJson` for resilience against markdown fences and whitespace.

---

## API Reference

| Method | Path | Rate Limit | Description |
|--------|------|-----------|-------------|
| GET | `/api/health` | 120/min | Health check |
| GET | `/api/models` | 120/min | List available AI models |
| POST | `/api/analyze` | 60/min | Full CV analysis |
| POST | `/api/coverletter` | 60/min | Generate cover letter |
| POST | `/api/generate-bullet` | 60/min | Generate resume bullet point |
| POST | `/api/optimize-section` | 60/min | Optimize a CV section |
| POST | `/api/extract-pdf` | 60/min | Server-side PDF text extraction |
| POST | `/api/log-client-error` | — | Log client-side errors |

### `POST /api/analyze` — Request/Response

```json
// Request
{
  "cvText": "string (required)",
  "jdText": "string (optional)",
  "model": "string (optional, defaults to claude-haiku-3)",
  "cvImages": ["base64 JPEG string", "..."] // optional, up to 3 pages
}

// Response
{
  "score": 72,
  "jdScore": 65,
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "rubric": {
    "mustHaveCoverage": 80,
    "experienceRelevance": 70,
    "impactEvidence": 60,
    "roleSpecificity": 75,
    "writingClarity": 85
  },
  "riskFlags": ["string"],
  "suggestions": [{ "title": "", "recommendation": "", "evidence": "", "priority": "high|medium|low" }],
  "missingKeywords": ["string"],
  "interviewQuestions": [{ "type": "string", "text": "string" }]
}
```

---

## Data Model

The CV data structure is defined in `sample-cv-data.ts`:

```typescript
interface CvData {
  personalInfo: { fullName, jobTitle, email, phoneNumber, address, website, linkedin, github }
  summary: string
  workExperience: { id, jobTitle, company, location, startDate, endDate, responsibilities: string[] }[]
  education: { id, degree, institution, location, startDate, endDate, details?: string }[]
  skills: { id, category, items: string[] }[]
  projects: { id, projectName, description, technologies: string[], link?: string }[]
  languages: { id, language, proficiency: string }[]
}
```

---

## Testing Guidelines

- **E2E tests use Playwright** (Chromium). Tests live in `tests/*.spec.js`.
- **Scoring tests use Node's built-in test runner** (`node --test`). Tests live in `tests/scoring-*.test.js`.
- Always run `npm run test:gate` before pushing changes that touch `api/scoring.js`, any `api/*.js`, or `script.js`.
- Test fixtures live in `tests/fixtures/`. Add sample PDFs or data there, not in the project root.
- Do not mock `callClaude` in E2E tests — `analyze-mock.spec.js` intercepts at the network layer.

---

## Security Notes

- **Never commit `.env.local`** — it contains the live `CLAUDE_API_KEY`. It is gitignored.
- **Sanitize all user input** with `sanitizeInput()` before passing to Claude or logging.
- **Rate limiting is IP-based and in-memory** — it resets on server restart and does not coordinate across serverless instances. This is acceptable for current scale.
- Firebase authentication is currently in **mock mode** (`auth-manager.js`). Do not add any real auth-gated logic until Firebase is properly configured.

---

## Common Tasks

### Add a new API endpoint

1. Create `api/my-feature.js` following the pattern of an existing endpoint (e.g. `api/coverletter.js`).
2. Handle CORS preflight (`OPTIONS`) at the top.
3. Call `checkRateLimit(req, res, 60, 60)` early.
4. Sanitize input with `sanitizeInput`.
5. Call `callClaude(prompt, model, maxTokens)`.
6. Parse the response with `parseClaudeJson`.
7. Add the client-side call to `js/api.js`.
8. Write a Playwright test in `tests/`.

### Add a frontend feature

1. Add UI markup to `index.html`.
2. Add styles to `style.css` (follow BEM-ish naming already in use).
3. Add logic to `script.js` or a new file under `js/` if it's self-contained.
4. Wire it to `js/api.js` for any backend calls.

### Modify scoring logic

1. Edit `api/scoring.js`.
2. Run `npm run test:scoring` — all 25 calibration cases must pass.
3. Update `tests/scoring-calibration.test.js` if expectations change intentionally.

---

## Roadmap Context

The project is in active development toward a freemium SaaS model:
- **Free tier:** Basic analysis
- **Pro ($9.99/mo):** Cover letter generation, version history, advanced analysis
- **Premium ($24.99/mo):** All features + priority processing

Planned but not yet implemented: Firebase Auth, Stripe payments, email capture. See `FEATURE_ROADMAP.md` for details.
