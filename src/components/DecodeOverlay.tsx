import type { ReactElement } from 'react'
import type { FieldRegion } from '../lib/byteOffsetMap'

interface DecodeOverlayProps {
  region: FieldRegion
  bytes: Uint8Array
  byteIndex: number
  locked: boolean
  pos: { x: number; y: number }
  containerWidth: number
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function DecodeOverlay({ region, bytes, byteIndex, locked, pos, containerWidth }: DecodeOverlayProps) {
  const windowSize = 4
  const start = Math.max(region.start, byteIndex - 1)
  const end = Math.min(region.end, start + windowSize)
  const count = end - start

  const binarySpans: ReactElement[] = []
  const hexSpans: ReactElement[] = []

  for (let i = 0; i < count; i++) {
    const b = bytes[start + i]
    const active = start + i === byteIndex
    binarySpans.push(
      <span key={i} className={active ? 'text-accent font-medium' : 'text-subtle'}>
        {b.toString(2).padStart(8, '0')}
      </span>
    )
    hexSpans.push(
      <span key={i} className={active ? 'text-accent' : 'text-subtle'}>
        {b.toString(16).padStart(2, '0').toUpperCase()}
      </span>
    )
  }

  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(start, end))

  const margin = 140
  const left = Math.max(margin, Math.min(pos.x, containerWidth - margin))

  const displayValue = region.value.length > 80
    ? region.value.slice(0, 77) + '...'
    : region.value

  return (
    <div
      className="absolute z-50 bg-surface-elevated border border-border rounded-sm px-3 py-2 pointer-events-none"
      style={{
        left,
        top: pos.y - 8,
        transform: 'translate(-50%, -100%)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        maxWidth: 340,
      }}
    >
      <div className="font-display text-[0.7rem] leading-[1.7]">
        <div className="flex gap-[0.6ch] whitespace-nowrap">{binarySpans}</div>
        <div className="flex gap-[0.6ch] whitespace-nowrap">{hexSpans}</div>
        <div className="text-foreground whitespace-nowrap">{decoded}</div>
      </div>
      {locked && (
        <>
          <div className="border-t border-border my-2" />
          <div className="font-display text-[0.65rem] text-subtle tracking-[0.02em]">
            works{region.path}
          </div>
          <div
            className="font-display text-[0.72rem] mt-1 break-all leading-[1.5]"
            dangerouslySetInnerHTML={{
              __html: `<span class="json-key">"${escapeHtml(region.key)}"</span>: <span class="text-muted">${escapeHtml(displayValue)}</span>`,
            }}
          />
        </>
      )}
    </div>
  )
}
