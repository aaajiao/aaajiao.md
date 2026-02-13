# aaajiao.md

One URL, three views. A portfolio site for contemporary artist [aaajiao](https://eventstructure.com) that presents the same artwork data at three levels of abstraction.

- **`.md`** — human-readable Markdown via [Streamdown](https://github.com/vercel/streamdown)
- **`curl`** — interactive API explorer with live JSON, Markdown, and binary responses
- **`bin`** — bit-pixel bitmap: every byte of JSON rendered as 8 pixels, hover/click to decode
- **AI agents** hit `/api/*` and get structured JSON

From Markdown to structured data to raw binary — the same information, three ways of seeing.

| `.md` tab | `curl` tab | `bin` tab |
|-----------|------------|-----------|
| ![.md tab](public/screenshot-md.png) | ![curl tab](public/screenshot-curl.png) | ![bin tab](public/screenshot-bin.png) |

No local data copy. All work data is fetched at runtime from the [aaajiao_scraper](https://github.com/aaajiao/aaajiao_scraper) repo on GitHub.

## API

```bash
# Index / navigation
curl https://aaajiao.md/api

# All works (JSON, default)
curl https://aaajiao.md/api/works

# Filter by year or type
curl "https://aaajiao.md/api/works?year=2024"
curl "https://aaajiao.md/api/works?type=Installation"

# Single work by slug
curl https://aaajiao.md/api/works/guard-i
```

### Content Negotiation

Same URL, different `Accept` header — three representations:

```bash
# Markdown (with YAML front-matter)
curl -H "Accept: text/markdown" https://aaajiao.md/api/works

# Raw bytes (UTF-8 encoded JSON)
curl -H "Accept: application/octet-stream" https://aaajiao.md/api/works -o works.bin

# Single work as Markdown
curl -H "Accept: text/markdown" https://aaajiao.md/api/works/guard-i
```

All responses include CORS headers and `Content-Signal: ai-input=yes, ai-train=yes, search=yes`.

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
    |              GitHub raw JSON -> cache -> negotiate
    |              Accept: json | markdown | binary
    |              + Content-Signal header
    |                       |
    v                       |
  App.tsx                   |
    -> sort by year desc    |
    -> .md tab: Streamdown  |
       + JSON overlay       |
    -> curl tab: live API   |
       explorer + content   |
       negotiation demos    |
    -> bin tab: bit-pixel   |
       bitmap + decode      |
```

## License

MIT
