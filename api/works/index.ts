import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Work } from '../../shared/types.js'
import { fetchWorks } from '../../shared/fetchWorks.js'
import { sendNegotiated, handleOptions } from '../../shared/respond.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return

  try {
    let works: Work[] = await fetchWorks()

    // Filter by query params (Vercel gives string | string[] for repeated params)
    const { year, type } = req.query
    if (year) {
      const y = Array.isArray(year) ? year[0] : year
      works = works.filter((w) => w.year.includes(y))
    }
    if (type) {
      const t = (Array.isArray(type) ? type[0] : type).toLowerCase()
      works = works.filter((w) => w.type.toLowerCase() === t)
    }

    sendNegotiated({ res, acceptHeader: req.headers.accept, data: works })
  } catch {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: 'Internal server error' })
  }
}
