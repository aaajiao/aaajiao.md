import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Signal', 'ai-input=yes, ai-train=yes, search=yes')

  res.json({
    name: 'aaajiao portfolio',
    source: 'https://github.com/aaajiao/aaajiao_scraper',
    endpoints: {
      all_works: '/api/works',
      single_work: '/api/works/{slug}',
      search: '/api/works?year=2024&type=Installation',
    },
    content_negotiation: {
      description: 'All /api/works endpoints support content negotiation via Accept header',
      formats: {
        json: {
          accept: 'application/json',
          description: 'Structured JSON (default)',
          example: 'curl /api/works',
        },
        markdown: {
          accept: 'text/markdown',
          description: 'Human-readable Markdown with YAML front-matter',
          example: 'curl -H "Accept: text/markdown" /api/works',
        },
        binary: {
          accept: 'application/octet-stream',
          description: 'Raw UTF-8 bytes of the JSON representation',
          example: 'curl -H "Accept: application/octet-stream" /api/works -o works.bin',
        },
      },
    },
    human_url: '/',
  })
}
