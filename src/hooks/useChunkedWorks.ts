import { useState, useEffect, useRef, useCallback } from 'react'
import type { Work } from '../../shared/types'

const CHUNK_SIZE = 10

export function useChunkedWorks(works: Work[]) {
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const hasMore = visibleCount < works.length

  const chunks: Work[][] = []
  for (let i = 0; i < visibleCount && i < works.length; i += CHUNK_SIZE) {
    chunks.push(works.slice(i, Math.min(i + CHUNK_SIZE, visibleCount, works.length)))
  }

  const latestChunkIndex = chunks.length - 1

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, works.length))
      }
    },
    [works.length]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    })
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMore, handleIntersect])

  return { chunks, hasMore, sentinelRef, latestChunkIndex }
}
