import type { VercelRequest, VercelResponse } from '@vercel/node'

const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/aaajiao/aaajiao_scraper/main/aaajiao_works.json'

interface Work {
  url: string
  title: string
  year: string
  type: string
  [key: string]: unknown
}

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
