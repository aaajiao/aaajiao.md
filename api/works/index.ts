import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GITHUB_RAW_URL, type Work } from '../../shared/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader(
    'Cache-Control',
    's-maxage=300, stale-while-revalidate=600'
  )

  try {
    const response = await fetch(GITHUB_RAW_URL)
    if (!response.ok) {
      res.status(502).json({ error: 'Failed to fetch from GitHub' })
      return
    }

    let works: Work[] = await response.json()

    // Filter by query params
    const { year, type } = req.query
    if (year) {
      const y = String(year)
      works = works.filter((w) => w.year.includes(y))
    }
    if (type) {
      const t = String(type).toLowerCase()
      works = works.filter((w) => w.type.toLowerCase() === t)
    }

    res.json(works)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
}
