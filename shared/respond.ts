import type { VercelResponse } from '@vercel/node'
import type { Work } from './types.js'
import type { Format } from './negotiate.js'
import { negotiateFormat } from './negotiate.js'
import {
  jsonToMarkdown,
  workToMarkdownWithFrontMatter,
  buildFrontMatter,
} from './jsonToMarkdown.js'

const CONTENT_SIGNAL = 'ai-input=yes, ai-train=yes, search=yes'

function setCommonHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  res.setHeader('Content-Signal', CONTENT_SIGNAL)
  res.setHeader('Vary', 'Accept')
}

function toMarkdown(data: Work | Work[]): string {
  if (Array.isArray(data)) {
    return buildFrontMatter(data.length) + jsonToMarkdown(data)
  }
  return workToMarkdownWithFrontMatter(data)
}

interface SendOptions {
  res: VercelResponse
  acceptHeader: string | null | undefined
  data: Work | Work[]
}

export function sendNegotiated({ res, acceptHeader, data }: SendOptions) {
  const format: Format = negotiateFormat(acceptHeader)
  setCommonHeaders(res)

  switch (format) {
    case 'markdown': {
      const md = toMarkdown(data)
      const tokens = md.split(/\s+/).length
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
      res.setHeader('x-markdown-tokens', String(tokens))
      res.send(md)
      break
    }
    case 'binary': {
      const json = JSON.stringify(data, null, 2)
      const bytes = Buffer.from(json, 'utf-8')
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('x-content-bytes', String(bytes.length))
      res.send(bytes)
      break
    }
    default: {
      res.setHeader('Content-Type', 'application/json')
      res.json(data)
      break
    }
  }
}
