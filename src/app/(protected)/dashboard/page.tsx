/**
 * Dashboard Page
 *
 * Main dashboard for authenticated users displaying the appointment calendar.
 * Shows a personalized greeting with appointment summary on mobile (Day view),
 * and a full calendar on desktop (Month view).
 *
 * Created: 2026-02-10 - MV2-014 Dashboard Page Shell
 * Updated: 2026-02-10 - MV2-022 Integrated appointment calendar
 * Updated: 2026-02-10 - MV2-057 Added onboarding card for new users
 */

'use client'

import { useCallback } from 'react'
import { Calendar, Users, Activity } from 'lucide-react'
import type { SlotInfo } from 'react-big-calendar'

import { useUser } from '@/contexts/user-context'
import { cn } from '@/lib/utils'
import {
  DashboardHeader,
  DashboardHeaderSkeleton,
} from '@/components/appointments/dashboard-header'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { OnboardingCard } from '@/components/onboarding/onboarding-card'
import { useOnboarding } from '@/hooks/use-onboarding'
import { Skeleton } from '@/components/ui/skeleton'
import type { AppointmentWithRelations } from '@/types/app'

/**
 * Calendar skeleton for loading state
 */
function CalendarLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-8 rounded" />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton
              key={`cell-${i}`}
              className={cn('h-20 rounded-lg', i % 7 >= 5 && 'opacity-50')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Quick stats cards for desktop view
 */
function QuickStats({ isLoading = false }: { isLoading?: boolean }) {
  const stats = [
    {
      label: 'Citas hoy',
      value: '0',
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pacientes activos',
      value: '--',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Esta semana',
      value: '--',
      icon: Activity,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-6 w-8 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-300 hover:border-border hover:shadow-md"
          >
            {/* Subtle hover gradient */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div
                className="absolute -right-10 -top-10 h-24 w-24 blur-2xl"
                style={{
                  background: `radial-gradient(circle, ${stat.color.replace('text-', 'oklch(62% 0.12 195 / 0.15)')}, transparent)`,
                }}
              />
            </div>

            <div className="relative flex items-center gap-3">
              <div className={cn('rounded-lg p-2.5', stat.bgColor)}>
                <Icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Main Dashboard Page Component
 */
export default function DashboardPage() {
  const { user, loading, dataLoading } = useUser()
  const { isComplete: onboardingComplete } = useOnboarding()

  const isLoading = loading || dataLoading

  const handleEventClick = useCallback((appointment: AppointmentWithRelations) => {
    // TODO: Open appointment detail modal in future ticket
    console.log('Selected appointment:', appointment)
  }, [])

  const handleSlotSelect = useCallback((slotInfo: SlotInfo) => {
    // TODO: Open create appointment modal in future ticket
    console.log('Selected slot:', slotInfo)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile View */}
      <div className="md:hidden">
        {isLoading || !user ? (
          <>
            <DashboardHeaderSkeleton />
            <div className="px-4 pb-20">
              <CalendarLoadingSkeleton />
            </div>
          </>
        ) : (
          <>
            <DashboardHeader
              displayName={user.display_name}
              appointmentCount={0}
            />
            <div className="space-y-4 px-4 pb-20">
              {/* Onboarding card for new users */}
              {!onboardingComplete && <OnboardingCard />}

              <AppointmentCalendar
                onEventClick={handleEventClick}
                onSlotSelect={handleSlotSelect}
                initialView="day"
              />
            </div>
          </>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          {/* Welcome header for desktop */}
          {isLoading || !user ? (
            <div className="animate-pulse">
              <div className="h-8 w-64 rounded-lg bg-muted" />
              <div className="mt-2 h-5 w-40 rounded bg-muted" />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Bienvenido,{' '}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {user.display_name.split(' ')[0]}
                </span>
              </h1>
              <p className="mt-1 text-muted-foreground">
                Panel de control de tu clinica
              </p>
            </div>
          )}

          {/* Onboarding card for new users */}
          {!isLoading && !onboardingComplete && (
            <OnboardingCard className="max-w-2xl" />
          )}

          {/* Quick stats */}
          <QuickStats isLoading={isLoading} />

          {/* Calendar */}
          {isLoading ? (
            <CalendarLoadingSkeleton />
          ) : (
            <AppointmentCalendar
              onEventClick={handleEventClick}
              onSlotSelect={handleSlotSelect}
              initialView="month"
            />
          )}
        </div>
      </div>
    </div>
  )
}
