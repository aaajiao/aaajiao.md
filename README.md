# aaajiao.md

One URL, two interfaces. A portfolio site for contemporary artist [aaajiao](https://eventstructure.com) that serves humans and AI agents from the same origin.

- **Humans** visit `/` and see artwork data rendered as Markdown via [Streamdown](https://github.com/vercel/streamdown)
- **AI agents** hit `/api/*` and get structured JSON

Features: `.md` / `curl` tab switching, dark/light theme, JSON data overlay on artworks, interactive API explorer with live responses, chunked infinite scroll, download as `.md`.

No local data copy. All work data is fetched at runtime from the [aaajiao_scraper](https://github.com/aaajiao/aaajiao_scraper) repo on GitHub.

## API

```bash
# Index / navigation
curl https://aaajiao.md/api

# All works
curl https://aaajiao.md/api/works

# Filter by year or type
curl "https://aaajiao.md/api/works?year=2024"
curl "https://aaajiao.md/api/works?type=Installation"

# Single work by slug
curl https://aaajiao.md/api/works/guard-i
```

All responses are JSON with CORS enabled.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Streamdown
- **API**: Vercel Serverless Functions (Node.js)
- **Data**: GitHub raw JSON (cached 5 min, no redeploy needed)
- **Runtime**: Bun

## Development

```bash
bun install          # install dependencies
bun run dev          # vite dev server (frontend only)
vercel dev           # full local dev (frontend + API)
bun run build        # production build
```

## Architecture

```
Browser (/)                          AI (curl /api/*)
    |                                      |
    +-- fetch /api/works ---+              |
    |                       v              v
    |              Vercel Serverless Functions
    |              GitHub raw JSON -> return
    |                       |
    v                       |
  App.tsx                   |
    -> sort by year desc    |
    -> .md tab: Streamdown  |
       + JSON overlay       |
    -> curl tab: live API   |
       explorer             |
```

## License

MIT
