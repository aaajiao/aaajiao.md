import { Streamdown } from 'streamdown'
import { useChunkedWorks } from '../hooks/useChunkedWorks'
import {
  headerMarkdown,
  worksChunkToMarkdown,
} from '../lib/jsonToMarkdown'
import type { Work } from '../../shared/types'

interface PortfolioProps {
  works: Work[]
}

export function Portfolio({ works }: PortfolioProps) {
  const { chunks, hasMore, sentinelRef, latestChunkIndex } =
    useChunkedWorks(works)

  return (
    <div>
      <div className="prose max-w-none">
        <Streamdown mode="static" linkSafety={{ enabled: false }}>{headerMarkdown()}</Streamdown>
        {chunks.map((chunk, i) => (
          <div
            key={i}
            className={i === latestChunkIndex && i > 0 ? 'chunk-enter' : ''}
          >
            <Streamdown mode="static" linkSafety={{ enabled: false }}>
              {worksChunkToMarkdown(chunk)}
            </Streamdown>
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="loading-sentinel">
          loading&hellip;
        </div>
      )}
    </div>
  )
}
