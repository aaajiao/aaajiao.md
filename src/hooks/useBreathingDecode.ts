import { useState, useEffect, useRef, useCallback } from 'react'
import type { FieldRegion } from '../lib/byteOffsetMap'

export interface BreathingState {
  region: FieldRegion
  /** 0→1 during decode, 1 during hold, 1→0 during encode. Represents fraction of segments decoded. */
  progress: number
}

const DECODE = 2000
const HOLD = 2000
const ENCODE = 2000
const CYCLE = DECODE + HOLD + ENCODE

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

    const visible = regions.filter(
      (r) => r.end > range.startByte && r.start < range.endByte,
    )
    if (visible.length === 0) return null

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
        const picked = pickRegion()
        if (picked) prevRegionRef.current = picked
      }

      const elapsed = now - startRef.current
      const phase = elapsed % CYCLE

      let progress: number
      if (phase < DECODE) {
        progress = easeInOut(phase / DECODE)
      } else if (phase < DECODE + HOLD) {
        progress = 1
      } else {
        progress = 1 - easeInOut((phase - DECODE - HOLD) / ENCODE)
      }

      // At cycle boundary, pick next visible region
      if (elapsed >= CYCLE && phase < 50) {
        startRef.current = now
        const picked = pickRegion()
        if (picked) prevRegionRef.current = picked
      }

      if (prevRegionRef.current) {
        setState({ region: prevRegionRef.current, progress })
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
