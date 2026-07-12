import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'

const SKILL_RAW_URL =
  'https://raw.githubusercontent.com/aaajiao/aaajiao.md/main/skills/aaajiao/SKILL.md'

interface CacheEntry {
  digest: string
  name: string
  description: string
  version?: string
  fetchedAt: number
}

const TTL_MS = 5 * 60 * 1000
let cache: CacheEntry | null = null

export function parseFrontMatter(body: string): {
  name: string
  description: string
  version?: string
} {
  const fm = body.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const name = fm.match(/^name:[ \t]*(\S.*)$/m)?.[1].trim() ?? 'aaajiao'
  // description is either inline (`description: text`) or a folded
  // block scalar (`description: >` followed by indented lines)
  const folded = fm.match(/^description:[ \t]*>-?[ \t]*\n((?:[ \t]+\S.*\n?)+)/m)?.[1]
  const description = folded
    ? folded
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
    : (fm.match(/^description:[ \t]*(\S.*)$/m)?.[1].trim() ?? '')
  // version lives in the indented `metadata:` block
  const metadataBlock = fm.match(/^metadata:[ \t]*\n((?:[ \t]+\S.*\n?)+)/m)?.[1] ?? ''
  const version = metadataBlock
    .match(/^[ \t]+version:[ \t]*["']?([^"'\n]+?)["']?[ \t]*$/m)?.[1]
    .trim()
  return { name, description, version }
}

async function getSkillMeta(): Promise<CacheEntry> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache
  }
  const response = await fetch(SKILL_RAW_URL)
  if (!response.ok) {
    throw new Error(`Upstream returned ${response.status}`)
  }
  const body = await response.text()
  const digest = `sha256:${createHash('sha256').update(body, 'utf8').digest('hex')}`
  const { name, description, version } = parseFrontMatter(body)
  cache = { digest, name, description, version, fetchedAt: Date.now() }
  return cache
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
  res.setHeader('Content-Signal', 'ai-input=yes, ai-train=yes, search=yes')
  res.setHeader('Content-Type', 'application/json')

  try {
    const { digest, name, description, version } = await getSkillMeta()
    res.json({
      $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      skills: [
        {
          name,
          type: 'skill-md',
          description,
          // extension field (spec-compliant clients ignore unknown fields);
          // parsed from metadata.version in the SKILL.md frontmatter
          version,
          url: SKILL_RAW_URL,
          digest,
        },
      ],
    })
  } catch {
    res.status(502).json({ error: 'Failed to compute skill digest' })
  }
}
