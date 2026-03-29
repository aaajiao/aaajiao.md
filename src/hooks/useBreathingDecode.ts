import { useState, useEffect, useRef, useCallback } from 'react'
import type { FieldRegion } from '../lib/byteOffsetMap'

export interface BreathingState {
  region: FieldRegion
  opacity: number
}

const FADE_IN = 1000
const HOLD = 2500
const FADE_OUT = 1000
const CYCLE = FADE_IN + HOLD + FADE_OUT

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

export function useBreathingDecode(
  regions: FieldRegion[],
  getVisibleRange?: () => { startByte: number; endByte: number } | null,
) {
  const [state, setState] = useState<BreathingState | null>(null)
  const pausedRef = useRef(false)
  const prevRegionRef = useRef<FieldRegion | null>(null)
  const startRef = useRef(0)
  const rafRef = useRef(0)

  const pickRegion = useCallback(() => {
    if (regions.length === 0) return null
    const range = getVisibleRange?.()
    if (!range) return regions[0]

    // Filter to regions overlapping the visible byte range
    const visible = regions.filter(
      (r) => r.end > range.startByte && r.start < range.endByte,
    )
    if (visible.length === 0) return null

    // Pick the next one after the previous, cycling within visible set
    const prevIdx = prevRegionRef.current
      ? visible.findIndex((r) => r === prevRegionRef.current)
      : -1
    return visible[(prevIdx + 1) % visible.length]
  }, [regions, getVisibleRange])

  const tick = useCallback(
    (now: number) => {
      if (regions.length === 0) return

      if (pausedRef.current) {
        setState(null)
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (startRef.current === 0) {
        startRef.current = now
        // Pick a region at cycle start
        const picked = pickRegion()
        if (picked) prevRegionRef.current = picked
      }

      const elapsed = now - startRef.current
      const phase = elapsed % CYCLE

      let opacity: number
      if (phase < FADE_IN) {
        opacity = easeInOut(phase / FADE_IN)
      } else if (phase < FADE_IN + HOLD) {
        opacity = 1
      } else {
        opacity = 1 - easeInOut((phase - FADE_IN - HOLD) / FADE_OUT)
      }

      // At cycle boundary, pick next visible region
      if (elapsed >= CYCLE && phase < 50) {
        startRef.current = now
        const picked = pickRegion()
        if (picked) prevRegionRef.current = picked
      }

      if (prevRegionRef.current) {
        setState({ region: prevRegionRef.current, opacity })
      } else {
        setState(null)
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [regions, pickRegion],
  )

  useEffect(() => {
    if (regions.length === 0) return
    startRef.current = 0
    prevRegionRef.current = null
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick, regions])

  const pause = useCallback(() => {
    pausedRef.current = true
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    startRef.current = 0
  }, [])

  return { state, pause, resume }
}
