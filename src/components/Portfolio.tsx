import { Streamdown } from 'streamdown'
import { useChunkedWorks } from '../hooks/useChunkedWorks'
import { headerMarkdown } from '../lib/jsonToMarkdown'
import { WorkLayered } from './WorkLayered'
import type { Work } from '../../shared/types'

interface PortfolioProps {
  works: Work[]
  showJson: boolean
}

export function Portfolio({ works, showJson }: PortfolioProps) {
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
            {chunk.map((work) => (
              <WorkLayered key={work.url} work={work} showJson={showJson} />
            ))}
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
