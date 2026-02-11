/**
 * TimeSlotPicker - Time selection dropdown with 10-minute intervals
 *
 * Provides a dropdown-style time picker with:
 * - 10-minute interval slots from 07:00 to 20:00
 * - 24-hour format display (Spanish convention)
 * - Keyboard navigation support
 * - Visual grouping by hour for easier scanning
 *
 * Created: 2026-02-10 - MV2-023 Create Appointment Modal
 */

'use client'

import { useMemo, useCallback } from 'react'
import { Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'

// =============================================================================
// Types
// =============================================================================

interface TimeSlotPickerProps {
  value?: string
  onChange: (value: string) => void
  minTime?: string
  maxTime?: string
  error?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generates time slots in 10-minute intervals
 */
function generateTimeSlots(
  startHour: number = 7,
  endHour: number = 20,
  intervalMinutes: number = 10
): string[] {
  const slots: string[] = []

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      // Stop at endHour:00 (don't include slots after)
      if (hour === endHour && minute > 0) break

      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }

  return slots
}

/**
 * Formats time for display
 */
function formatTimeDisplay(time: string): string {
  const [hourStr, minuteStr] = time.split(':')
  const minute = minuteStr || '00'
  return `${hourStr}:${minute}`
}

/**
 * Gets the hour from a time string for grouping
 */
function getHour(time: string): number {
  return parseInt(time.split(':')[0] || '0', 10)
}

// =============================================================================
// Component
// =============================================================================

export function TimeSlotPicker({
  value,
  onChange,
  minTime = '07:00',
  maxTime = '20:00',
  error = false,
  disabled = false,
  placeholder = 'Seleccionar hora',
  className,
}: TimeSlotPickerProps) {
  // Generate available time slots
  const timeSlots = useMemo(() => {
    const minHour = parseInt(minTime.split(':')[0] || '7', 10)
    const maxHour = parseInt(maxTime.split(':')[0] || '20', 10)
    return generateTimeSlots(minHour, maxHour, 10)
  }, [minTime, maxTime])

  // Group slots by hour for visual organization
  const groupedSlots = useMemo(() => {
    const groups: { hour: number; slots: string[] }[] = []
    let currentHour = -1
    let currentGroup: string[] = []

    for (const slot of timeSlots) {
      const hour = getHour(slot)
      if (hour !== currentHour) {
        if (currentGroup.length > 0) {
          groups.push({ hour: currentHour, slots: currentGroup })
        }
        currentHour = hour
        currentGroup = [slot]
      } else {
        currentGroup.push(slot)
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ hour: currentHour, slots: currentGroup })
    }

    return groups
  }, [timeSlots])

  const handleValueChange = useCallback(
    (newValue: string) => {
      onChange(newValue)
    },
    [onChange]
  )

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        error={error}
        className={cn(
          'w-full',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary/70" />
          <SelectValue placeholder={placeholder}>
            {value ? formatTimeDisplay(value) : placeholder}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[280px]">
        {groupedSlots.map((group, groupIndex) => (
          <div key={group.hour}>
            {groupIndex > 0 && <SelectSeparator className="my-1" />}
            {/* Hour label */}
            <div className="sticky top-0 z-10 bg-popover px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {group.hour < 12
                ? `${group.hour}:00 - Manana`
                : group.hour < 14
                ? `${group.hour}:00 - Mediodia`
                : group.hour < 19
                ? `${group.hour}:00 - Tarde`
                : `${group.hour}:00 - Noche`}
            </div>
            {/* Time slots for this hour */}
            {group.slots.map((slot) => (
              <SelectItem
                key={slot}
                value={slot}
                className="cursor-pointer font-mono text-sm"
              >
                {formatTimeDisplay(slot)}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Calculates end time from start time and duration in minutes
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const [hourStr, minuteStr] = startTime.split(':')
  const startHour = parseInt(hourStr || '0', 10)
  const startMinute = parseInt(minuteStr || '0', 10)

  const totalMinutes = startHour * 60 + startMinute + durationMinutes
  const endHour = Math.floor(totalMinutes / 60)
  const endMinute = totalMinutes % 60

  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
}

/**
 * Checks if a time is within working hours for a given day
 */
export function isWithinWorkingHours(
  time: string,
  workingHours: [string, string] | null
): boolean {
  if (!workingHours) return false

  const [start, end] = workingHours
  const timeMinutes = timeToMinutes(time)
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)

  return timeMinutes >= startMinutes && timeMinutes < endMinutes
}

/**
 * Converts time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hourStr, minuteStr] = time.split(':')
  return parseInt(hourStr || '0', 10) * 60 + parseInt(minuteStr || '0', 10)
}
