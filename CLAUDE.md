# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio website for contemporary artist aaajiao. One URL, two audiences:
- **Humans** see Markdown rendered via Streamdown (Vercel's MD component)
- **AI agents** hit `/api/*` endpoints and get raw JSON

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
    ▼                         │
App.tsx                       │
  → sort works by year desc   │
  → SiteHeader: .md / curl    │
    tab switch + theme toggle │
  → .md tab: Streamdown +     │
    JSON overlay + download   │
  → curl tab: interactive     │
    API explorer              │
```

**Data flow**: `GitHub raw URL → fetchWorks() (cached) → api/works/ → App.tsx (sort) → .md tab (Portfolio chunks + Streamdown) or curl tab (live API responses)`

### Frontend (`src/`)

- `App.tsx` — fetches `/api/works`, sorts works newest-first, manages `.md`/`curl` tab state and theme, passes `Work[]` to active tab
- `components/SiteHeader.tsx` — site title, `.md`/`curl` tab switcher, theme toggle button
- `components/ThemeToggle.tsx` — light/dark mode toggle (sun/moon icon)
- `components/MdTab.tsx` — Markdown view container: JSON overlay toggle (`{ }` button), download button, wraps Portfolio
- `components/CurlTab.tsx` — interactive API explorer: lists all endpoints with live responses, copy-to-clipboard curl commands, JSON syntax highlighting
- `components/Portfolio.tsx` — chunked Streamdown rendering with fade-in animation; receives `showJson` prop for JSON overlay mode
- `components/WorkLayered.tsx` — single work card: Streamdown markdown foreground with optional semi-transparent JSON background overlay (via `mix-blend-multiply`/`screen`)
- `lib/jsonToMarkdown.ts` — pure functions for markdown conversion:
  - `headerMarkdown()` — title + separator
  - `workToMarkdown(work)` — single work → markdown
  - `worksChunkToMarkdown(works)` — array of works → markdown
  - `jsonToMarkdown(works)` — full markdown (header + all works), used for download
- `lib/jsonHighlight.ts` — lightweight JSON syntax highlighter (regex-based, returns HTML with `<span>` classes for keys, strings, numbers, booleans, null)
- `hooks/useChunkedWorks.ts` — progressive loading hook: renders 10 works at a time, IntersectionObserver triggers next chunk with `rootMargin: '200px'`
- `hooks/useTheme.ts` — dark/light theme hook: reads from `localStorage` (key `aaajiao-theme`), falls back to `prefers-color-scheme`, sets `data-theme` attribute on `<html>`

Styling: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Streamdown requires `@source` directive in `src/index.css` to pick up its utility classes.

### Serverless API (`api/`)

Vercel Node.js functions (not part of the Vite build; `tsconfig.json` only covers `src/`).

- `api/index.ts` — `GET /api` → API index/navigation JSON
- `api/works/index.ts` — `GET /api/works` → all works, supports `?year=` and `?type=` query filters
- `api/works/[slug].ts` — `GET /api/works/:slug` → single work lookup by URL slug

All API responses include `Cache-Control: s-maxage=300, stale-while-revalidate=600` and CORS headers.

Slug derivation: last segment of the eventstructure.com URL, lowercased (e.g. `https://eventstructure.com/Guard-I` → `guard-i`).

### Shared (`shared/`)

- `shared/types.ts` — `Work` interface (canonical type) and `GITHUB_RAW_URL` constant, used by both frontend and API
- `shared/fetchWorks.ts` — cached data fetcher used by all API handlers. In-memory cache with 60s TTL; uses ETag (`If-None-Match`) for conditional requests so GitHub returns 304 when data hasn't changed. Falls back to stale cache if GitHub is unreachable.

### Vercel Config

`vercel.json` maps routes: `/api` → `api/index`, `/api/works` → `api/works/index`, `/api/works/:slug` → `api/works/[slug]`. Framework is set to `vite`.

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
