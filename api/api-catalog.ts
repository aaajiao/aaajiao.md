import type { VercelRequest, VercelResponse } from '@vercel/node'

const ORIGIN = 'https://aaajiao.md'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/linkset+json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  res.setHeader('Content-Signal', 'ai-input=yes, ai-train=yes, search=yes')

  res.json({
    linkset: [
      {
        anchor: `${ORIGIN}/api`,
        'service-doc': [
          { href: `${ORIGIN}/api`, type: 'application/json' },
          { href: `${ORIGIN}/llms.txt`, type: 'text/plain' },
        ],
        'service-desc': [{ href: `${ORIGIN}/api`, type: 'application/json' }],
        author: [{ href: `${ORIGIN}/`, type: 'text/html' }],
      },
      {
        anchor: `${ORIGIN}/api/works`,
        'service-doc': [{ href: `${ORIGIN}/api`, type: 'application/json' }],
        alternate: [
          { href: `${ORIGIN}/api/works`, type: 'application/json' },
          { href: `${ORIGIN}/api/works`, type: 'text/markdown' },
          { href: `${ORIGIN}/api/works`, type: 'application/octet-stream' },
        ],
      },
      {
        anchor: `${ORIGIN}/api/works/{slug}`,
        'service-doc': [{ href: `${ORIGIN}/api`, type: 'application/json' }],
        alternate: [
          { href: `${ORIGIN}/api/works/{slug}`, type: 'application/json' },
          { href: `${ORIGIN}/api/works/{slug}`, type: 'text/markdown' },
          { href: `${ORIGIN}/api/works/{slug}`, type: 'application/octet-stream' },
        ],
      },
      {
        anchor: `${ORIGIN}/llms-full.txt`,
        describes: [{ href: `${ORIGIN}/api/works`, type: 'application/json' }],
        type: 'text/markdown',
      },
    ],
  })
}
