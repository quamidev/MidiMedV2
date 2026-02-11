/**
 * PatientAutocomplete - Search and select patients with debounced autocomplete
 *
 * Features:
 * - Debounced search (300ms) using getPatients action
 * - Displays patient name and patient number (PAT-XXXXXX)
 * - Loading states with skeleton animation
 * - Empty state for no results
 * - Full keyboard navigation (arrows, enter, escape)
 * - Popover-based dropdown for accessibility
 *
 * Created: 2026-02-10 - MV2-023 Create Appointment Modal
 */

'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { Search, User, Loader2, UserX } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getPatients } from '@/actions/patients'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import type { Patient } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface PatientAutocompleteProps {
  value: Patient | null
  onChange: (patient: Patient | null) => void
  error?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

interface PatientOption {
  id: string
  name: string
  patientNumber: string
  email: string | null
  phone: string | null
  patient: Patient
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Formats patient number for display: PAT-000001
 */
function formatPatientNumber(num: number): string {
  return `PAT-${num.toString().padStart(6, '0')}`
}

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// =============================================================================
// Component
// =============================================================================

export function PatientAutocomplete({
  value,
  onChange,
  error = false,
  disabled = false,
  placeholder = 'Buscar paciente...',
  className,
}: PatientAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState<PatientOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Format display value when a patient is selected
  const displayValue = useMemo(() => {
    if (value) {
      return `${value.first_name} ${value.last_name}`.trim()
    }
    return searchQuery
  }, [value, searchQuery])

  // Search patients when debounced query changes
  useEffect(() => {
    const searchPatients = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setOptions([])
        return
      }

      setIsLoading(true)

      try {
        const result = await getPatients({
          search: debouncedQuery,
          page: 1,
          limit: 10,
        })

        if (result.success) {
          const patientOptions: PatientOption[] = result.data.patients.map((p) => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`.trim(),
            patientNumber: formatPatientNumber(p.patient_number),
            email: p.email,
            phone: p.phone,
            patient: p,
          }))
          setOptions(patientOptions)
          setHighlightedIndex(-1)
        } else {
          setOptions([])
        }
      } catch (error) {
        console.error('Patient search error:', error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    }

    searchPatients()
  }, [debouncedQuery])

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setSearchQuery(newValue)

      // Clear selection if user is typing
      if (value && newValue !== `${value.first_name} ${value.last_name}`.trim()) {
        onChange(null)
      }

      // Open dropdown if there's input
      if (newValue.length >= 2) {
        setIsOpen(true)
      }
    },
    [value, onChange]
  )

  // Handle option selection
  const handleSelectOption = useCallback(
    (option: PatientOption) => {
      onChange(option.patient)
      setSearchQuery(option.name)
      setIsOpen(false)
      setHighlightedIndex(-1)
      inputRef.current?.blur()
    },
    [onChange]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' && searchQuery.length >= 2) {
          setIsOpen(true)
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && options[highlightedIndex]) {
            handleSelectOption(options[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, options, highlightedIndex, handleSelectOption, searchQuery]
  )

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // Handle focus
  const handleFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setIsOpen(true)
    }
  }, [searchQuery])

  // Handle blur with delay to allow click selection
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }, 200)
  }, [])

  // Clear selection
  const handleClear = useCallback(() => {
    onChange(null)
    setSearchQuery('')
    setOptions([])
    inputRef.current?.focus()
  }, [onChange])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative', className)}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            error={error}
            placeholder={placeholder}
            className="pl-10 pr-10"
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="sr-only">Limpiar</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div ref={listRef} className="max-h-[280px] overflow-y-auto">
          {isLoading ? (
            // Loading skeleton
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-3 animate-pulse"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : options.length > 0 ? (
            // Results list
            <div className="p-1">
              {options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                    'hover:bg-accent focus:bg-accent focus:outline-none',
                    highlightedIndex === index && 'bg-accent'
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {option.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {option.patientNumber}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No se encontraron pacientes
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Intenta con otro termino de busqueda
              </p>
            </div>
          ) : (
            // Initial state
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                Escribe al menos 2 caracteres para buscar
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
