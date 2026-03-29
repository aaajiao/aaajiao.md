import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import type { FieldRegion } from '../lib/byteOffsetMap'
import { findRegion } from '../lib/byteOffsetMap'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { DecodeOverlay } from './DecodeOverlay'
import type { BreathingState } from '../hooks/useBreathingDecode'

interface BitGridProps {
  bytes: Uint8Array
  regions: FieldRegion[]
  theme: string
  breathingState: BreathingState | null
  onInteractionChange?: (active: boolean) => void
}

const TEXT_FONT = '13px "IBM Plex Sans", sans-serif'
const TEXT_LINE_HEIGHT = 19

function parseCssHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

interface InteractionState {
  region: FieldRegion
  byteIndex: number
  pos: { x: number; y: number }
}

export function BitGrid({ bytes, regions, theme, breathingState, onInteractionChange }: BitGridProps) {
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
      d[idx] = c[0]
      d[idx + 1] = c[1]
      d[idx + 2] = c[2]
      d[idx + 3] = 255
    }

    // Fill trailing pixels with bg
    const total = columnsPerRow * numRows
    for (let bi = totalBits; bi < total; bi++) {
      const idx = bi * 4
      d[idx] = bg[0]
      d[idx + 1] = bg[1]
      d[idx + 2] = bg[2]
      d[idx + 3] = 255
    }

    ctx.putImageData(imgData, 0, 0)

    // Size overlay canvas to match
    const overlay = overlayCanvasRef.current
    if (overlay) {
      overlay.width = columnsPerRow
      overlay.height = numRows
    }
  }, [bytes, theme, columnsPerRow, numRows, totalBits])

  // Draw overlay highlight (manual interaction OR breathing)
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas || columnsPerRow === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const active = lockState ?? hoverState
    const breathing = !active ? breathingState : null

    const region = active?.region ?? breathing?.region
    if (!region) return

    const style = getComputedStyle(document.documentElement)
    const accent = style.getPropertyValue('--accent').trim()
    const hex = accent.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)

    let alpha: number
    if (active) {
      alpha = lockState ? 0.35 : 0.2
    } else {
      alpha = (breathing?.opacity ?? 0) * 0.25
    }

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`

    const startBit = region.start * 8
    const endBit = region.end * 8
    const startRow = Math.floor(startBit / columnsPerRow)
    const endRow = Math.floor(Math.max(0, endBit - 1) / columnsPerRow)

    for (let row = startRow; row <= endRow; row++) {
      const rowStart = row * columnsPerRow
      const rowEnd = rowStart + columnsPerRow
      const hlStart = Math.max(startBit, rowStart) - rowStart
      const hlEnd = Math.min(endBit, rowEnd) - rowStart
      ctx.fillRect(hlStart, row, hlEnd - hlStart, 1)
    }
  }, [hoverState, lockState, breathingState, columnsPerRow])

  // Compute breathing text overlay position + lines via Pretext
  const breathingText = useMemo(() => {
    const active = lockState ?? hoverState
    if (active || !breathingState || breathingState.opacity <= 0) return null
    if (containerWidth <= 0 || columnsPerRow === 0) return null

    const { region, opacity } = breathingState
    const pixelSize = containerWidth / columnsPerRow

    const startBit = region.start * 8
    const endBit = region.end * 8
    const startRow = Math.floor(startBit / columnsPerRow)
    const endRow = Math.floor(Math.max(0, endBit - 1) / columnsPerRow)
    const yStart = startRow * pixelSize
    const yEnd = (endRow + 1) * pixelSize
    const regionHeight = yEnd - yStart

    let displayValue = region.value
    if (displayValue.startsWith('"') && displayValue.endsWith('"')) {
      displayValue = displayValue.slice(1, -1)
    }
    if (displayValue.length > 200) displayValue = displayValue.slice(0, 197) + '...'
    const displayText = `${region.key}: ${displayValue}`

    const prepared = prepareWithSegments(displayText, TEXT_FONT)
    const layout = layoutWithLines(prepared, containerWidth - 32, TEXT_LINE_HEIGHT)
    const textBlockHeight = layout.height

    let textY = yStart + (regionHeight - textBlockHeight) / 2
    textY = Math.max(4, Math.min(textY, displayHeight - textBlockHeight - 4))

    return {
      lines: layout.lines.map((l) => l.text),
      top: textY,
      opacity,
      maxWidth: layout.lines.reduce((max, l) => Math.max(max, l.width), 0),
    }
  }, [breathingState, hoverState, lockState, containerWidth, columnsPerRow, displayHeight])

  const hitTest = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): InteractionState | null => {
      const x = clientX - rect.left
      const y = clientY - rect.top
      const pixelSize = rect.width / columnsPerRow
      const col = Math.floor(x / pixelSize)
      const row = Math.floor(y / pixelSize)
      const bitIndex = row * columnsPerRow + col
      const byteIndex = bitIndex >> 3

      if (byteIndex < 0 || byteIndex >= bytes.length) return null

      const region = findRegion(regions, byteIndex)
      if (!region) return null

      return { region, byteIndex, pos: { x, y } }
    },
    [bytes, regions, columnsPerRow]
  )

  // Notify parent of interaction state for breathing pause/resume
  useEffect(() => {
    onInteractionChange?.(hoverState !== null || lockState !== null)
  }, [hoverState, lockState, onInteractionChange])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (lockState) return
      cancelAnimationFrame(rafRef.current)
      const rect = e.currentTarget.getBoundingClientRect()
      const { clientX, clientY } = e
      rafRef.current = requestAnimationFrame(() => {
        setHoverState(hitTest(clientX, clientY, rect))
      })
    },
    [hitTest, lockState]
  )

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (!lockState) setHoverState(null)
  }, [lockState])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (lockState) {
        setLockState(null)
        setHoverState(null)
        return
      }
      const rect = e.currentTarget.getBoundingClientRect()
      const hit = hitTest(e.clientX, e.clientY, rect)
      if (hit) setLockState(hit)
    },
    [hitTest, lockState]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0]
      if (!touch) return
      const rect = e.currentTarget.getBoundingClientRect()
      const hit = hitTest(touch.clientX, touch.clientY, rect)

      if (lockState) {
        setLockState(null)
        setHoverState(null)
        return
      }

      if (hit) {
        e.preventDefault()
        setLockState(hit)
      }
    },
    [hitTest, lockState]
  )

  // Escape key dismisses lock
  useEffect(() => {
    if (!lockState) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLockState(null)
        setHoverState(null)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [lockState])

  const activeState = lockState ?? hoverState

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
      {breathingText && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-10"
          style={{ top: breathingText.top, opacity: breathingText.opacity }}
        >
          <div
            className="mx-4 px-4 py-3 rounded-sm bg-surface/90 border border-border/50 shadow-sm backdrop-blur-sm"
            style={{ maxWidth: breathingText.maxWidth + 32 }}
          >
            {breathingText.lines.map((line, i) => (
              <div
                key={i}
                className="font-body text-[13px] leading-[19px] text-foreground"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        className="absolute top-0 left-0 w-full cursor-crosshair"
        style={{ height: displayHeight }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
      />
      {activeState && (
        <DecodeOverlay
          region={activeState.region}
          bytes={bytes}
          byteIndex={activeState.byteIndex}
          locked={!!lockState}
          pos={activeState.pos}
          containerWidth={containerWidth}
        />
      )}
    </div>
  )
}
