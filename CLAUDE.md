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
  → jsonToMarkdown(works)     │
  → Streamdown renders MD     │
  → "Download MD" button      │
```

**Data flow**: `GitHub raw URL → api/works/ → (client) jsonToMarkdown() → Streamdown`

### Frontend (`src/`)

- `App.tsx` — fetches `/api/works`, converts to MD string, passes to Portfolio
- `lib/jsonToMarkdown.ts` — pure function: `Work[] → string`. The `Work` interface is the canonical type for a single artwork. The same MD string powers both the rendered view and the download button
- `components/Portfolio.tsx` — Streamdown static mode rendering + Blob download
- `components/ApiHint.tsx` — "For AI: curl …/api" banner

Styling: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Streamdown requires `@source` directive in `src/index.css` to pick up its utility classes.

### Serverless API (`api/`)

Vercel Node.js functions (not part of the Vite build; `tsconfig.json` only covers `src/`).

- `api/index.ts` — `GET /api` → API index/navigation JSON
- `api/works/index.ts` — `GET /api/works` → all works, supports `?year=` and `?type=` query filters
- `api/works/[slug].ts` — `GET /api/works/:slug` → single work lookup by URL slug

All API responses include `Cache-Control: s-maxage=300, stale-while-revalidate=600` and CORS headers.

Slug derivation: last segment of the eventstructure.com URL, lowercased (e.g. `https://eventstructure.com/Guard-I` → `guard-i`).

### Vercel Config

`vercel.json` maps routes: `/api` → `api/index`, `/api/works` → `api/works/index`, `/api/works/:slug` → `api/works/[slug]`. Framework is set to `vite`.

## Key Data Source

All artwork data comes from:
`https://raw.githubusercontent.com/aaajiao/aaajiao_scraper/main/aaajiao_works.json`

When the scraper pushes new data, the site reflects it within the cache TTL (5 min) without redeployment.
