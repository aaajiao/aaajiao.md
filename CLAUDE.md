# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio website for contemporary artist aaajiao. One URL, two audiences:
- **Humans** see Markdown rendered via Streamdown (Vercel's MD component)
- **AI agents** hit `/api/*` endpoints and get raw JSON

There is no local data copy. All work data is fetched at runtime from GitHub (`aaajiao/aaajiao_scraper` repo → `aaajiao_works.json`).

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
    │              fetch GitHub raw JSON → return
    │                         │
    ▼                         │
App.tsx                       │
  → sort works by year desc   │
  → Portfolio receives Work[] │
  → chunked rendering via     │
    IntersectionObserver      │
  → "Download MD" button      │
```

**Data flow**: `GitHub raw URL → api/works/ → App.tsx (sort) → Portfolio (chunk + render via Streamdown)`

### Frontend (`src/`)

- `App.tsx` — fetches `/api/works`, sorts works newest-first, passes `Work[]` to Portfolio
- `lib/jsonToMarkdown.ts` — pure functions for markdown conversion:
  - `headerMarkdown()` — title + separator
  - `workToMarkdown(work)` — single work → markdown
  - `worksChunkToMarkdown(works)` — array of works → markdown
  - `jsonToMarkdown(works)` — full markdown (header + all works), used for download
- `hooks/useChunkedWorks.ts` — progressive loading hook: renders 10 works at a time, IntersectionObserver triggers next chunk with `rootMargin: '200px'`
- `components/Portfolio.tsx` — chunked Streamdown rendering with fade-in animation; download button generates complete markdown from all works
- `components/ApiHint.tsx` — "For AI: curl …/api" banner

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

### Vercel Config

`vercel.json` maps routes: `/api` → `api/index`, `/api/works` → `api/works/index`, `/api/works/:slug` → `api/works/[slug]`. Framework is set to `vite`.

## Key Data Source

All artwork data comes from:
`https://raw.githubusercontent.com/aaajiao/aaajiao_scraper/main/aaajiao_works.json`

When the scraper pushes new data, the site reflects it within the cache TTL (5 min) without redeployment.

## Gotchas

- **API imports must use `.js` extension**: The project uses `"type": "module"` (ESM). Imports in `api/` files from `shared/types` must use `../../shared/types.js` or Vercel serverless functions crash at runtime with `Cannot find module`.
- **Streamdown `linkSafety`**: Streamdown defaults `linkSafety: { enabled: true }`, which converts `<a>` tags to `<button>` elements with a confirmation modal. Always pass `linkSafety={{ enabled: false }}` to make links directly clickable.
- **Markdown links**: Use standard markdown link syntax `[text](url)` and `[![](img)](img)` instead of raw HTML `<a>` tags — Streamdown may sanitize raw HTML.
- **Year sorting**: Works have year strings like `"2024"` or `"2018-2021"`. Sort by the end year (last segment after `-`) for correct chronological ordering.
- **`tsconfig.json` only covers `src/`**: API functions in `api/` are compiled separately by Vercel's build pipeline, not by the project's `tsc`.
