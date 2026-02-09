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
            className={i === latestChunkIndex && i > 0 ? 'animate-fade-in' : ''}
          >
            {chunk.map((work) => (
              <WorkLayered key={work.url} work={work} showJson={showJson} />
            ))}
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center font-display text-[0.75rem] tracking-[0.06em] text-subtle animate-pulse-soft">
          loading&hellip;
        </div>
      )}
    </div>
  )
}
