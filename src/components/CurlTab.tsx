import { useState, useEffect, useCallback } from 'react'
import { highlightJson } from '../lib/jsonHighlight'
import type { Work } from '../../shared/types'

interface Endpoint {
  label: string
  description: string
  path: string
  truncateArray?: boolean
  acceptHeader?: string
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
    { label: 'Markdown', description: '内容协商 / Content negotiation', path: '/api/works', acceptHeader: 'text/markdown' },
    { label: 'Binary', description: '原始字节 / Raw bytes', path: '/api/works', acceptHeader: 'application/octet-stream' },
  ]

  const [responses, setResponses] = useState<Record<string, string>>({})
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const endpointKey = (ep: Endpoint) => ep.acceptHeader ? `${ep.path}@${ep.acceptHeader}` : ep.path

  useEffect(() => {
    endpoints.forEach((ep) => {
      const key = endpointKey(ep)
      const headers: HeadersInit = ep.acceptHeader ? { Accept: ep.acceptHeader } : {}

      fetch(ep.path, { headers })
        .then((res) => {
          if (ep.acceptHeader === 'application/octet-stream') {
            return res.arrayBuffer().then((buf) => {
              const display = `// ${buf.byteLength.toLocaleString()} bytes received\n// Content-Type: application/octet-stream\n// UTF-8 encoded JSON as raw bytes`
              setResponses((prev) => ({ ...prev, [key]: display }))
            })
          }
          if (ep.acceptHeader === 'text/markdown') {
            return res.text().then((text) => {
              const tokens = res.headers.get('x-markdown-tokens')
              const lines = text.split('\n')
              const preview = lines.slice(0, 20).join('\n')
              let display = preview
              if (lines.length > 20) {
                display += `\n\n// ... ${lines.length} lines total`
              }
              if (tokens) {
                display += `\n// x-markdown-tokens: ${tokens}`
              }
              setResponses((prev) => ({ ...prev, [key]: display }))
            })
          }
          return res.json().then((data) => {
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
            setResponses((prev) => ({ ...prev, [key]: display }))
          })
        })
        .catch((err) => {
          setResponses((prev) => ({ ...prev, [key]: `// Error: ${err.message}` }))
        })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const curlCommand = (ep: Endpoint) => {
    const acceptFlag = ep.acceptHeader ? `-H "Accept: ${ep.acceptHeader}" ` : ''
    const url = ep.path.includes('?') ? `"${origin}${ep.path}"` : `${origin}${ep.path}`
    return `curl ${acceptFlag}${url}`
  }

  const copyCommand = useCallback((ep: Endpoint) => {
    const cmd = curlCommand(ep)
    const key = endpointKey(ep)
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedPath(key)
      setTimeout(() => setCopiedPath(null), 2000)
    })
  }, [origin]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-8 mt-4">
      {endpoints.map((ep) => {
        const key = endpointKey(ep)
        const isPlainText = !!ep.acceptHeader
        return (
          <div key={key} className="border border-border rounded-sm overflow-hidden">
            <div className="flex items-baseline gap-3 px-[0.9rem] py-[0.6rem] border-b border-border bg-code">
              <span className="font-display text-[0.8rem] font-medium text-foreground">{ep.label}</span>
              <span className="font-display text-[0.7rem] text-subtle">{ep.description}</span>
            </div>
            <div className="flex items-center justify-between px-[0.9rem] py-2 border-b border-border bg-surface-elevated">
              <code className="font-display text-[0.78rem] text-foreground overflow-x-auto whitespace-nowrap">
                {curlCommand(ep)}
              </code>
              <button
                className="font-display text-[0.68rem] tracking-[0.04em] px-2 py-[0.2rem] border border-border rounded-sm bg-transparent text-muted cursor-pointer transition-colors duration-200 hover:text-foreground hover:border-foreground shrink-0 ml-3"
                onClick={() => copyCommand(ep)}
              >
                {copiedPath === key ? 'copied' : 'copy'}
              </button>
            </div>
            {isPlainText ? (
              <pre className="font-display text-[0.72rem] leading-[1.5] text-muted px-[0.9rem] py-[0.8rem] m-0 max-h-80 overflow-y-auto whitespace-pre-wrap break-all">
                {responses[key] ?? '// loading...'}
              </pre>
            ) : (
              <pre
                className="font-display text-[0.72rem] leading-[1.5] text-muted px-[0.9rem] py-[0.8rem] m-0 max-h-80 overflow-y-auto whitespace-pre-wrap break-all"
                dangerouslySetInnerHTML={{ __html: responses[key] ?? '// loading...' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
