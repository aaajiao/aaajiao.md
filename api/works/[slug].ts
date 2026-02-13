import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchWorks } from '../../shared/fetchWorks.js'
import { sendNegotiated } from '../../shared/respond.js'

function slugFromUrl(url: string): string {
  const parts = url.replace(/\/$/, '').split('/')
  return parts[parts.length - 1].toLowerCase()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { slug } = req.query
  if (!slug || typeof slug !== 'string') {
    res.status(400).json({ error: 'Missing slug parameter' })
    return
  }

  try {
    const works = await fetchWorks()
    const target = slug.toLowerCase()
    const work = works.find((w) => slugFromUrl(w.url) === target)

    if (!work) {
      res.status(404).json({ error: `Work "${slug}" not found` })
      return
    }

    sendNegotiated({ res, acceptHeader: req.headers.accept, data: work })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
}
