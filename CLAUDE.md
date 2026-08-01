# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio website and agent skill for contemporary artist aaajiao. Two components:

### Website (aaajiao.md)
One URL, four views of the same data:
- **`.md` tab** — Markdown rendered via Streamdown (human-readable)
- **`curl` tab** — interactive API explorer (structured JSON, Markdown, and binary examples)
- **`bin` tab** — bit-pixel bitmap visualization with breathing decode animation (Pretext sequential bit→text reflow)
- **`skill` tab** — agent skill install/quick-start cards (`npx skills add`, direct SKILL.md read, knowledge base overview)
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
    bin / skill tab switch    │
    + theme                   │
  → .md tab: Streamdown +     │
    JSON overlay + download   │
    (static import, default)  │
  → curl / bin / skill tabs:  │
    React.lazy + Suspense     │
  → curl tab: interactive     │
    API explorer + content    │
    negotiation examples      │
  → bin tab: bit-pixel bitmap │
    + hover/click decode      │
    + breathing decode (Pretext│
      sequential bit→text)    │
  → skill tab: agent skill    │
    install/quick-start cards │
```

**Data flow**: `GitHub raw URL → fetchWorks() (cached) → api/works/ → negotiateFormat(Accept) → JSON / Markdown / bytes → App.tsx (sort) → .md tab (Portfolio chunks + Streamdown) or curl tab (live API responses + negotiation demos) or bin tab (binary bitmap) or skill tab (agent skill install cards)`

### Frontend (`src/`)

- `App.tsx` — fetches `/api/works`, sorts works newest-first, manages `.md`/`curl`/`bin`/`skill` tab state and theme, passes `Work[]` to active tab. `curl`/`bin`/`skill` are `React.lazy()`-loaded behind a single `Suspense` (`MdTab` stays a static import as the default tab)
- `components/SiteHeader.tsx` — site title, `.md`/`curl`/`bin`/`skill` tab switcher, theme toggle button
- `components/ThemeToggle.tsx` — light/dark mode toggle (sun/moon icon)
- `components/MdTab.tsx` — Markdown view container: JSON overlay toggle (`{ }` button), download button, wraps Portfolio
- `components/CurlTab.tsx` — interactive API explorer: lists all endpoints with live responses, copy-to-clipboard curl commands (via `lib/clipboard.ts`), JSON syntax highlighting via `jsonHighlight.ts` and Markdown syntax highlighting via `mdHighlight.ts`. Includes content negotiation examples (Markdown and Binary endpoints with custom `Accept` headers). Responses are cached in a module-level `Map` keyed by endpoint so switching tabs away and back doesn't reset to "loading" or refetch
- `components/Portfolio.tsx` — chunked Streamdown rendering with fade-in animation; receives `showJson` prop for JSON overlay mode
- `components/WorkLayered.tsx` — single work card: Streamdown markdown foreground with optional semi-transparent JSON background overlay (via `mix-blend-multiply`/`screen`); wrapped in `React.memo` so unchanged works skip re-render when new chunks mount
- `components/BinTab.tsx` — bin tab container: serializes works to JSON, encodes to bytes, builds byte offset map, manages breathing decode animation via `useBreathingDecode`, renders BitGrid
- `components/BitGrid.tsx` — triple-canvas bit-pixel renderer: base canvas (1:1 pixelated bitmap) + overlay canvas (hover/click highlights) + flow canvas (breathing decode: mixed bit-strips + Pretext text at CSS resolution). Unified tooltip card for all interaction states. Handles mouse hover (RAF-throttled), click lock/unlock, touch, Escape key, and breathing pause/resume
- `components/SkillTab.tsx` — skill tab: install/quick-start/content/update command cards for the aaajiao agent skill (`npx skills add`, direct SKILL.md read via GitHub raw URL, knowledge base overview), copy-to-clipboard per card, previews highlighted via `skillHighlight.ts`
- `hooks/useBreathingDecode.ts` — RAF-based animation hook: cycles through visible field regions with decode (progress 0→1, segments appear one by one) → hold → encode (1→0, segments revert to bits). Picks regions from visible viewport via scroll-reported byte range. Exposes pause/resume for interaction override
- `lib/clipboard.ts` — shared `copyToClipboard(text)` used by CurlTab and SkillTab: `navigator.clipboard.writeText` with a hidden-textarea + `execCommand('copy')` fallback (deliberately kept despite deprecation — it's the only path that works when the Clipboard API is blocked; called through a local type so editors don't flag the deprecated lib.dom signature)
- `lib/jsonToMarkdown.ts` — re-export shim: forwards all exports from `shared/jsonToMarkdown.ts` so frontend imports remain unchanged
- `lib/streamdown.ts` — exports `LINK_SAFETY`, a shared module-level `{ enabled: false }` config object passed to every Streamdown call site (`Portfolio.tsx`, `WorkLayered.tsx`) — see the `linkSafety` gotcha below
- `lib/jsonHighlight.ts` — lightweight JSON syntax highlighter: HTML-escapes the stringified input before wrapping matches in `<span>` classes (keys, strings, numbers, booleans, null), so scraped work data can't inject markup via the `dangerouslySetInnerHTML` call sites that render it
- `lib/mdHighlight.ts` — lightweight Markdown syntax highlighter for the curl tab's Markdown content-negotiation preview (YAML front-matter, headings, `//` comments, bold, links)
- `lib/skillHighlight.ts` — lightweight syntax highlighter for the skill tab's command-card previews (numbers, file paths, agent tool names, CLI flags); reuses the `json-*` CSS classes from `index.css`
- `lib/byteOffsetMap.ts` — JSON string → byte offset field mapping:
  - `FieldRegion` interface (start/end byte offsets, JSON path, key, value, work index)
  - `buildByteOffsetMap(jsonString)` — character-level parser with UTF-8 byte offset computation
  - `findRegion(regions, byteOffset)` — O(log n) binary search for field lookup
- `hooks/useChunkedWorks.ts` — progressive loading hook: renders 10 works at a time, IntersectionObserver triggers next chunk with `rootMargin: '200px'`; visible count is held in a module-level variable so it survives tab-switch unmount/remount instead of resetting to the first chunk
- `hooks/useTheme.ts` — dark/light theme hook: reads from `localStorage` (key `aaajiao-theme`), falls back to `prefers-color-scheme`, sets `data-theme` attribute on `<html>`. `localStorage` reads/writes are wrapped in try/catch (falls back to system theme / stays in-memory if storage is blocked); a `matchMedia` `change` listener live-updates the theme on OS changes, but only until the user makes an explicit choice
- `hooks/useContainerWidth.ts` — ResizeObserver-based container width hook, used by BitGrid for responsive layout

Styling: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Streamdown requires `@source` directive in `src/index.css` to pick up its utility classes.

### Serverless API (`api/`)

Vercel Node.js functions (not part of the Vite build; `tsconfig.json` only covers `src/`).

- `api/index.ts` — `GET /api` → API index/navigation JSON with `content_negotiation` and `llms_txt` fields describing supported formats and AI-discovery endpoints
- `api/works/index.ts` — `GET /api/works` → all works, supports `?year=` and `?type=` query filters. Uses `sendNegotiated()` for content negotiation
- `api/works/[slug].ts` — `GET /api/works/:slug` → single work lookup by URL slug. Uses `sendNegotiated()` for content negotiation
- `api/llms-full.ts` — `GET /llms-full.txt` (via vercel.json rewrite) → full works archive as a single Markdown file. Reuses `fetchWorks()` (60s cache) + `buildFrontMatter` + `jsonToMarkdown`. Always returns `text/markdown; charset=utf-8` with `Content-Signal` header
- `api/api-catalog.ts` — `GET /.well-known/api-catalog` (via vercel.json rewrite) → linkset (RFC 9264) describing all API endpoints, their service-doc, and alternate representations. Returns `application/linkset+json` per RFC 9727
- `api/agent-skills.ts` — `GET /.well-known/agent-skills/index.json` (via vercel.json rewrite) → Agent Skills Discovery v0.2.0 index. Fetches `skills/aaajiao/SKILL.md` from GitHub raw, computes the `digest` (`sha256:{hex}`) and parses `name`/`description`/`metadata.version` from its frontmatter (5-min cache, no hardcoded copy), returns `{$schema, skills: [{name, type: "skill-md", description, version, url, digest}]}`. `$schema` must be the exact URI `https://schemas.agentskills.io/discovery/0.2.0/schema.json` and `type` must be `"skill-md"` or `"archive"` — clients reject/skip unrecognized values; `version` is an extension field (clients ignore unknown fields)

All 6 handlers set `Access-Control-Allow-Origin: *` and `Content-Signal: ai-input=yes, ai-train=yes, search=yes`, and call `handleOptions(req, res)` first to short-circuit CORS preflight (`OPTIONS` → 204 + `Access-Control-Allow-Methods: GET, HEAD, OPTIONS` + `Access-Control-Allow-Headers: Accept, Content-Type`) before any other handler logic runs. `Cache-Control` and `Vary` differ per endpoint:
- `api/works/index.ts`, `api/works/[slug].ts` (via `sendNegotiated`): `Cache-Control: s-maxage=300, stale-while-revalidate=600`, `Vary: Accept`, `Content-Type` per negotiated format
- `api/index.ts`: same `Cache-Control` as above, no `Vary` (it doesn't negotiate), `Content-Type: application/json`
- `api/llms-full.ts`: same `Cache-Control`, no `Vary` (always Markdown), `Content-Type: text/markdown; charset=utf-8`
- `api/api-catalog.ts`: `Cache-Control: s-maxage=86400, stale-while-revalidate=604800` (intentionally longer — the catalog changes rarely), no `Vary`, `Content-Type: application/linkset+json`
- `api/agent-skills.ts`: `Cache-Control: s-maxage=300, stale-while-revalidate=86400`, no `Vary`, `Content-Type: application/json`

Content negotiation on `/api/works` and `/api/works/:slug`:
- `Accept: application/json` (default) → JSON
- `Accept: text/markdown` → Markdown with YAML front-matter + `x-markdown-tokens` header
- `Accept: application/octet-stream` → raw UTF-8 bytes of JSON + `x-content-bytes` header

Slug derivation: last segment of the eventstructure.com URL, lowercased (e.g. `https://eventstructure.com/Guard-I` → `guard-i`).

### Shared (`shared/`)

- `shared/types.ts` — `Work` interface (canonical type) and `GITHUB_RAW_URL` constant, used by both frontend and API
- `shared/fetchWorks.ts` — cached data fetcher used by all API handlers. In-memory cache with 60s TTL; uses ETag (`If-None-Match`) for conditional requests so GitHub returns 304 when data hasn't changed. Falls back to stale cache if GitHub is unreachable. Concurrent callers hitting a stale/empty cache share a single in-flight promise instead of issuing duplicate GitHub fetches
- `shared/negotiate.ts` — `Accept` header parser: `negotiateFormat(header) → 'json' | 'markdown' | 'binary'`, matching exact types, partial wildcards (`text/*` → markdown, `application/*` → json), and `*/*` (→ json); sorted by quality then RFC 9110 specificity (exact > partial wildcard > `*/*`). Also exports `prefersMarkdown(header)` — true only when `text/markdown`'s effective quality is >0 and strictly greater than `text/html`'s; used by `middleware.ts`
- `shared/jsonToMarkdown.ts` — markdown conversion functions (moved from `src/lib/`):
  - `headerMarkdown()` — title + separator
  - `workToMarkdown(work)` — single work → markdown
  - `worksChunkToMarkdown(works)` — array of works → markdown
  - `jsonToMarkdown(works)` — full markdown (header + all works), used for download
  - `buildFrontMatter(worksCount)` — YAML front-matter block
  - `workToMarkdownWithFrontMatter(work)` — single work markdown with YAML front-matter
- `shared/respond.ts` — `sendNegotiated({ res, acceptHeader, data })`: dispatches response based on negotiated format. Sets `Content-Signal`, `Vary: Accept`, CORS, and Cache-Control headers on all responses. Also exports `handleOptions(req, res)` — short-circuits CORS preflight; called first in all six `api/` handlers

### Vercel Config

`vercel.json` maps routes: `/api` → `api/index`, `/api/works` → `api/works/index`, `/api/works/:slug` → `api/works/[slug]` (plus a trailing-slash variant `/api/works/:slug/`), `/llms-full.txt` → `api/llms-full`, `/.well-known/api-catalog` → `api/api-catalog`, `/.well-known/agent-skills/index.json` → `api/agent-skills`. Framework is set to `vite`.

A `headers` block on `/` adds an RFC 8288 `Link` response header pointing to `/.well-known/api-catalog`, `/.well-known/agent-skills/index.json`, `/api`, `/llms.txt`, and `/llms-full.txt`, plus `Vary: Accept`. This is what agent-readiness scanners look for as the entry point.

### Edge Middleware (`middleware.ts`)

Vercel rewrites with `has` (header conditions) **don't fire when a static file matches `/`** — the SPA's `index.html` is served before the conditional rewrite is evaluated. To negotiate Markdown on the homepage, `middleware.ts` runs at the edge before static serving, calling `prefersMarkdown()` (`shared/negotiate.ts`) — quality-aware, so it rewrites `/` to `/llms-full.txt` only when `text/markdown`'s effective quality is >0 and strictly greater than `text/html`'s. Browsers (which send `Accept: text/html,...`) fall through to `next()` and get the SPA.

### LLM Discoverability ([llmstxt.org](https://llmstxt.org/))

- `public/llms.txt` — static curated site index (navigation, what's where). Built into `dist/` and served as `text/plain` by Vercel.
- `/llms-full.txt` — dynamic full Markdown dump (handled by `api/llms-full.ts` via vercel.json rewrite). Stays in sync with scraper data; never becomes a stale snapshot.
- `public/robots.txt` — declares `Content-Signal: ai-train=yes, search=yes, ai-input=yes`, sitemap, and points to llms.txt / llms-full.txt in comments.

Rule of thumb: **`llms.txt` static, `llms-full.txt` dynamic.** Static index almost never changes; full content must reflect current data or it rots.

### Agent-readiness discovery (`.well-known/`)

Endpoints aimed at automated discovery by AI agents and scanners (e.g. [isitagentready.com](https://isitagentready.com/)):

- `/.well-known/api-catalog` — RFC 9727 / RFC 9264 linkset of all API endpoints
- `/.well-known/agent-skills/index.json` — Agent Skills Discovery v0.2.0 index pointing to `skills/aaajiao/SKILL.md` with digest and version
- Homepage `Link` response header lists the entries above so agents can discover them without crawling
- Homepage content negotiation: `curl -H "Accept: text/markdown" https://aaajiao.md/` returns the full Markdown archive (rewrites to `/llms-full.txt`)

### Agent Skill (`skills/aaajiao/`)

- `skills/aaajiao/SKILL.md` — core distillation (~4k tokens): identity, double helix framework, concept-as-filter methodology, voice rules, key works, knowledge base pointers

### Knowledge Base (`docs/`)

- `docs/interview/` — podcast transcripts and artist interviews (primary sources for voice and thinking)
- `docs/project/` — current active project dossiers
- `docs/dialogues/` — curated dialogue deposits and their template
- `docs/concepts/` — Concept Return cards and their template
- `docs/archive/` — superseded project formulations, time-bound applications, and personal correspondence; read as provenance, not current instruction
- `docs/INDEX.md` — documentation status, replacement relationships, and archive rules
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
- **Streamdown `linkSafety`**: Streamdown defaults `linkSafety: { enabled: true }`, which converts `<a>` tags to `<button>` elements with a confirmation modal. Always pass `linkSafety={{ enabled: false }}` to make links directly clickable — and pass a **module-level constant** (`src/lib/streamdown.ts`'s `LINK_SAFETY`), never a fresh object literal per render: Streamdown's internal `memo()` compares `linkSafety` by reference, so a new `{ enabled: false }` object every render defeats the memoization.
- **Markdown links**: Use standard markdown link syntax `[text](url)` and `[![](img)](img)` instead of raw HTML `<a>` tags — Streamdown may sanitize raw HTML.
- **Year sorting**: Works have year strings like `"2024"` or `"2018-2021"`. Sort by the end year (last segment after `-`) for correct chronological ordering.
- **`tsconfig.json` only covers `src/`**: API functions in `api/` are compiled separately by Vercel's build pipeline, not by the project's `tsc`.
