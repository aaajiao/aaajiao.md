import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchWorks } from '../shared/fetchWorks.js'
import { jsonToMarkdown, buildFrontMatter } from '../shared/jsonToMarkdown.js'

const CONTENT_SIGNAL = 'ai-input=yes, ai-train=yes, search=yes'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  res.setHeader('Content-Signal', CONTENT_SIGNAL)
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')

  try {
    const works = await fetchWorks()
    const md = buildFrontMatter(works.length) + jsonToMarkdown(works)
    res.send(md)
  } catch {
    res.status(500).send('# Error\n\nFailed to fetch works.\n')
  }
}
