import { GITHUB_RAW_URL, type Work } from './types.js'

const CACHE_TTL_MS = 60_000 // 60 seconds — skip GitHub entirely if fresh

let cachedWorks: Work[] | null = null
let cachedEtag: string | null = null
let cachedAt = 0

export async function fetchWorks(): Promise<Work[]> {
  const now = Date.now()

  // If cache is fresh, return immediately without hitting GitHub
  if (cachedWorks && now - cachedAt < CACHE_TTL_MS) {
    return cachedWorks
  }

  // Conditional request: send ETag so GitHub can return 304
  const headers: Record<string, string> = {}
  if (cachedEtag) {
    headers['If-None-Match'] = cachedEtag
  }

  const response = await fetch(GITHUB_RAW_URL, { headers })

  if (response.status === 304 && cachedWorks) {
    // Not modified — reuse cache, refresh timestamp
    cachedAt = now
    return cachedWorks
  }

  if (!response.ok) {
    // If we have stale cache, return it rather than failing
    if (cachedWorks) return cachedWorks
    throw new Error(`GitHub fetch failed: ${response.status}`)
  }

  cachedWorks = await response.json() as Work[]
  cachedEtag = response.headers.get('etag')
  cachedAt = now
  return cachedWorks
}
