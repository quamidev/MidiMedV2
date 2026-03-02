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
 * Updated: 2026-02-10 - QA-009 Unified page layout with consistent padding/max-width
 * Updated: 2026-02-10 - Fix desktop greeting to skip title prefixes (Dr., Dra., etc.)
 * Updated: 2026-02-10 - Wired calendar slot click to CreateAppointmentModal, event click uses built-in popup
 * Updated: 2026-03-02 - AO-008 Added No-shows hoy stat card
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, Users, Activity, UserX } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import type { SlotInfo } from 'react-big-calendar'

import { useUser } from '@/contexts/user-context'
import { cn } from '@/lib/utils'
import { getFirstName } from '@/lib/name-utils'
import { getAppointments } from '@/actions/appointments'
import { getPatients } from '@/actions/patients'
import {
  DashboardHeader,
  DashboardHeaderSkeleton,
} from '@/components/appointments/dashboard-header'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { CreateAppointmentModal } from '@/components/appointments/create-appointment-modal'
import { OnboardingCard } from '@/components/onboarding/onboarding-card'
import { useOnboarding } from '@/hooks/use-onboarding'
import { Skeleton } from '@/components/ui/skeleton'

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
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [weekCount, setWeekCount] = useState<number | null>(null)
  const [patientCount, setPatientCount] = useState<number | null>(null)
  const [noShowCount, setNoShowCount] = useState<number | null>(null)

  useEffect(() => {
    if (isLoading) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

    getAppointments({ startDate: today, endDate: today }).then((res) => {
      if (res.success) {
        setTodayCount(res.data.length)
        setNoShowCount(res.data.filter((a) => a.status === 'no_show').length)
      }
    })

    getAppointments({ startDate: weekStart, endDate: weekEnd }).then((res) => {
      if (res.success) setWeekCount(res.data.length)
    })

    getPatients({ page: 1, limit: 1 }).then((res) => {
      if (res.success) setPatientCount(res.data.total)
    })
  }, [isLoading])

  const stats = [
    {
      label: 'Citas hoy',
      value: todayCount !== null ? String(todayCount) : '--',
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'No-shows hoy',
      value: noShowCount !== null ? String(noShowCount) : '--',
      icon: UserX,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Pacientes activos',
      value: patientCount !== null ? String(patientCount) : '--',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Esta semana',
      value: weekCount !== null ? String(weekCount) : '--',
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

  // Create Appointment modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<SlotInfo | null>(null)
  // Key to force calendar re-fetch after appointment creation
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)

  const handleSlotSelect = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlotInfo(slotInfo)
    setCreateModalOpen(true)
  }, [])

  const handleCreateModalClose = useCallback(() => {
    setCreateModalOpen(false)
    setSelectedSlotInfo(null)
  }, [])

  const handleAppointmentCreated = useCallback(() => {
    setCalendarRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Mobile View */}
      <div className="md:hidden">
        {isLoading || !user ? (
          <>
            <DashboardHeaderSkeleton />
            <CalendarLoadingSkeleton />
          </>
        ) : (
          <>
            <DashboardHeader
              displayName={user.display_name}
              appointmentCount={0}
            />
            <div className="space-y-4">
              {/* Onboarding card for new users */}
              {!onboardingComplete && <OnboardingCard />}

              <AppointmentCalendar
                key={`mobile-cal-${calendarRefreshKey}`}
                onSlotSelect={handleSlotSelect}
                initialView="day"
              />
            </div>
          </>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-6">
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
                {getFirstName(user.display_name)}
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Panel de control de tu clínica
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
            key={`desktop-cal-${calendarRefreshKey}`}
            onSlotSelect={handleSlotSelect}
            initialView="month"
          />
        )}
      </div>

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        open={createModalOpen}
        onClose={handleCreateModalClose}
        onCreated={handleAppointmentCreated}
        slotInfo={selectedSlotInfo}
      />
    </div>
  )
}
