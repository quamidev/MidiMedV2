/**
 * Working Hours Form Component
 *
 * Configurable per-day working hours with start/end time pickers
 * and toggle for closed days. Supports Spanish day names.
 *
 * Created: 2026-02-10 - MV2-040 Settings Page with Tabs
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Clock, Save, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { updateWorkingHours } from '@/actions/settings'
import type { WorkingHours, DayWorkingHours } from '@/types/app'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// Types & Constants
// =============================================================================

type DayKey = keyof WorkingHours

interface DayConfig {
  key: DayKey
  label: string
  shortLabel: string
}

const DAYS: DayConfig[] = [
  { key: 'mon', label: 'Lunes', shortLabel: 'Lun' },
  { key: 'tue', label: 'Martes', shortLabel: 'Mar' },
  { key: 'wed', label: 'Miercoles', shortLabel: 'Mie' },
  { key: 'thu', label: 'Jueves', shortLabel: 'Jue' },
  { key: 'fri', label: 'Viernes', shortLabel: 'Vie' },
  { key: 'sat', label: 'Sabado', shortLabel: 'Sab' },
  { key: 'sun', label: 'Domingo', shortLabel: 'Dom' },
]

// Generate time options in 30-minute increments
function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      options.push(`${h}:${m}`)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

function formatTime(time: string): string {
  const parts = time.split(':')
  const hours = parts[0] || '0'
  const minutes = parts[1] || '00'
  const h = parseInt(hours, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${displayHour}:${minutes} ${period}`
}

const DEFAULT_HOURS: WorkingHours = {
  mon: ['08:00', '17:00'],
  tue: ['08:00', '17:00'],
  wed: ['08:00', '17:00'],
  thu: ['08:00', '17:00'],
  fri: ['08:00', '17:00'],
  sat: null,
  sun: null,
}

// =============================================================================
// Component
// =============================================================================

export function WorkingHoursForm() {
  const { tenant, refreshUser } = useUser()
  const [saving, setSaving] = useState(false)

  // Initialize from tenant or use defaults
  const [hours, setHours] = useState<WorkingHours>(() => {
    if (tenant?.working_hours) {
      // Ensure all required days exist
      const wh = tenant.working_hours
      return {
        mon: wh.mon ?? DEFAULT_HOURS.mon,
        tue: wh.tue ?? DEFAULT_HOURS.tue,
        wed: wh.wed ?? DEFAULT_HOURS.wed,
        thu: wh.thu ?? DEFAULT_HOURS.thu,
        fri: wh.fri ?? DEFAULT_HOURS.fri,
        sat: wh.sat ?? DEFAULT_HOURS.sat,
        sun: wh.sun ?? DEFAULT_HOURS.sun,
      }
    }
    return DEFAULT_HOURS
  })

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false)

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleToggleDay = useCallback((day: DayKey, isOpen: boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: isOpen ? ['08:00', '17:00'] : null,
    }))
    setHasChanges(true)
  }, [])

  const handleTimeChange = useCallback(
    (day: DayKey, type: 'start' | 'end', value: string) => {
      setHours((prev) => {
        const current = prev[day]
        if (!current) return prev

        const newHours: DayWorkingHours =
          type === 'start' ? [value, current[1]] : [current[0], value]

        return {
          ...prev,
          [day]: newHours,
        }
      })
      setHasChanges(true)
    },
    []
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const result = await updateWorkingHours(hours)

      if (result.success) {
        toast.success('Horarios actualizados')
        await refreshUser()
        setHasChanges(false)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Save working hours error:', error)
      toast.error('Error al guardar horarios')
    } finally {
      setSaving(false)
    }
  }, [hours, refreshUser])

  const handleReset = useCallback(() => {
    if (tenant?.working_hours) {
      const wh = tenant.working_hours
      setHours({
        mon: wh.mon ?? DEFAULT_HOURS.mon,
        tue: wh.tue ?? DEFAULT_HOURS.tue,
        wed: wh.wed ?? DEFAULT_HOURS.wed,
        thu: wh.thu ?? DEFAULT_HOURS.thu,
        fri: wh.fri ?? DEFAULT_HOURS.fri,
        sat: wh.sat ?? DEFAULT_HOURS.sat,
        sun: wh.sun ?? DEFAULT_HOURS.sun,
      })
    } else {
      setHours(DEFAULT_HOURS)
    }
    setHasChanges(false)
  }, [tenant])

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Horarios de atencion</h2>
              <p className="text-xs text-muted-foreground">
                Configura los dias y horas de trabajo
              </p>
            </div>
          </div>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-1" />
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={saving}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {DAYS.map((day, index) => {
            const dayHours = hours[day.key]
            const isOpen = dayHours !== null

            return (
              <motion.div
                key={day.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-xl transition-colors',
                  isOpen
                    ? 'bg-muted/50 border border-border/50'
                    : 'bg-transparent'
                )}
              >
                {/* Day Toggle */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <Switch
                    checked={isOpen}
                    onCheckedChange={(checked) => handleToggleDay(day.key, checked)}
                  />
                  <Label
                    className={cn(
                      'text-sm font-medium cursor-pointer',
                      !isOpen && 'text-muted-foreground'
                    )}
                  >
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.shortLabel}</span>
                  </Label>
                </div>

                {/* Time Pickers */}
                {isOpen && dayHours ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={dayHours[0]}
                      onValueChange={(value) =>
                        handleTimeChange(day.key, 'start', value)
                      }
                    >
                      <SelectTrigger className="w-[110px] h-9 text-sm">
                        <SelectValue placeholder="Inicio">
                          {formatTime(dayHours[0])}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time} className="text-sm">
                            {formatTime(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-muted-foreground text-sm">a</span>

                    <Select
                      value={dayHours[1]}
                      onValueChange={(value) =>
                        handleTimeChange(day.key, 'end', value)
                      }
                    >
                      <SelectTrigger className="w-[110px] h-9 text-sm">
                        <SelectValue placeholder="Fin">
                          {formatTime(dayHours[1])}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time} className="text-sm">
                            {formatTime(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    Cerrado
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Help Text */}
        <p className="mt-4 text-xs text-muted-foreground">
          Los horarios de atencion se muestran en el calendario y ayudan a organizar las citas.
        </p>
      </div>
    </div>
  )
}
