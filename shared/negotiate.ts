export type Format = 'json' | 'markdown' | 'binary'

interface MediaRange {
  type: string
  quality: number
}

function parseAccept(header: string): MediaRange[] {
  return header
    .split(',')
    .map((part) => {
      const trimmed = part.trim()
      const [type, ...params] = trimmed.split(';').map((s) => s.trim())
      let quality = 1
      for (const p of params) {
        const match = p.match(/^q=(\d+(?:\.\d+)?)$/)
        if (match) quality = parseFloat(match[1])
      }
      return { type: type.toLowerCase(), quality }
    })
    .sort((a, b) => b.quality - a.quality || specificity(b.type) - specificity(a.type))
}

// RFC 9110 precedence: exact media type > partial wildcard (type/*) > full wildcard (*/*)
function specificity(type: string): number {
  if (type === '*/*') return 0
  if (type.endsWith('/*')) return 1
  return 2
}

function matchFormat(type: string): Format | null {
  if (type === 'text/markdown') return 'markdown'
  if (type === 'application/octet-stream') return 'binary'
  if (type === 'application/json') return 'json'
  if (type === 'text/*') return 'markdown'
  if (type === 'application/*') return 'json'
  if (type === '*/*') return 'json'
  return null
}

export function negotiateFormat(acceptHeader: string | null | undefined): Format {
  if (!acceptHeader) return 'json'

  const ranges = parseAccept(acceptHeader)

  for (const { type, quality } of ranges) {
    if (quality === 0) continue
    const format = matchFormat(type)
    if (format) return format
  }

  return 'json'
}

// Effective quality of `type` within `ranges`, honoring exact > partial wildcard > */* precedence.
function qualityOf(ranges: MediaRange[], type: string): number {
  const group = type.split('/')[0]
  let best = 0
  let bestSpecificity = -1

  for (const { type: rangeType, quality } of ranges) {
    const matches = rangeType === type || rangeType === `${group}/*` || rangeType === '*/*'
    if (!matches) continue
    const s = specificity(rangeType)
    if (s > bestSpecificity) {
      best = quality
      bestSpecificity = s
    }
  }

  return best
}

// True only when text/markdown is acceptable (q>0) and strictly preferred over text/html.
export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader) return false

  const ranges = parseAccept(acceptHeader)
  const markdownQuality = qualityOf(ranges, 'text/markdown')
  const htmlQuality = qualityOf(ranges, 'text/html')

  return markdownQuality > 0 && markdownQuality > htmlQuality
}
