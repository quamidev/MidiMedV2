/**
 * Patient Appointments Component
 *
 * Displays upcoming and past appointments with status badges.
 * Features a clean timeline-inspired design with clear status indicators.
 *
 * Created: 2026-02-10 - MV2-018 Patient Detail Page
 */

'use client'

import { useMemo } from 'react'
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  ChevronRight,
  CalendarDays,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/app'

interface PatientAppointmentsProps {
  appointments: Appointment[]
  className?: string
}

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string
    icon: typeof CheckCircle2
    className: string
    bgClassName: string
  }
> = {
  scheduled: {
    label: 'Programada',
    icon: CalendarClock,
    className: 'text-blue-600 dark:text-blue-400',
    bgClassName: 'bg-blue-100 dark:bg-blue-500/20',
  },
  completed: {
    label: 'Completada',
    icon: CheckCircle2,
    className: 'text-emerald-600 dark:text-emerald-400',
    bgClassName: 'bg-emerald-100 dark:bg-emerald-500/20',
  },
  cancelled: {
    label: 'Cancelada',
    icon: XCircle,
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-100 dark:bg-red-500/20',
  },
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const config = statusConfig[appointment.status as AppointmentStatus]
  const StatusIcon = config.icon

  const startDate = parseISO(appointment.scheduled_start)
  const endDate = parseISO(appointment.scheduled_end)

  const dateLabel = useMemo(() => {
    if (isToday(startDate)) return 'Hoy'
    if (isTomorrow(startDate)) return 'Manana'
    return format(startDate, "EEEE d 'de' MMMM", { locale: es })
  }, [startDate])

  const timeRange = `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`

  const isUpcoming = appointment.status === 'scheduled' && !isPast(startDate)

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-200 md:gap-4 md:p-4',
        isUpcoming
          ? 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
          : 'border-border/50 bg-card hover:border-border hover:bg-muted/30'
      )}
    >
      {/* Date indicator */}
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg md:h-14 md:w-14',
          isUpcoming
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <span className="text-lg font-bold leading-none md:text-xl">
          {format(startDate, 'd')}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide md:text-xs">
          {format(startDate, 'MMM', { locale: es })}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium capitalize text-foreground md:text-base">
              {dateLabel}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
              <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
              {timeRange}
            </div>
          </div>

          {/* Status badge */}
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium md:px-2.5 md:py-1',
              config.bgClassName,
              config.className
            )}
          >
            <StatusIcon className="h-3 w-3" />
            <span className="hidden sm:inline">{config.label}</span>
          </div>
        </div>

        {/* Reason */}
        {appointment.reason && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground md:text-sm">
            {appointment.reason}
          </p>
        )}
      </div>

      {/* Arrow indicator for clickable feeling */}
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground md:h-5 md:w-5" />
    </div>
  )
}

export function PatientAppointments({
  appointments,
  className,
}: PatientAppointmentsProps) {
  const { upcoming, past } = useMemo(() => {
    const upcoming: Appointment[] = []
    const past: Appointment[] = []

    for (const apt of appointments) {
      const startDate = parseISO(apt.scheduled_start)
      if (apt.status === 'scheduled' && !isPast(startDate)) {
        upcoming.push(apt)
      } else {
        past.push(apt)
      }
    }

    // Sort upcoming by date ascending (nearest first)
    upcoming.sort(
      (a, b) =>
        parseISO(a.scheduled_start).getTime() - parseISO(b.scheduled_start).getTime()
    )

    // Past are already sorted by descending date from server

    return { upcoming, past }
  }, [appointments])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upcoming Appointments */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shadow-sm">
            <Calendar className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground md:text-base">
              Proximas citas
            </h2>
            <p className="text-xs text-muted-foreground">
              {upcoming.length === 0
                ? 'Sin citas programadas'
                : `${upcoming.length} cita${upcoming.length !== 1 ? 's' : ''} pendiente${upcoming.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="p-3 md:p-4">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Sin citas programadas
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Las proximas citas apareceran aqui
              </p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {upcoming.slice(0, 3).map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
              {upcoming.length > 3 && (
                <p className="py-2 text-center text-xs font-medium text-primary">
                  +{upcoming.length - 3} citas mas
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Past Appointments */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted shadow-sm">
            <Clock className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground md:text-base">
              Historial de citas
            </h2>
            <p className="text-xs text-muted-foreground">
              {past.length === 0
                ? 'Sin historial'
                : `${past.length} cita${past.length !== 1 ? 's' : ''} anteriore${past.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="p-3 md:p-4">
          {past.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Sin historial de citas
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Las citas pasadas apareceran aqui
              </p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {past.slice(0, 5).map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
              {past.length > 5 && (
                <p className="py-2 text-center text-xs font-medium text-muted-foreground">
                  +{past.length - 5} citas anteriores
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PatientAppointmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Upcoming skeleton */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-3 p-3 md:p-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border/50 p-3 md:gap-4 md:p-4"
            >
              <div className="h-11 w-11 animate-pulse rounded-lg bg-muted md:h-14 md:w-14" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past skeleton */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-3 p-3 md:p-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border/50 p-3 md:gap-4 md:p-4"
            >
              <div className="h-11 w-11 animate-pulse rounded-lg bg-muted md:h-14 md:w-14" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
