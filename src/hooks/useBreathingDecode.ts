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

export function useBreathingDecode(regions: FieldRegion[]) {
  const [state, setState] = useState<BreathingState | null>(null)
  const pausedRef = useRef(false)
  const indexRef = useRef(0)
  const startRef = useRef(0)
  const rafRef = useRef(0)

  const tick = useCallback(
    (now: number) => {
      if (regions.length === 0) return

      if (pausedRef.current) {
        setState(null)
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (startRef.current === 0) startRef.current = now

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

      // Advance to next region at cycle boundary
      const cycleIndex = Math.floor(elapsed / CYCLE)
      const regionIndex = cycleIndex % regions.length
      if (regionIndex !== indexRef.current) {
        indexRef.current = regionIndex
      }

      setState({ region: regions[regionIndex], opacity })
      rafRef.current = requestAnimationFrame(tick)
    },
    [regions],
  )

  useEffect(() => {
    if (regions.length === 0) return
    startRef.current = 0
    indexRef.current = 0
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
