import { useState, useEffect, useRef, useCallback } from 'react'
import type { FieldRegion } from '../lib/byteOffsetMap'

export interface BreathingSlot {
  region: FieldRegion
  opacity: number
}

const FADE_IN = 1200
const HOLD = 2000
const FADE_OUT = 1200
const CYCLE = FADE_IN + HOLD + FADE_OUT
const STAGGER = 1500 // new slot starts every 1.5s
const MAX_SLOTS = 3

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function opacityForElapsed(elapsed: number): number {
  if (elapsed < 0) return 0
  const phase = elapsed % CYCLE
  if (elapsed >= CYCLE) return 0 // slot finished
  if (phase < FADE_IN) return easeInOut(phase / FADE_IN)
  if (phase < FADE_IN + HOLD) return 1
  return 1 - easeInOut((phase - FADE_IN - HOLD) / FADE_OUT)
}

interface Slot {
  region: FieldRegion
  startTime: number
}

export function useBreathingDecode(
  regions: FieldRegion[],
  getVisibleRange?: () => { startByte: number; endByte: number } | null,
) {
  const [slots, setSlots] = useState<BreathingSlot[]>([])
  const pausedRef = useRef(false)
  const activeSlots = useRef<Slot[]>([])
  const usedIndices = useRef(new Set<number>())
  const rafRef = useRef(0)
  const baseTimeRef = useRef(0)

  const pickRegion = useCallback(() => {
    if (regions.length === 0) return null
    const range = getVisibleRange?.()
    if (!range) return null

    const visible = regions.filter(
      (r) => r.end > range.startByte && r.start < range.endByte,
    )
    if (visible.length === 0) return null

    // Pick a random visible region not currently active
    const activeRegions = new Set(activeSlots.current.map((s) => s.region))
    const available = visible.filter((r) => !activeRegions.has(r) && !usedIndices.current.has(regions.indexOf(r)))
    if (available.length === 0) {
      // Reset used set and try again
      usedIndices.current.clear()
      const retry = visible.filter((r) => !activeRegions.has(r))
      if (retry.length === 0) return null
      return retry[Math.floor(Math.random() * retry.length)]
    }
    return available[Math.floor(Math.random() * available.length)]
  }, [regions, getVisibleRange])

  const tick = useCallback(
    (now: number) => {
      if (regions.length === 0) return

      if (pausedRef.current) {
        setSlots([])
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (baseTimeRef.current === 0) baseTimeRef.current = now
      const elapsed = now - baseTimeRef.current

      // Spawn new slots at stagger intervals
      const expectedSlots = Math.min(MAX_SLOTS, Math.floor(elapsed / STAGGER) + 1)
      while (activeSlots.current.length < expectedSlots) {
        const picked = pickRegion()
        if (!picked) break
        activeSlots.current.push({ region: picked, startTime: now })
        usedIndices.current.add(regions.indexOf(picked))
      }

      // Update opacities, remove finished slots, spawn replacements
      const live: BreathingSlot[] = []
      const stillActive: Slot[] = []

      for (const slot of activeSlots.current) {
        const slotElapsed = now - slot.startTime
        const opacity = opacityForElapsed(slotElapsed)

        if (slotElapsed >= CYCLE) {
          // Slot finished — will be replaced
          continue
        }

        live.push({ region: slot.region, opacity })
        stillActive.push(slot)
      }

      // Replace finished slots
      while (stillActive.length < MAX_SLOTS) {
        const picked = pickRegion()
        if (!picked) break
        const newSlot: Slot = { region: picked, startTime: now }
        stillActive.push(newSlot)
        live.push({ region: picked, opacity: 0 })
        usedIndices.current.add(regions.indexOf(picked))
      }

      activeSlots.current = stillActive
      setSlots(live.filter((s) => s.opacity > 0))
      rafRef.current = requestAnimationFrame(tick)
    },
    [regions, pickRegion],
  )

  useEffect(() => {
    if (regions.length === 0) return
    baseTimeRef.current = 0
    activeSlots.current = []
    usedIndices.current.clear()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick, regions])

  const pause = useCallback(() => {
    pausedRef.current = true
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    baseTimeRef.current = 0
    activeSlots.current = []
    usedIndices.current.clear()
  }, [])

  return { slots, pause, resume }
}
