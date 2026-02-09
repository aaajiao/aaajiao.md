import { useState, useEffect, useCallback } from 'react'
import { highlightJson } from '../lib/jsonHighlight'
import type { Work } from '../../shared/types'

interface Endpoint {
  label: string
  description: string
  path: string
  truncateArray?: boolean
}

interface CurlTabProps {
  works: Work[]
}

export function CurlTab({ works }: CurlTabProps) {
  const origin = window.location.origin
  const slug = works.length > 0
    ? works[0].url.split('/').pop()!.toLowerCase()
    : 'example-slug'

  const endpoints: Endpoint[] = [
    { label: 'API Index', description: '导航 / Navigation', path: '/api' },
    { label: 'All Works', description: '所有作品 / All works', path: '/api/works', truncateArray: true },
    { label: 'Filter by Year', description: '按年份 / By year', path: '/api/works?year=2024', truncateArray: true },
    { label: 'Filter by Type', description: '按类型 / By type', path: '/api/works?type=Installation', truncateArray: true },
    { label: 'Single Work', description: '单件作品 / Single work', path: `/api/works/${slug}` },
  ]

  const [responses, setResponses] = useState<Record<string, string>>({})
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  useEffect(() => {
    endpoints.forEach((ep) => {
      fetch(ep.path)
        .then((res) => res.json())
        .then((data) => {
          let display: string
          if (ep.truncateArray && Array.isArray(data)) {
            const preview = data.slice(0, 2)
            display = highlightJson(preview)
            if (data.length > 2) {
              display = display.slice(0, -1) + `  // ... ${data.length} works total\n]`
            }
          } else {
            display = highlightJson(data)
          }
          setResponses((prev) => ({ ...prev, [ep.path]: display }))
        })
        .catch((err) => {
          setResponses((prev) => ({ ...prev, [ep.path]: `// Error: ${err.message}` }))
        })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copyCommand = useCallback((path: string) => {
    const cmd = path.includes('?')
      ? `curl "${origin}${path}"`
      : `curl ${origin}${path}`
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(null), 2000)
    })
  }, [origin])

  return (
    <div className="curl-tab">
      {endpoints.map((ep) => (
        <div key={ep.path} className="curl-example">
          <div className="curl-example-header">
            <span className="curl-label">{ep.label}</span>
            <span className="curl-desc">{ep.description}</span>
          </div>
          <div className="curl-command-row">
            <code className="curl-command">
              {ep.path.includes('?')
                ? `curl "${origin}${ep.path}"`
                : `curl ${origin}${ep.path}`}
            </code>
            <button
              className="curl-copy-btn"
              onClick={() => copyCommand(ep.path)}
            >
              {copiedPath === ep.path ? 'copied' : 'copy'}
            </button>
          </div>
          <pre
            className="curl-response"
            dangerouslySetInnerHTML={{ __html: responses[ep.path] ?? '// loading...' }}
          />
        </div>
      ))}
    </div>
  )
}
