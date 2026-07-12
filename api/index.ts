import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleOptions } from '../shared/respond.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  res.setHeader('Content-Signal', 'ai-input=yes, ai-train=yes, search=yes')

  res.json({
    name: 'aaajiao portfolio',
    source: 'https://github.com/aaajiao/aaajiao_scraper',
    endpoints: {
      all_works: '/api/works',
      single_work: '/api/works/{slug}',
      search: '/api/works?year=2024&type=Installation',
    },
    llms_txt: {
      description: 'AI-friendly site index following the llmstxt.org standard',
      index: '/llms.txt',
      full: '/llms-full.txt',
    },
    agent_discovery: {
      description: 'Well-known endpoints for AI agent discovery',
      api_catalog: '/.well-known/api-catalog',
      agent_skills_index: '/.well-known/agent-skills/index.json',
      homepage_markdown: 'curl -H "Accept: text/markdown" /',
    },
    content_negotiation: {
      description: 'All /api/works endpoints support content negotiation via Accept header',
      formats: {
        json: {
          accept: 'application/json',
          description: 'Structured JSON (default)',
          example: 'curl /api/works',
        },
        markdown: {
          accept: 'text/markdown',
          description: 'Human-readable Markdown with YAML front-matter',
          example: 'curl -H "Accept: text/markdown" /api/works',
        },
        binary: {
          accept: 'application/octet-stream',
          description: 'Raw UTF-8 bytes of the JSON representation',
          example: 'curl -H "Accept: application/octet-stream" /api/works -o works.bin',
        },
      },
    },
    human_url: '/',
  })
}
