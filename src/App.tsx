import { useEffect, useState } from 'react'
import type { Work } from './lib/jsonToMarkdown'
import { jsonToMarkdown } from './lib/jsonToMarkdown'
import { Portfolio } from './components/Portfolio'
import { ApiHint } from './components/ApiHint'
import { SiteHeader } from './components/SiteHeader'
import { useTheme } from './hooks/useTheme'

function downloadMarkdown(works: Work[]) {
  const markdown = jsonToMarkdown(works)
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'aaajiao_works.md'
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    fetch('/api/works')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Work[]) => {
        data.sort((a, b) => {
          const endYear = (y: string) => parseInt(y.split('-').pop()!) || 0
          return endYear(b.year) - endYear(a.year)
        })
        setWorks(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-title">aaajiao</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-screen">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <SiteHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          onDownload={() => downloadMarkdown(works)}
        />
        <Portfolio works={works} />
        <ApiHint />
      </div>
    </div>
  )
}
