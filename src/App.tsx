import { useEffect, useState } from 'react'
import type { Work } from './lib/jsonToMarkdown'
import { jsonToMarkdown } from './lib/jsonToMarkdown'
import { MdTab } from './components/MdTab'
import { CurlTab } from './components/CurlTab'
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
  const [activeTab, setActiveTab] = useState<'.md' | 'curl'>('.md')
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <span className="font-display text-[2rem] font-medium text-foreground animate-pulse-soft">aaajiao</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface font-display text-[#D44] text-[0.9rem]">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <SiteHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {activeTab === '.md'
          ? <MdTab works={works} onDownload={() => downloadMarkdown(works)} />
          : <CurlTab works={works} />
        }
      </div>
    </div>
  )
}
