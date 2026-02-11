/**
 * Dashboard Header Component for Mobile View
 *
 * Displays personalized greeting based on time of day, formatted date in Spanish,
 * and appointment count summary. Features a warm clinical aesthetic with
 * subtle gradient background and smooth animations.
 *
 * Created: 2026-02-10 - MV2-014 Dashboard Page Shell
 */

'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Sun, Moon, Sunrise } from 'lucide-react'

import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  /** User's display name for personalized greeting */
  displayName: string
  /** Number of appointments for today (placeholder for now) */
  appointmentCount?: number
  /** Whether data is still loading */
  isLoading?: boolean
  /** Optional className for custom styling */
  className?: string
}

/**
 * Returns appropriate greeting based on current hour
 */
function getGreeting(hour: number): {
  text: string
  icon: typeof Sun
  iconClass: string
} {
  if (hour >= 5 && hour < 12) {
    return {
      text: 'Buenos dias',
      icon: Sunrise,
      iconClass: 'text-amber-500',
    }
  } else if (hour >= 12 && hour < 19) {
    return {
      text: 'Buenas tardes',
      icon: Sun,
      iconClass: 'text-orange-400',
    }
  } else {
    return {
      text: 'Buenas noches',
      icon: Moon,
      iconClass: 'text-indigo-400',
    }
  }
}

/**
 * Extracts first name from display name for a more personal greeting
 */
function getFirstName(displayName: string): string {
  return displayName.split(' ')[0] ?? displayName
}

export function DashboardHeader({
  displayName,
  appointmentCount = 0,
  isLoading = false,
  className,
}: DashboardHeaderProps) {
  const now = useMemo(() => new Date(), [])
  const greeting = useMemo(() => getGreeting(now.getHours()), [now])
  const firstName = useMemo(() => getFirstName(displayName), [displayName])
  const formattedDate = useMemo(
    () => format(now, "EEEE, d 'de' MMMM", { locale: es }),
    [now]
  )

  const GreetingIcon = greeting.icon

  if (isLoading) {
    return (
      <div className={cn('px-4 py-6', className)}>
        <div className="animate-pulse space-y-3">
          {/* Greeting skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-7 w-48 rounded-lg bg-muted" />
          </div>
          {/* Date skeleton */}
          <div className="h-5 w-36 rounded-md bg-muted" />
          {/* Appointment count skeleton */}
          <div className="mt-4 flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden px-4 py-6',
        // Subtle gradient background for warmth
        'bg-gradient-to-br from-primary/5 via-transparent to-primary/3',
        className
      )}
    >
      {/* Decorative background element */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, oklch(62% 0.12 195 / 0.4), transparent)',
        }}
      />

      {/* Greeting */}
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <GreetingIcon
            className={cn(
              'h-5 w-5 transition-transform duration-500',
              greeting.iconClass
            )}
            style={{
              animation: 'gentle-pulse 3s ease-in-out infinite',
            }}
          />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting.text},{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
        </div>

        {/* Date */}
        <p className="mt-1.5 text-sm capitalize text-muted-foreground">
          {formattedDate}
        </p>

        {/* Appointment summary */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex h-8 items-center gap-2 rounded-full bg-primary/10 px-3 transition-colors hover:bg-primary/15">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {appointmentCount === 0
                ? 'Sin citas para hoy'
                : appointmentCount === 1
                  ? '1 cita hoy'
                  : `${appointmentCount} citas hoy`}
            </span>
          </div>
        </div>
      </div>

      {/* CSS for gentle pulse animation */}
      <style jsx>{`
        @keyframes gentle-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Skeleton loader for DashboardHeader
 * Use when the entire header section is loading
 */
export function DashboardHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('px-4 py-6', className)}>
      <div className="animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-muted" />
          <div className="h-7 w-48 rounded-lg bg-muted" />
        </div>
        <div className="h-5 w-36 rounded-md bg-muted" />
        <div className="mt-4 flex items-center gap-2">
          <div className="h-8 w-32 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}
