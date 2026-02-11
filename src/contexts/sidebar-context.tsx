/**
 * Sidebar Context
 *
 * Provides sidebar collapsed state to child components for layout coordination.
 * Persists collapsed state in localStorage.
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'midimed-sidebar-collapsed'

interface SidebarContextValue {
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

interface SidebarProviderProps {
  children: React.ReactNode
}

// Read initial value safely (returns false on server)
function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  // Use lazy initialization - returns false on server, reads localStorage on client
  const [collapsed, setCollapsedState] = useState(() => getInitialCollapsed())

  // Update CSS custom property when collapsed state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '64px' : '256px'
    )
  }, [collapsed])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      // localStorage might be unavailable
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const newValue = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(newValue))
      } catch {
        // localStorage might be unavailable
      }
      return newValue
    })
  }, [])

  const value = useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      toggleCollapsed,
      setCollapsed,
    }),
    [collapsed, toggleCollapsed, setCollapsed]
  )

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
