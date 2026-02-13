import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Work } from '../../shared/types.js'
import { fetchWorks } from '../../shared/fetchWorks.js'
import { sendNegotiated } from '../../shared/respond.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let works: Work[] = await fetchWorks()

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

    sendNegotiated({ res, acceptHeader: req.headers.accept, data: works })
  } catch {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: 'Internal server error' })
  }
}
