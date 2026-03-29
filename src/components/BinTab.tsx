import { useMemo, useCallback } from 'react'
import type { Work } from '../../shared/types'
import { buildByteOffsetMap } from '../lib/byteOffsetMap'
import { useBreathingDecode } from '../hooks/useBreathingDecode'
import { BitGrid } from './BitGrid'

interface BinTabProps {
  works: Work[]
  theme: string
}

export function BinTab({ works, theme }: BinTabProps) {
  const jsonString = useMemo(() => JSON.stringify(works, null, 2), [works])
  const bytes = useMemo(() => new TextEncoder().encode(jsonString), [jsonString])
  const regions = useMemo(() => buildByteOffsetMap(jsonString), [jsonString])
  const breathing = useBreathingDecode(regions)

  const handleInteractionChange = useCallback(
    (active: boolean) => {
      active ? breathing.pause() : breathing.resume()
    },
    [breathing.pause, breathing.resume],
  )

  return (
    <BitGrid
      bytes={bytes}
      regions={regions}
      theme={theme}
      breathingState={breathing.state}
      onInteractionChange={handleInteractionChange}
    />
  )
}
