import { useState, useEffect, useCallback, useRef } from 'react'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'aaajiao-theme'

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // storage inaccessible (blocked cookies, privacy mode, etc.)
  }
  return null
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const userSetRef = useRef<boolean | null>(null)
  if (userSetRef.current === null) {
    userSetRef.current = getStoredTheme() !== null
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (userSetRef.current) return
      setTheme(e.matches ? 'dark' : 'light')
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    userSetRef.current = true
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // storage inaccessible; keep theme in memory only
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
