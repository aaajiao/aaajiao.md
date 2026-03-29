import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import type { FieldRegion } from '../lib/byteOffsetMap'
import { findRegion } from '../lib/byteOffsetMap'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { DecodeOverlay } from './DecodeOverlay'

interface TextGridProps {
  text: string
  bytes: Uint8Array
  regions: FieldRegion[]
  theme: string
}

const FONT_SIZE = 9
const LINE_HEIGHT = 12
const FONT = `${FONT_SIZE}px "IBM Plex Sans", sans-serif`

interface InteractionState {
  region: FieldRegion
  byteIndex: number
  pos: { x: number; y: number }
}

function cursorToCharIndex(
  segments: string[],
  cursor: { segmentIndex: number; graphemeIndex: number },
): number {
  let idx = 0
  for (let s = 0; s < cursor.segmentIndex; s++) {
    idx += segments[s].length
  }
  return idx + cursor.graphemeIndex
}

function buildCharToByteMap(str: string): number[] {
  const map: number[] = new Array(str.length + 1)
  let bytePos = 0
  for (let i = 0; i < str.length; i++) {
    map[i] = bytePos
    const c = str.charCodeAt(i)
    if (c < 0x80) bytePos += 1
    else if (c < 0x800) bytePos += 2
    else if (c >= 0xd800 && c <= 0xdbff) {
      i++
      if (i < str.length) map[i] = bytePos
      bytePos += 4
    } else bytePos += 3
  }
  map[str.length] = bytePos
  return map
}

function byteToCharIdx(charToByteMap: number[], byteOffset: number): number {
  let lo = 0
  let hi = charToByteMap.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (charToByteMap[mid] < byteOffset) lo = mid + 1
    else hi = mid
  }
  return lo
}

function parseCssHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function TextGrid({ text, bytes, regions, theme }: TextGridProps) {
  const [containerRef, containerWidth] = useContainerWidth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rafRef = useRef(0)

  const [hoverState, setHoverState] = useState<InteractionState | null>(null)
  const [lockState, setLockState] = useState<InteractionState | null>(null)

  const charToByteMap = useMemo(() => buildCharToByteMap(text), [text])

  // Pretext: prepare once (expensive ~20ms)
  const prepared = useMemo(() => {
    return prepareWithSegments(text, FONT)
  }, [text])

  // Pretext: layout on resize (fast ~0.1ms)
  const layoutData = useMemo(() => {
    if (containerWidth <= 0) return null
    const result = layoutWithLines(prepared, containerWidth, LINE_HEIGHT)

    const lineCharOffsets: number[] = result.lines.map((line) =>
      cursorToCharIndex(prepared.segments, line.start),
    )

    return {
      lines: result.lines,
      height: result.height,
      lineCount: result.lineCount,
      lineCharOffsets,
    }
  }, [prepared, containerWidth])

  const getEffectiveDpr = useCallback(() => {
    const dpr = window.devicePixelRatio || 1
    const height = layoutData?.height ?? 0
    const maxDim = 16384
    return height * dpr > maxDim ? Math.max(1, Math.floor(maxDim / height)) : dpr
  }, [layoutData])

  const getMeasureCtx = useCallback(() => {
    if (!measureCtxRef.current) {
      const c = document.createElement('canvas')
      const ctx = c.getContext('2d')!
      ctx.font = FONT
      measureCtxRef.current = ctx
    }
    return measureCtxRef.current
  }, [])

  // Render text to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !layoutData || containerWidth <= 0) return

    const { lines, height } = layoutData
    const dpr = getEffectiveDpr()

    canvas.width = Math.ceil(containerWidth * dpr)
    canvas.height = Math.ceil(height * dpr)

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const style = getComputedStyle(document.documentElement)
    const fg = style.getPropertyValue('--text-primary').trim()

    ctx.clearRect(0, 0, containerWidth, height)
    ctx.font = FONT
    ctx.fillStyle = fg
    ctx.textBaseline = 'top'

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i].text, 0, i * LINE_HEIGHT)
    }

    // Size overlay to match
    const overlay = overlayCanvasRef.current
    if (overlay) {
      overlay.width = Math.ceil(containerWidth * dpr)
      overlay.height = Math.ceil(height * dpr)
    }
  }, [layoutData, theme, containerWidth, getEffectiveDpr])

  // Draw overlay highlight
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas || !layoutData) return
    const ctx = canvas.getContext('2d')!

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const active = lockState ?? hoverState
    if (!active) return

    const dpr = getEffectiveDpr()
    ctx.scale(dpr, dpr)

    const style = getComputedStyle(document.documentElement)
    const accent = style.getPropertyValue('--accent').trim()
    const [r, g, b] = parseCssHex(accent)
    const alpha = lockState ? 0.35 : 0.2

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
    ctx.font = FONT

    const regionCharStart = byteToCharIdx(charToByteMap, active.region.start)
    const regionCharEnd = byteToCharIdx(charToByteMap, active.region.end)

    const { lines, lineCharOffsets } = layoutData
    for (let i = 0; i < lines.length; i++) {
      const lineStart = lineCharOffsets[i]
      const lineEnd = lineStart + lines[i].text.length

      if (lineEnd <= regionCharStart || lineStart >= regionCharEnd) continue

      const localStart = Math.max(0, regionCharStart - lineStart)
      const localEnd = Math.min(lines[i].text.length, regionCharEnd - lineStart)

      const xStart =
        localStart > 0 ? ctx.measureText(lines[i].text.slice(0, localStart)).width : 0
      const xEnd = ctx.measureText(lines[i].text.slice(0, localEnd)).width

      ctx.fillRect(xStart, i * LINE_HEIGHT, xEnd - xStart, LINE_HEIGHT)
    }
  }, [hoverState, lockState, layoutData, charToByteMap, getEffectiveDpr])

  // Hit test
  const hitTest = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): InteractionState | null => {
      if (!layoutData) return null

      const x = clientX - rect.left
      const y = clientY - rect.top
      const { lines, lineCharOffsets } = layoutData

      const lineIdx = Math.floor(y / LINE_HEIGHT)
      if (lineIdx < 0 || lineIdx >= lines.length) return null

      const lineText = lines[lineIdx].text
      if (lineText.length === 0) return null

      // Binary search for character at x position
      const mCtx = getMeasureCtx()
      let lo = 0
      let hi = lineText.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        const w = mCtx.measureText(lineText.slice(0, mid + 1)).width
        if (w <= x) lo = mid + 1
        else hi = mid
      }

      const globalCharIdx = lineCharOffsets[lineIdx] + lo
      if (globalCharIdx >= charToByteMap.length) return null

      const byteOffset = charToByteMap[globalCharIdx]
      const region = findRegion(regions, byteOffset)
      if (!region) return null

      return { region, byteIndex: byteOffset, pos: { x, y } }
    },
    [layoutData, regions, charToByteMap, getMeasureCtx],
  )

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
    [hitTest, lockState],
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
    [hitTest, lockState],
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
    [hitTest, lockState],
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
  const displayHeight = layoutData?.height ?? 0

  const canvasStyle: React.CSSProperties = {
    width: containerWidth || '100%',
    height: displayHeight,
  }

  return (
    <div ref={containerRef} className="relative mt-4 select-none">
      <canvas ref={canvasRef} className="block" style={canvasStyle} />
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 block"
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
