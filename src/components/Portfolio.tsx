import { Streamdown } from 'streamdown'
import { useChunkedWorks } from '../hooks/useChunkedWorks'
import {
  jsonToMarkdown,
  headerMarkdown,
  worksChunkToMarkdown,
} from '../lib/jsonToMarkdown'
import type { Work } from '../../shared/types'

interface PortfolioProps {
  works: Work[]
}

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

export function Portfolio({ works }: PortfolioProps) {
  const { chunks, hasMore, sentinelRef, latestChunkIndex } =
    useChunkedWorks(works)

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => downloadMarkdown(works)}
          className="cursor-pointer rounded bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
        >
          下载 MD / Download MD
        </button>
      </div>
      <div className="prose prose-invert max-w-none">
        <Streamdown mode="static">{headerMarkdown()}</Streamdown>
        {chunks.map((chunk, i) => (
          <div
            key={i}
            className={i === latestChunkIndex && i > 0 ? 'chunk-enter' : ''}
          >
            <Streamdown mode="static">
              {worksChunkToMarkdown(chunk)}
            </Streamdown>
          </div>
        ))}
      </div>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="py-8 text-center text-zinc-500"
        >
          Loading more works...
        </div>
      )}
    </div>
  )
}
