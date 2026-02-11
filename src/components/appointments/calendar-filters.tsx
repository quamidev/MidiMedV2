/**
 * CalendarFilters - Multi-select filters for calendar appointments
 *
 * Features:
 * - Patient multi-select with debounced search
 * - Provider multi-select dropdown with color indicators
 * - Clear all filters button
 * - Compact horizontal layout on desktop, stacked on mobile
 * - Smooth animations and refined styling
 *
 * Created: 2026-02-10 - MV2-026 Calendar Filters
 */

'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import {
  Search,
  User,
  Users,
  X,
  Check,
  ChevronDown,
  Loader2,
  Filter,
  XCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getPatients } from '@/actions/patients'
import { getTeamMembers } from '@/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import type { Patient, User as AppUser } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

export interface CalendarFiltersProps {
  onFiltersChange: (filters: { patientIds: string[]; providerIds: string[] }) => void
  className?: string
}

interface PatientOption {
  id: string
  name: string
  patientNumber: string
}

interface ProviderOption {
  id: string
  name: string
  color: string
}

// =============================================================================
// Helpers
// =============================================================================

function formatPatientNumber(num: number): string {
  return `PAT-${num.toString().padStart(6, '0')}`
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// =============================================================================
// Patient Multi-Select Component
// =============================================================================

interface PatientMultiSelectProps {
  selectedPatients: PatientOption[]
  onSelectionChange: (patients: PatientOption[]) => void
}

function PatientMultiSelect({
  selectedPatients,
  onSelectionChange,
}: PatientMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState<PatientOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Search patients
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
          }))
          setOptions(patientOptions)
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

  const handleTogglePatient = useCallback(
    (patient: PatientOption) => {
      const isSelected = selectedPatients.some((p) => p.id === patient.id)
      if (isSelected) {
        onSelectionChange(selectedPatients.filter((p) => p.id !== patient.id))
      } else {
        onSelectionChange([...selectedPatients, patient])
      }
    },
    [selectedPatients, onSelectionChange]
  )

  const handleRemovePatient = useCallback(
    (patientId: string) => {
      onSelectionChange(selectedPatients.filter((p) => p.id !== patientId))
    },
    [selectedPatients, onSelectionChange]
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            'h-10 min-w-[180px] justify-between gap-2',
            'border-border/60 bg-background/50 backdrop-blur-sm',
            'hover:bg-accent/50 hover:border-border',
            'transition-all duration-200',
            selectedPatients.length > 0 && 'border-primary/30 bg-primary/5'
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            {selectedPatients.length === 0 ? (
              <span className="text-muted-foreground">Pacientes</span>
            ) : (
              <span className="truncate font-medium">
                {selectedPatients.length} seleccionado{selectedPatients.length !== 1 && 's'}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0 overflow-hidden"
        align="start"
        sideOffset={4}
      >
        {/* Search input */}
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente..."
              className="pl-9 h-9"
              autoFocus
            />
          </div>
        </div>

        {/* Selected patients */}
        {selectedPatients.length > 0 && (
          <div className="p-2 border-b border-border/50 flex flex-wrap gap-1.5">
            {selectedPatients.map((patient) => (
              <span
                key={patient.id}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
                  'bg-primary/10 text-primary text-xs font-medium',
                  'transition-all duration-200'
                )}
              >
                {patient.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePatient(patient.id)
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Options list */}
        <div className="max-h-[240px] overflow-y-auto p-1">
          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = selectedPatients.some((p) => p.id === option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleTogglePatient(option)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-2.5 text-left',
                    'transition-colors duration-150',
                    'hover:bg-accent focus:bg-accent focus:outline-none',
                    isSelected && 'bg-primary/5'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border',
                      'transition-all duration-200',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-background'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
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
              )
            })
          ) : searchQuery.length >= 2 ? (
            <div className="py-6 text-center">
              <User className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No se encontraron pacientes
              </p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Escribe al menos 2 caracteres
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// =============================================================================
// Provider Multi-Select Component
// =============================================================================

interface ProviderMultiSelectProps {
  providers: ProviderOption[]
  selectedProviders: ProviderOption[]
  onSelectionChange: (providers: ProviderOption[]) => void
  isLoading?: boolean
}

function ProviderMultiSelect({
  providers,
  selectedProviders,
  onSelectionChange,
  isLoading = false,
}: ProviderMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleProvider = useCallback(
    (provider: ProviderOption) => {
      const isSelected = selectedProviders.some((p) => p.id === provider.id)
      if (isSelected) {
        onSelectionChange(selectedProviders.filter((p) => p.id !== provider.id))
      } else {
        onSelectionChange([...selectedProviders, provider])
      }
    },
    [selectedProviders, onSelectionChange]
  )

  const handleRemoveProvider = useCallback(
    (providerId: string) => {
      onSelectionChange(selectedProviders.filter((p) => p.id !== providerId))
    },
    [selectedProviders, onSelectionChange]
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={isLoading}
          className={cn(
            'h-10 min-w-[180px] justify-between gap-2',
            'border-border/60 bg-background/50 backdrop-blur-sm',
            'hover:bg-accent/50 hover:border-border',
            'transition-all duration-200',
            selectedProviders.length > 0 && 'border-primary/30 bg-primary/5'
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isLoading ? (
              <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            {selectedProviders.length === 0 ? (
              <span className="text-muted-foreground">Proveedores</span>
            ) : (
              <span className="truncate font-medium">
                {selectedProviders.length} seleccionado{selectedProviders.length !== 1 && 's'}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 overflow-hidden"
        align="start"
        sideOffset={4}
      >
        {/* Selected providers */}
        {selectedProviders.length > 0 && (
          <div className="p-2 border-b border-border/50 flex flex-wrap gap-1.5">
            {selectedProviders.map((provider) => (
              <span
                key={provider.id}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                  'bg-muted text-foreground text-xs font-medium',
                  'transition-all duration-200'
                )}
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: provider.color }}
                />
                {provider.name.split(' ')[0]}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveProvider(provider.id)
                  }}
                  className="hover:bg-background/50 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Options list */}
        <div className="max-h-[280px] overflow-y-auto p-1">
          {providers.length > 0 ? (
            providers.map((provider) => {
              const isSelected = selectedProviders.some((p) => p.id === provider.id)
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleToggleProvider(provider)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-2.5 text-left',
                    'transition-colors duration-150',
                    'hover:bg-accent focus:bg-accent focus:outline-none',
                    isSelected && 'bg-primary/5'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border',
                      'transition-all duration-200',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-background'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-background"
                    style={{ backgroundColor: provider.color }}
                  />
                  <span className="font-medium text-sm text-foreground truncate flex-1">
                    {provider.name}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="py-6 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay proveedores disponibles
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function CalendarFilters({
  onFiltersChange,
  className,
}: CalendarFiltersProps) {
  const [selectedPatients, setSelectedPatients] = useState<PatientOption[]>([])
  const [selectedProviders, setSelectedProviders] = useState<ProviderOption[]>([])
  const [providers, setProviders] = useState<ProviderOption[]>([])
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)

  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      setIsLoadingProviders(true)
      try {
        const result = await getTeamMembers()
        if (result.success) {
          const providerOptions: ProviderOption[] = result.data.map((u) => ({
            id: u.id,
            name: u.display_name,
            color: u.color || '#3abdd4',
          }))
          setProviders(providerOptions)
        }
      } catch (error) {
        console.error('Error loading providers:', error)
      } finally {
        setIsLoadingProviders(false)
      }
    }

    loadProviders()
  }, [])

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange({
      patientIds: selectedPatients.map((p) => p.id),
      providerIds: selectedProviders.map((p) => p.id),
    })
  }, [selectedPatients, selectedProviders, onFiltersChange])

  const hasActiveFilters = selectedPatients.length > 0 || selectedProviders.length > 0

  const handleClearFilters = useCallback(() => {
    setSelectedPatients([])
    setSelectedProviders([])
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3',
        className
      )}
    >
      {/* Filter icon label - visible on desktop */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtrar:</span>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <PatientMultiSelect
          selectedPatients={selectedPatients}
          onSelectionChange={setSelectedPatients}
        />
        <ProviderMultiSelect
          providers={providers}
          selectedProviders={selectedProviders}
          onSelectionChange={setSelectedProviders}
          isLoading={isLoadingProviders}
        />

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className={cn(
              'h-10 gap-1.5 text-muted-foreground',
              'hover:text-destructive hover:bg-destructive/10',
              'transition-all duration-200'
            )}
          >
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar filtros</span>
          </Button>
        )}
      </div>
    </div>
  )
}
