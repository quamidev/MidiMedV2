/**
 * Theme context for MidiMed v2
 * Provides class-based dark mode with localStorage persistence and system preference fallback.
 *
 * Created: 2026-02-10 - Initial implementation (MV2-009)
 */
'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'midimed-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  // Check localStorage first
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage might be blocked or unavailable
  }

  // Fall back to system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  // Lazy initialization - runs once on client, uses default on server
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme ?? 'light'
    return getInitialTheme()
  })

  // Apply theme class to DOM on mount and when theme changes
  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemChange = (e: MediaQueryListEvent) => {
      // Only respond to system changes if user hasn't set a preference
      try {
        const hasStoredPreference = localStorage.getItem(STORAGE_KEY) !== null
        if (!hasStoredPreference) {
          const systemTheme = e.matches ? 'dark' : 'light'
          setThemeState(systemTheme)
        }
      } catch {
        // If localStorage is unavailable, still follow system preference
        const systemTheme = e.matches ? 'dark' : 'light'
        setThemeState(systemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const newTheme = currentTheme === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem(STORAGE_KEY, newTheme)
      } catch {
        // Silently fail if localStorage is unavailable
      }
      return newTheme
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
