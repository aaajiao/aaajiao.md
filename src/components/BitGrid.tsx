import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { prepareWithSegments } from '@chenglou/pretext'
import type { FieldRegion } from '../lib/byteOffsetMap'
import { findRegion } from '../lib/byteOffsetMap'
import { useContainerWidth } from '../hooks/useContainerWidth'
import type { BreathingState } from '../hooks/useBreathingDecode'

interface BitGridProps {
  bytes: Uint8Array
  regions: FieldRegion[]
  theme: string
  breathingState: BreathingState | null
  onInteractionChange?: (active: boolean) => void
  onVisibleRangeChange?: (startByte: number, endByte: number) => void
}

function parseCssHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

interface InteractionState {
  region: FieldRegion
  byteIndex: number
  pos: { x: number; y: number }
}

interface OverlayCard {
  path: string
  left: number
  top: number
  opacity: number
  locked: boolean
  byteIndex: number
  region: FieldRegion
  displayValue: string
}

export function BitGrid({ bytes, regions, theme, breathingState, onInteractionChange, onVisibleRangeChange }: BitGridProps) {
  const [containerRef, containerWidth] = useContainerWidth()
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  const [hoverState, setHoverState] = useState<InteractionState | null>(null)
  const [lockState, setLockState] = useState<InteractionState | null>(null)

  const targetPixelSize = containerWidth >= 640 ? 3 : 2
  const columnsPerRow =
    containerWidth > 0 ? Math.max(8, (Math.floor(containerWidth / targetPixelSize) >> 3) << 3) : 0
  const totalBits = bytes.length * 8
  const numRows = columnsPerRow > 0 ? Math.ceil(totalBits / columnsPerRow) : 0
  const displayHeight = columnsPerRow > 0 ? numRows * (containerWidth / columnsPerRow) : 0
  const pixelSize = columnsPerRow > 0 ? containerWidth / columnsPerRow : 0

  // Draw base bitmap
  useEffect(() => {
    const canvas = baseCanvasRef.current
    if (!canvas || columnsPerRow === 0 || bytes.length === 0) return

    const ctx = canvas.getContext('2d')!
    canvas.width = columnsPerRow
    canvas.height = numRows

    const style = getComputedStyle(document.documentElement)
    const fg = parseCssHex(style.getPropertyValue('--text-primary').trim())
    const bg = parseCssHex(style.getPropertyValue('--bg').trim())

    const imgData = ctx.createImageData(columnsPerRow, numRows)
    const d = imgData.data
    for (let bi = 0; bi < totalBits; bi++) {
      const byte = bytes[bi >> 3]
      const bit = (byte >> (7 - (bi & 7))) & 1
      const idx = bi * 4
      const c = bit ? fg : bg
      d[idx] = c[0]; d[idx + 1] = c[1]; d[idx + 2] = c[2]; d[idx + 3] = 255
    }
    const total = columnsPerRow * numRows
    for (let bi = totalBits; bi < total; bi++) {
      const idx = bi * 4
      d[idx] = bg[0]; d[idx + 1] = bg[1]; d[idx + 2] = bg[2]; d[idx + 3] = 255
    }
    ctx.putImageData(imgData, 0, 0)

    const overlay = overlayCanvasRef.current
    if (overlay) { overlay.width = columnsPerRow; overlay.height = numRows }
  }, [bytes, theme, columnsPerRow, numRows, totalBits])

  // Report visible byte range on scroll/resize
  useEffect(() => {
    if (!onVisibleRangeChange || columnsPerRow === 0 || !containerRef.current) return
    const update = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const ps = rect.width / columnsPerRow
      const viewTop = Math.max(0, -rect.top)
      const viewBottom = Math.min(rect.height, window.innerHeight - rect.top)
      if (viewBottom <= viewTop) return
      const startByte = Math.floor((Math.floor(viewTop / ps) * columnsPerRow) / 8)
      const endByte = Math.min(bytes.length, Math.ceil((Math.ceil(viewBottom / ps) * columnsPerRow) / 8))
      onVisibleRangeChange(startByte, endByte)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [onVisibleRangeChange, columnsPerRow, bytes.length, containerRef])

  // Draw overlay: hover/click highlight OR breathing decode on bitmap
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas || columnsPerRow === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const active = lockState ?? hoverState
    const style = getComputedStyle(document.documentElement)

    if (active) {
      // Hover/click: tinted highlight
      const accent = style.getPropertyValue('--accent').trim()
      const [ar, ag, ab] = parseCssHex(accent)
      const alpha = lockState ? 0.35 : 0.2
      ctx.fillStyle = `rgba(${ar},${ag},${ab},${alpha})`

      const startBit = active.region.start * 8
      const endBit = active.region.end * 8
      const startRow = Math.floor(startBit / columnsPerRow)
      const endRow = Math.floor(Math.max(0, endBit - 1) / columnsPerRow)

      for (let row = startRow; row <= endRow; row++) {
        const rowStart = row * columnsPerRow
        const rowEnd = rowStart + columnsPerRow
        const hlStart = Math.max(startBit, rowStart) - rowStart
        const hlEnd = Math.min(endBit, rowEnd) - rowStart
        ctx.fillRect(hlStart, row, hlEnd - hlStart, 1)
      }
      return
    }

    // Breathing: sequential decode directly on the overlay canvas at bitmap resolution
    if (!breathingState || breathingState.progress <= 0) return

    const { region, progress } = breathingState
    const BITMAP_FONT = '5px sans-serif'

    // Decode text + Pretext segments
    const regionBytes = bytes.slice(region.start, region.end)
    const regionText = new TextDecoder('utf-8', { fatal: false }).decode(regionBytes)
    const prepared = prepareWithSegments(regionText, BITMAP_FONT)
    const totalSegs = prepared.segments.length
    const decodedSegs = Math.round(progress * totalSegs)
    if (decodedSegs === 0) return

    // Erase decoded bits with bg, then draw text at bitmap scale
    const bg = parseCssHex(style.getPropertyValue('--bg').trim())
    const accent = style.getPropertyValue('--accent').trim()

    // Track bitmap cursor for the region's bytes
    const regionStartBit = region.start * 8
    let bitCursor = regionStartBit

    // Walk through segments: erase decoded ones and draw text
    ctx.font = BITMAP_FONT
    ctx.textBaseline = 'top'

    for (let s = 0; s < totalSegs; s++) {
      const seg = prepared.segments[s]
      const segByteLen = new TextEncoder().encode(seg).length
      const segBitLen = segByteLen * 8

      if (s < decodedSegs) {
        // Erase the bits for this segment
        const segStartBit = bitCursor
        const segEndBit = bitCursor + segBitLen
        const startRow = Math.floor(segStartBit / columnsPerRow)
        const endRow = Math.floor(Math.max(0, segEndBit - 1) / columnsPerRow)

        ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`
        for (let row = startRow; row <= endRow; row++) {
          const rowStart = row * columnsPerRow
          const rowEnd = rowStart + columnsPerRow
          const hlStart = Math.max(segStartBit, rowStart) - rowStart
          const hlEnd = Math.min(segEndBit, rowEnd) - rowStart
          ctx.fillRect(hlStart, row, hlEnd - hlStart, 1)
        }

        // Draw text at the start position of this segment
        const textCol = segStartBit % columnsPerRow
        const textRow = Math.floor(segStartBit / columnsPerRow)
        ctx.fillStyle = accent
        ctx.fillText(seg, textCol, textRow)
      }

      bitCursor += segBitLen
    }
  }, [hoverState, lockState, breathingState, columnsPerRow, bytes])

  // Overlay card (tooltip) for hover/click/breathing
  const overlayCard = useMemo((): OverlayCard | null => {
    if (containerWidth <= 0 || columnsPerRow === 0) return null
    const active = lockState ?? hoverState
    const breathing = !active ? breathingState : null
    const region = active?.region ?? breathing?.region
    if (!region) return null
    if (breathing && breathing.progress <= 0) return null

    const byteIndex = active?.byteIndex ?? region.start
    const displayValue = region.value.length > 80 ? region.value.slice(0, 77) + '...' : region.value

    let posX: number, posY: number
    if (active) {
      posX = active.pos.x; posY = active.pos.y
    } else {
      const startBit = region.start * 8
      const startRow = Math.floor(startBit / columnsPerRow)
      posX = containerWidth / 2
      posY = startRow * pixelSize
    }

    const margin = 140
    return {
      path: `works${region.path}`,
      left: Math.max(margin, Math.min(posX, containerWidth - margin)),
      top: posY - 8,
      opacity: active ? 1 : breathing?.progress ?? 0,
      locked: !!lockState, byteIndex, region, displayValue,
    }
  }, [hoverState, lockState, breathingState, containerWidth, columnsPerRow, pixelSize])

  // Decode rows for card
  const decodeRows = useMemo(() => {
    if (!overlayCard) return null
    const { byteIndex, region } = overlayCard
    const start = Math.max(region.start, byteIndex - 1)
    const end = Math.min(region.end, start + 4)
    const binaryParts: { text: string; active: boolean }[] = []
    const hexParts: { text: string; active: boolean }[] = []
    for (let i = start; i < end; i++) {
      const b = bytes[i]; const active = i === byteIndex
      binaryParts.push({ text: b.toString(2).padStart(8, '0'), active })
      hexParts.push({ text: b.toString(16).padStart(2, '0').toUpperCase(), active })
    }
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(start, end))
    return { binaryParts, hexParts, decoded }
  }, [overlayCard, bytes])

  // Hit test
  const hitTest = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): InteractionState | null => {
      const x = clientX - rect.left; const y = clientY - rect.top
      const ps = rect.width / columnsPerRow
      const col = Math.floor(x / ps); const row = Math.floor(y / ps)
      const bitIndex = row * columnsPerRow + col
      const byteIndex = bitIndex >> 3
      if (byteIndex < 0 || byteIndex >= bytes.length) return null
      const region = findRegion(regions, byteIndex)
      if (!region) return null
      return { region, byteIndex, pos: { x, y } }
    },
    [bytes, regions, columnsPerRow],
  )

  useEffect(() => {
    onInteractionChange?.(hoverState !== null || lockState !== null)
  }, [hoverState, lockState, onInteractionChange])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (lockState) return
    cancelAnimationFrame(rafRef.current)
    const rect = e.currentTarget.getBoundingClientRect()
    const { clientX, clientY } = e
    rafRef.current = requestAnimationFrame(() => { setHoverState(hitTest(clientX, clientY, rect)) })
  }, [hitTest, lockState])

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (!lockState) setHoverState(null)
  }, [lockState])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (lockState) { setLockState(null); setHoverState(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    const hit = hitTest(e.clientX, e.clientY, rect)
    if (hit) setLockState(hit)
  }, [hitTest, lockState])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]; if (!touch) return
    const rect = e.currentTarget.getBoundingClientRect()
    const hit = hitTest(touch.clientX, touch.clientY, rect)
    if (lockState) { setLockState(null); setHoverState(null); return }
    if (hit) { e.preventDefault(); setLockState(hit) }
  }, [hitTest, lockState])

  useEffect(() => {
    if (!lockState) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setLockState(null); setHoverState(null) } }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [lockState])

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: displayHeight,
    imageRendering: 'pixelated',
  }

  return (
    <div ref={containerRef} className="relative mt-4 select-none">
      <canvas ref={baseCanvasRef} className="block" style={canvasStyle} />
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0"
        style={{ ...canvasStyle, pointerEvents: 'none' }}
      />
      <div
        className="absolute top-0 left-0 w-full cursor-crosshair"
        style={{ height: displayHeight }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
      />
      {overlayCard && decodeRows && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: overlayCard.left, top: overlayCard.top,
            opacity: overlayCard.opacity,
            transform: 'translate(-50%, -100%)', maxWidth: 340,
          }}
        >
          <div
            className={`bg-surface-elevated border rounded-sm px-3 py-2 shadow-sm ${
              overlayCard.locked ? 'border-accent/60' : 'border-border'
            }`}
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          >
            <div className="font-display text-[0.7rem] leading-[1.7]">
              <div className="flex gap-[0.6ch] whitespace-nowrap">
                {decodeRows.binaryParts.map((p, i) => (
                  <span key={i} className={p.active ? 'text-accent font-medium' : 'text-subtle'}>{p.text}</span>
                ))}
              </div>
              <div className="flex gap-[0.6ch] whitespace-nowrap">
                {decodeRows.hexParts.map((p, i) => (
                  <span key={i} className={p.active ? 'text-accent' : 'text-subtle'}>{p.text}</span>
                ))}
              </div>
              <div className="text-foreground whitespace-nowrap">{decodeRows.decoded}</div>
            </div>
            <div className="border-t border-border my-2" />
            <div className="font-display text-[0.65rem] text-subtle tracking-[0.02em]">{overlayCard.path}</div>
            <div
              className="font-display text-[0.72rem] mt-1 break-all leading-[1.5]"
              dangerouslySetInnerHTML={{
                __html: `<span class="json-key">"${escapeHtml(overlayCard.region.key)}"</span>: <span class="text-muted">${escapeHtml(overlayCard.displayValue)}</span>`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
