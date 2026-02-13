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
    .sort((a, b) => b.quality - a.quality)
}

export function negotiateFormat(acceptHeader: string | null | undefined): Format {
  if (!acceptHeader) return 'json'

  const ranges = parseAccept(acceptHeader)

  for (const { type, quality } of ranges) {
    if (quality === 0) continue
    if (type === 'text/markdown') return 'markdown'
    if (type === 'application/octet-stream') return 'binary'
    if (type === 'application/json') return 'json'
    if (type === '*/*') return 'json'
  }

  return 'json'
}
