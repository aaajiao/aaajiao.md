import { useMemo } from 'react'
import type { Work } from '../../shared/types'
import { buildByteOffsetMap } from '../lib/byteOffsetMap'
import { TextGrid } from './TextGrid'

interface TxtTabProps {
  works: Work[]
  theme: string
}

export function TxtTab({ works, theme }: TxtTabProps) {
  const jsonString = useMemo(() => JSON.stringify(works), [works])
  const bytes = useMemo(() => new TextEncoder().encode(jsonString), [jsonString])
  const regions = useMemo(() => buildByteOffsetMap(jsonString), [jsonString])

  return <TextGrid text={jsonString} bytes={bytes} regions={regions} theme={theme} />
}
