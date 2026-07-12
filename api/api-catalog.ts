import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleOptions } from '../shared/respond.js'

const ORIGIN = 'https://aaajiao.md'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return

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
      {
        anchor: `${ORIGIN}/llms.txt`,
        describes: [{ href: `${ORIGIN}/`, type: 'text/html' }],
        type: 'text/plain',
      },
      {
        anchor: `${ORIGIN}/.well-known/api-catalog`,
        describes: [{ href: `${ORIGIN}/api`, type: 'application/json' }],
        type: 'application/linkset+json',
      },
      {
        anchor: `${ORIGIN}/.well-known/agent-skills/index.json`,
        describes: [{ href: `${ORIGIN}/`, type: 'text/html' }],
        type: 'application/json',
      },
    ],
  })
}
