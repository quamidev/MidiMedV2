/**
 * MobileAppointmentList - Card-style list of appointments for mobile view
 *
 * Features:
 * - Clean card layout with provider color accent
 * - Shows time, patient name, provider indicator, reason
 * - Tap to show appointment details
 * - Empty state with contextual icon
 * - Loading skeleton animation
 * - Smooth reveal animations
 *
 * Created: 2026-02-10 - MV2-027 Mobile Calendar View
 */

'use client'

import { useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Clock,
  User,
  CalendarX,
  FileText,
  CheckCircle2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { AppointmentWithRelations, AppointmentStatus } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

export interface MobileAppointmentListProps {
  appointments: AppointmentWithRelations[]
  isLoading?: boolean
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
  emptyStateMessage?: string
  className?: string
}

// =============================================================================
// Status Config
// =============================================================================

const statusIcons: Record<AppointmentStatus, React.ReactNode> = {
  scheduled: <Clock className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <CalendarX className="h-3.5 w-3.5" />,
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function AppointmentCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Time skeleton */}
        <div className="flex flex-col items-center">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="mt-1 h-3 w-8" />
        </div>
        {/* Content skeleton */}
        <div className="flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-24" />
          <Skeleton className="mt-2 h-3 w-full" />
        </div>
      </div>
    </div>
  )
}

export function MobileAppointmentListSkeleton({
  count = 3,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <AppointmentCardSkeleton key={i} />
      ))}
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

interface EmptyStateProps {
  message: string
  isCompleted?: boolean
}

function EmptyState({ message, isCompleted = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full mb-4',
          isCompleted
            ? 'bg-emerald-500/10'
            : 'bg-muted'
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        ) : (
          <CalendarX className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium text-foreground">
        {message}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isCompleted
          ? 'Las citas completadas aparecerán aquí'
          : 'Programa una cita para comenzar'}
      </p>
    </div>
  )
}

// =============================================================================
// Appointment Card
// =============================================================================

interface AppointmentCardProps {
  appointment: AppointmentWithRelations
  onClick?: () => void
  index: number
}

function AppointmentCard({ appointment, onClick, index }: AppointmentCardProps) {
  const startTime = new Date(appointment.scheduled_start)
  const endTime = new Date(appointment.scheduled_end)

  const formattedStartTime = format(startTime, 'HH:mm', { locale: es })
  const formattedEndTime = format(endTime, 'HH:mm', { locale: es })

  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-xl border bg-card p-4 text-left',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:border-border',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        'active:scale-[0.98]',
        isCancelled && 'opacity-50 grayscale',
        isCompleted && 'border-emerald-200/50 dark:border-emerald-900/30'
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        borderColor: !isCancelled && !isCompleted
          ? `color-mix(in oklch, ${appointment.provider_color} 20%, var(--border))`
          : undefined,
      }}
    >
      {/* Provider color accent line */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full transition-all duration-200"
        style={{ backgroundColor: appointment.provider_color || '#3abdd4' }}
      />

      <div className="flex gap-4 pl-3">
        {/* Time column */}
        <div className="flex flex-col items-center flex-shrink-0 min-w-[50px]">
          <span className="text-base font-semibold text-foreground">
            {formattedStartTime}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formattedEndTime}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Patient name and status */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">
              {appointment.patient_name}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                appointment.status === 'scheduled' && 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
                appointment.status === 'completed' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                appointment.status === 'cancelled' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              )}
            >
              {statusIcons[appointment.status]}
            </span>
          </div>

          {/* Provider */}
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: appointment.provider_color || '#3abdd4' }}
            />
            <span className="text-xs text-muted-foreground truncate">
              {appointment.provider_name}
            </span>
          </div>

          {/* Reason/Notes */}
          {appointment.reason && (
            <div className="flex items-start gap-1.5 mt-2">
              <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground line-clamp-1">
                {appointment.reason}
              </span>
            </div>
          )}
        </div>

        {/* Chevron indicator */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg
            className="h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function MobileAppointmentList({
  appointments,
  isLoading = false,
  onAppointmentClick,
  emptyStateMessage = 'No hay citas para este día',
  className,
}: MobileAppointmentListProps) {
  const handleCardClick = useCallback(
    (appointment: AppointmentWithRelations) => {
      if (onAppointmentClick) {
        onAppointmentClick(appointment)
      }
    },
    [onAppointmentClick]
  )

  if (isLoading) {
    return <MobileAppointmentListSkeleton className={className} />
  }

  if (appointments.length === 0) {
    return <EmptyState message={emptyStateMessage} />
  }

  return (
    <div className={cn('space-y-3', className)}>
      {appointments.map((appointment, index) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onClick={() => handleCardClick(appointment)}
          index={index}
        />
      ))}
    </div>
  )
}
