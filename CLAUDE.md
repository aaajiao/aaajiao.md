# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio website and agent skill for contemporary artist aaajiao. Two components:

### Website (aaajiao.md)
One URL, three views of the same data:
- **`.md` tab** — Markdown rendered via Streamdown (human-readable)
- **`curl` tab** — interactive API explorer (structured JSON, Markdown, and binary examples)
- **`bin` tab** — bit-pixel bitmap visualization with breathing decode animation (Pretext sequential bit→text reflow)
- **AI agents** hit `/api/*` endpoints and get raw JSON

The API supports HTTP content negotiation — the same URL returns JSON, Markdown, or raw bytes depending on the `Accept` header. A `Content-Signal` header declares data usage rights (`ai-input=yes, ai-train=yes, search=yes`).

### Agent Skill (`skills/aaajiao/`)
A distillation of aaajiao's conceptual framework into the [Agent Skills](https://agentskills.io) standard. `SKILL.md` contains the core identity, methodology, and voice rules. Reference documents live in `docs/` — interviews, project documents, media coverage (58 MD articles + 40 PDFs), letters, and exhibition applications. The skill reads `docs/` via GitHub raw URLs so external users can access them without cloning the repo.

All work data is fetched from GitHub (`aaajiao/aaajiao_scraper` repo → `aaajiao_works.json`) with in-memory caching and ETag-based conditional requests.

## Commands

```bash
bun install          # install dependencies
bun run dev          # Vite dev server (frontend only, no API)
vercel dev           # full local dev (frontend + serverless API functions)
bun run build        # tsc + vite build → dist/
```

No test runner or linter is configured.

## Architecture

```
Browser (/)                          AI (curl /api/*)
    │                                      │
    ├─ fetch /api/works ──────┐            │
    │                         ▼            ▼
    │              Vercel Serverless Functions (api/)
    │              fetchWorks() — in-memory cache
    │              ├─ <60s: return cached
    │              └─ ≥60s: ETag conditional fetch
    │                  ├─ 304: reuse cache
    │                  └─ 200: update cache
    │                         │
    │              negotiateFormat(Accept header)
    │              ├─ application/json → JSON
    │              ├─ text/markdown → Markdown + front-matter
    │              └─ application/octet-stream → raw bytes
    │              + Content-Signal header on all responses
    │                         │
    ▼                         │
App.tsx                       │
  → sort works by year desc   │
  → SiteHeader: .md / curl /  │
    bin tab switch + theme    │
  → .md tab: Streamdown +     │
    JSON overlay + download   │
  → curl tab: interactive     │
    API explorer + content    │
    negotiation examples      │
  → bin tab: bit-pixel bitmap │
    + hover/click decode      │
    + breathing decode (Pretext│
      sequential bit→text)    │
```

**Data flow**: `GitHub raw URL → fetchWorks() (cached) → api/works/ → negotiateFormat(Accept) → JSON / Markdown / bytes → App.tsx (sort) → .md tab (Portfolio chunks + Streamdown) or curl tab (live API responses + negotiation demos) or bin tab (binary bitmap)`

### Frontend (`src/`)

- `App.tsx` — fetches `/api/works`, sorts works newest-first, manages `.md`/`curl`/`bin` tab state and theme, passes `Work[]` to active tab
- `components/SiteHeader.tsx` — site title, `.md`/`curl`/`bin` tab switcher, theme toggle button
- `components/ThemeToggle.tsx` — light/dark mode toggle (sun/moon icon)
- `components/MdTab.tsx` — Markdown view container: JSON overlay toggle (`{ }` button), download button, wraps Portfolio
- `components/CurlTab.tsx` — interactive API explorer: lists all endpoints with live responses, copy-to-clipboard curl commands, JSON syntax highlighting. Includes content negotiation examples (Markdown and Binary endpoints with custom `Accept` headers)
- `components/Portfolio.tsx` — chunked Streamdown rendering with fade-in animation; receives `showJson` prop for JSON overlay mode
- `components/WorkLayered.tsx` — single work card: Streamdown markdown foreground with optional semi-transparent JSON background overlay (via `mix-blend-multiply`/`screen`)
- `components/BinTab.tsx` — bin tab container: serializes works to JSON, encodes to bytes, builds byte offset map, manages breathing decode animation via `useBreathingDecode`, renders BitGrid
- `components/BitGrid.tsx` — triple-canvas bit-pixel renderer: base canvas (1:1 pixelated bitmap) + overlay canvas (hover/click highlights) + flow canvas (breathing decode: mixed bit-strips + Pretext text at CSS resolution). Unified tooltip card for all interaction states. Handles mouse hover (RAF-throttled), click lock/unlock, touch, Escape key, and breathing pause/resume
- `hooks/useBreathingDecode.ts` — RAF-based animation hook: cycles through visible field regions with decode (progress 0→1, segments appear one by one) → hold → encode (1→0, segments revert to bits). Picks regions from visible viewport via scroll-reported byte range. Exposes pause/resume for interaction override
- `lib/jsonToMarkdown.ts` — re-export shim: forwards all exports from `shared/jsonToMarkdown.ts` so frontend imports remain unchanged
- `lib/jsonHighlight.ts` — lightweight JSON syntax highlighter (regex-based, returns HTML with `<span>` classes for keys, strings, numbers, booleans, null)
- `lib/byteOffsetMap.ts` — JSON string → byte offset field mapping:
  - `FieldRegion` interface (start/end byte offsets, JSON path, key, value, work index)
  - `buildByteOffsetMap(jsonString)` — character-level parser with UTF-8 byte offset computation
  - `findRegion(regions, byteOffset)` — O(log n) binary search for field lookup
- `hooks/useChunkedWorks.ts` — progressive loading hook: renders 10 works at a time, IntersectionObserver triggers next chunk with `rootMargin: '200px'`
- `hooks/useTheme.ts` — dark/light theme hook: reads from `localStorage` (key `aaajiao-theme`), falls back to `prefers-color-scheme`, sets `data-theme` attribute on `<html>`
- `hooks/useContainerWidth.ts` — ResizeObserver-based container width hook, used by BitGrid for responsive layout

Styling: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Streamdown requires `@source` directive in `src/index.css` to pick up its utility classes.

### Serverless API (`api/`)

Vercel Node.js functions (not part of the Vite build; `tsconfig.json` only covers `src/`).

- `api/index.ts` — `GET /api` → API index/navigation JSON with `content_negotiation` and `llms_txt` fields describing supported formats and AI-discovery endpoints
- `api/works/index.ts` — `GET /api/works` → all works, supports `?year=` and `?type=` query filters. Uses `sendNegotiated()` for content negotiation
- `api/works/[slug].ts` — `GET /api/works/:slug` → single work lookup by URL slug. Uses `sendNegotiated()` for content negotiation
- `api/llms-full.ts` — `GET /llms-full.txt` (via vercel.json rewrite) → full works archive as a single Markdown file. Reuses `fetchWorks()` (60s cache) + `buildFrontMatter` + `jsonToMarkdown`. Always returns `text/markdown; charset=utf-8` with `Content-Signal` header

All API responses include `Cache-Control: s-maxage=300, stale-while-revalidate=600`, CORS headers, `Content-Signal: ai-input=yes, ai-train=yes, search=yes`, and `Vary: Accept`.

Content negotiation on `/api/works` and `/api/works/:slug`:
- `Accept: application/json` (default) → JSON
- `Accept: text/markdown` → Markdown with YAML front-matter + `x-markdown-tokens` header
- `Accept: application/octet-stream` → raw UTF-8 bytes of JSON + `x-content-bytes` header

Slug derivation: last segment of the eventstructure.com URL, lowercased (e.g. `https://eventstructure.com/Guard-I` → `guard-i`).

### Shared (`shared/`)

- `shared/types.ts` — `Work` interface (canonical type) and `GITHUB_RAW_URL` constant, used by both frontend and API
- `shared/fetchWorks.ts` — cached data fetcher used by all API handlers. In-memory cache with 60s TTL; uses ETag (`If-None-Match`) for conditional requests so GitHub returns 304 when data hasn't changed. Falls back to stale cache if GitHub is unreachable
- `shared/negotiate.ts` — `Accept` header parser: `negotiateFormat(header) → 'json' | 'markdown' | 'binary'`. Parses media types with quality factors
- `shared/jsonToMarkdown.ts` — markdown conversion functions (moved from `src/lib/`):
  - `headerMarkdown()` — title + separator
  - `workToMarkdown(work)` — single work → markdown
  - `worksChunkToMarkdown(works)` — array of works → markdown
  - `jsonToMarkdown(works)` — full markdown (header + all works), used for download
  - `buildFrontMatter(worksCount)` — YAML front-matter block
  - `workToMarkdownWithFrontMatter(work)` — single work markdown with YAML front-matter
- `shared/respond.ts` — `sendNegotiated({ res, acceptHeader, data })`: dispatches response based on negotiated format. Sets `Content-Signal`, `Vary: Accept`, CORS, and Cache-Control headers on all responses

### Vercel Config

`vercel.json` maps routes: `/api` → `api/index`, `/api/works` → `api/works/index`, `/api/works/:slug` → `api/works/[slug]`, `/llms-full.txt` → `api/llms-full`. Framework is set to `vite`.

### LLM Discoverability ([llmstxt.org](https://llmstxt.org/))

- `public/llms.txt` — static curated site index (navigation, what's where). Built into `dist/` and served as `text/plain` by Vercel.
- `/llms-full.txt` — dynamic full Markdown dump (handled by `api/llms-full.ts` via vercel.json rewrite). Stays in sync with scraper data; never becomes a stale snapshot.
- `public/robots.txt` — points to both files in comments.

Rule of thumb: **`llms.txt` static, `llms-full.txt` dynamic.** Static index almost never changes; full content must reflect current data or it rots.

### Agent Skill (`skills/aaajiao/`)

- `skills/aaajiao/SKILL.md` — core distillation (~4k tokens): identity, double helix framework, concept-as-filter methodology, voice rules, key works, knowledge base pointers

### Knowledge Base (`docs/`)

- `docs/interview/` — podcast transcripts and artist interviews (primary sources for voice and thinking)
- `docs/letter/` — personal correspondence (private voice)
- `docs/opencall/` — exhibition applications (public voice)
- `docs/project/symbiosis/` — ongoing project documentation
- `docs/media/articles/` — 58 media articles as Markdown (critical reception, 2010-2023)
- `docs/media/pdf/` — 40 print media PDFs (original magazine layouts)
- `docs/media/print-index.md` — print coverage index
- `docs/media/online-index.md` — online coverage index

These files are not part of the Vite build. They serve as reference material for the agent skill, accessed via GitHub raw URLs.

## Key Data Source

All artwork data comes from:
`https://raw.githubusercontent.com/aaajiao/aaajiao_scraper/main/aaajiao_works.json`

When the scraper pushes new data, the site reflects it within ~60s (in-memory TTL) + Vercel edge cache (5 min) without redeployment.

## Gotchas

- **API imports must use `.js` extension**: The project uses `"type": "module"` (ESM). Imports in `api/` files from `shared/types` must use `../../shared/types.js` or Vercel serverless functions crash at runtime with `Cannot find module`.
- **Streamdown `linkSafety`**: Streamdown defaults `linkSafety: { enabled: true }`, which converts `<a>` tags to `<button>` elements with a confirmation modal. Always pass `linkSafety={{ enabled: false }}` to make links directly clickable.
- **Markdown links**: Use standard markdown link syntax `[text](url)` and `[![](img)](img)` instead of raw HTML `<a>` tags — Streamdown may sanitize raw HTML.
- **Year sorting**: Works have year strings like `"2024"` or `"2018-2021"`. Sort by the end year (last segment after `-`) for correct chronological ordering.
- **`tsconfig.json` only covers `src/`**: API functions in `api/` are compiled separately by Vercel's build pipeline, not by the project's `tsc`.
