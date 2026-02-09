import { Streamdown } from 'streamdown'

interface PortfolioProps {
  markdown: string
}

function downloadMarkdown(markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'aaajiao_works.md'
  a.click()
  URL.revokeObjectURL(url)
}

export function Portfolio({ markdown }: PortfolioProps) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => downloadMarkdown(markdown)}
          className="cursor-pointer rounded bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
        >
          下载 MD / Download MD
        </button>
      </div>
      <div className="prose prose-invert max-w-none">
        <Streamdown mode="static">{markdown}</Streamdown>
      </div>
    </div>
  )
}
