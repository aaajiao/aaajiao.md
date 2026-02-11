import { useRef, useEffect, useState, useCallback } from 'react'
import type { FieldRegion } from '../lib/byteOffsetMap'
import { findRegion } from '../lib/byteOffsetMap'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { DecodeOverlay } from './DecodeOverlay'

interface BitGridProps {
  bytes: Uint8Array
  regions: FieldRegion[]
  theme: string
}

function parseCssHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

interface InteractionState {
  region: FieldRegion
  byteIndex: number
  pos: { x: number; y: number }
}

export function BitGrid({ bytes, regions, theme }: BitGridProps) {
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

  // Draw overlay highlight
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas || columnsPerRow === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const active = lockState ?? hoverState
    if (!active) return

    const style = getComputedStyle(document.documentElement)
    const accent = style.getPropertyValue('--accent').trim()
    const hex = accent.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const alpha = lockState ? 0.35 : 0.2

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`

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
  }, [hoverState, lockState, columnsPerRow])

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (lockState) return
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const rect = e.currentTarget.getBoundingClientRect()
        setHoverState(hitTest(e.clientX, e.clientY, rect))
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
