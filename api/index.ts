import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  res.json({
    name: 'aaajiao portfolio',
    source: 'https://github.com/aaajiao/aaajiao_scraper',
    endpoints: {
      all_works: '/api/works',
      single_work: '/api/works/{slug}',
      search: '/api/works?year=2024&type=Installation',
    },
    human_url: '/',
  })
}
