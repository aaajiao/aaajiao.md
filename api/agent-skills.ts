import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'

const SKILL_RAW_URL =
  'https://raw.githubusercontent.com/aaajiao/aaajiao.md/main/skills/aaajiao/SKILL.md'

interface CacheEntry {
  sha256: string
  fetchedAt: number
}

const TTL_MS = 5 * 60 * 1000
let cache: CacheEntry | null = null

async function getSkillDigest(): Promise<string> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.sha256
  }
  const response = await fetch(SKILL_RAW_URL)
  if (!response.ok) {
    throw new Error(`Upstream returned ${response.status}`)
  }
  const body = await response.text()
  const sha256 = createHash('sha256').update(body, 'utf8').digest('hex')
  cache = { sha256, fetchedAt: Date.now() }
  return sha256
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
  res.setHeader('Content-Signal', 'ai-input=yes, ai-train=yes, search=yes')
  res.setHeader('Content-Type', 'application/json')

  try {
    const sha256 = await getSkillDigest()
    res.json({
      $schema:
        'https://raw.githubusercontent.com/cloudflare/agent-skills-discovery-rfc/main/schema/agent-skills-index.schema.json',
      skills: [
        {
          name: 'aaajiao',
          type: 'agent-skill',
          description:
            'Understand and think like aaajiao (Xu Wenkai), a media artist working between Berlin and Shanghai. Use when writing as/about aaajiao, analyzing digital culture through his critical lens, applying his conceptual framework (Internet Void, Double Helix, Absorption/Trance), or engaging with algorithmic governance, platform politics, and trade infrastructure.',
          url: SKILL_RAW_URL,
          sha256,
        },
      ],
    })
  } catch {
    res.status(502).json({ error: 'Failed to compute skill digest' })
  }
}
