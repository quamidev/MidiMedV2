/**
 * CalendarToolbar - Custom toolbar for react-big-calendar
 *
 * Features:
 * - Navigation controls (back, today, forward)
 * - View switcher (Month/Week/Day) with pill-style toggle
 * - Current date display with elegant formatting
 * - Responsive design: compact on mobile, full on desktop
 * - Spanish localization
 *
 * Created: 2026-02-10 - MV2-022 Calendar Component
 */

'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ToolbarProps, View } from 'react-big-calendar'

import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalendarToolbarProps = ToolbarProps<any, any> & {
  className?: string
}

const VIEW_OPTIONS: { value: View; label: string; shortLabel: string }[] = [
  { value: 'month', label: 'Mes', shortLabel: 'M' },
  { value: 'week', label: 'Semana', shortLabel: 'S' },
  { value: 'day', label: 'Dia', shortLabel: 'D' },
]

export function CalendarToolbar({
  date,
  view,
  onNavigate,
  onView,
  className,
}: CalendarToolbarProps) {
  const formattedDate = useMemo(() => {
    if (view === 'day') {
      return format(date, "EEEE, d 'de' MMMM yyyy", { locale: es })
    }
    if (view === 'week') {
      return format(date, "MMMM yyyy", { locale: es })
    }
    return format(date, 'MMMM yyyy', { locale: es })
  }, [date, view])

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* Left side: Navigation + Date */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-muted-foreground transition-all duration-200',
              'hover:bg-accent hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className={cn(
              'flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5',
              'text-sm font-medium text-muted-foreground transition-all duration-200',
              'hover:bg-accent hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Calendar className="hidden h-3.5 w-3.5 sm:block" />
            <span>Hoy</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-muted-foreground transition-all duration-200',
              'hover:bg-accent hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Current date display */}
        <h2 className="text-base font-semibold text-foreground sm:text-lg">
          {capitalizedDate}
        </h2>
      </div>

      {/* Right side: View switcher */}
      <div className="flex items-center">
        <div className="flex rounded-lg border border-border/60 bg-background p-1 shadow-sm">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onView(option.value)}
              className={cn(
                'relative flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                view === option.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {/* Show short label on mobile, full label on desktop */}
              <span className="sm:hidden">{option.shortLabel}</span>
              <span className="hidden sm:block">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
