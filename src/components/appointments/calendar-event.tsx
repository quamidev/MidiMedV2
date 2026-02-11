/**
 * CalendarEvent - Custom event component for react-big-calendar
 *
 * Features:
 * - Provider color-coded left border accent
 * - Patient name + time display
 * - Cancelled appointments: reduced opacity + grayscale
 * - Hover state with subtle lift effect
 * - Responsive text sizing for different views
 * - Dark mode support
 *
 * Created: 2026-02-10 - MV2-022 Calendar Component
 */

'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AppointmentWithRelations } from '@/types/app'

export interface CalendarEventData {
  id: string
  title: string
  start: Date
  end: Date
  resource: AppointmentWithRelations
}

interface CalendarEventProps {
  event: CalendarEventData
  className?: string
}

export function CalendarEvent({ event, className }: CalendarEventProps) {
  const appointment = event.resource
  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'

  const timeDisplay = useMemo(() => {
    return format(event.start, 'HH:mm', { locale: es })
  }, [event.start])

  return (
    <div
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-md',
        'border-l-[3px] bg-card/95 px-1.5 py-1',
        'transition-all duration-200',
        'hover:shadow-md hover:ring-1 hover:ring-border/50',
        isCancelled && 'opacity-50 grayscale',
        isCompleted && 'opacity-80',
        className
      )}
      style={{
        borderLeftColor: appointment.provider_color || '#3abdd4',
        backgroundColor: `color-mix(in oklch, ${appointment.provider_color || '#3abdd4'} 8%, var(--card))`,
      }}
    >
      {/* Event content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Time badge */}
        <span
          className={cn(
            'text-[10px] font-semibold leading-none tracking-wide',
            'text-foreground/70'
          )}
        >
          {timeDisplay}
        </span>

        {/* Patient name */}
        <span
          className={cn(
            'truncate text-xs font-medium leading-tight text-foreground',
            isCancelled && 'line-through decoration-muted-foreground/50'
          )}
        >
          {appointment.patient_name}
        </span>
      </div>

      {/* Status indicator dot */}
      {isCompleted && (
        <div
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500"
          title="Completada"
        />
      )}
      {isCancelled && (
        <div
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
          title="Cancelada"
        />
      )}

      {/* Hover accent line at bottom */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-0.5 opacity-0',
          'transition-opacity duration-200',
          'group-hover:opacity-100'
        )}
        style={{ backgroundColor: appointment.provider_color || '#3abdd4' }}
      />
    </div>
  )
}

/**
 * Wrapper component for agenda view events
 * Shows more detailed information in list format
 */
export function CalendarAgendaEvent({ event }: { event: CalendarEventData }) {
  const appointment = event.resource
  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'

  const timeRange = useMemo(() => {
    const start = format(event.start, 'HH:mm', { locale: es })
    const end = format(event.end, 'HH:mm', { locale: es })
    return `${start} - ${end}`
  }, [event.start, event.end])

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3',
        'transition-all duration-200',
        'hover:border-border hover:shadow-sm',
        isCancelled && 'opacity-50 grayscale'
      )}
    >
      {/* Provider color indicator */}
      <div
        className="h-10 w-1 flex-shrink-0 rounded-full"
        style={{ backgroundColor: appointment.provider_color || '#3abdd4' }}
      />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'font-medium text-foreground',
            isCancelled && 'line-through decoration-muted-foreground/50'
          )}
        >
          {appointment.patient_name}
        </span>
        <span className="text-sm text-muted-foreground">{timeRange}</span>
      </div>

      {/* Status badge */}
      {isCompleted && (
        <span className="flex-shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Completada
        </span>
      )}
      {isCancelled && (
        <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Cancelada
        </span>
      )}
    </div>
  )
}
